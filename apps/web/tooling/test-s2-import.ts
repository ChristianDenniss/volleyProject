import { createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../server/trpc/root";
import { PORTAL_SKIP_REGION_HEADER } from "../lib/region";

const wranglerBin = join(process.cwd(), "node_modules/wrangler/bin/wrangler.js");

const BASE = process.env["SITE_URL"] ?? "http://localhost:3000";
const MASTER =
  "https://docs.google.com/spreadsheets/d/1VIuUsE_uU2GJyR0MjDaiemd5QpvNESn8DzfnX_c_7lo/edit?usp=sharing";
const REGIONAL = {
  na: "https://docs.google.com/spreadsheets/d/1dVRmiP_DYVtXwEyMAyy4NlsO3eDgO0DJiD8_bshgR68/edit?usp=sharing",
  eu: "https://docs.google.com/spreadsheets/d/1WsacHd0FPn_ruabf0fHXVcWQpqKF6j1GtvDRuVUuf2g/edit?usp=sharing",
  as: "https://docs.google.com/spreadsheets/d/1ZegFoCGxYHvwfM8PHAvpB2WlxbfN-SDPVqA8VwnAPkE/edit?usp=sharing",
};
const SEASON_NUMBER = 2;
const START_DATE = "2026-07-01";
const END_DATE = "2026-08-02";
const THEME = "S2 local import test";
const SITE_REGION_ALL = "rvl-region=all";

type CaseResult = { name: string; ok: boolean; detail?: string };

const results: CaseResult[] = [];

function secretFromDevVars(): string {
  const fromEnv = process.env["BETTER_AUTH_SECRET"];
  if (fromEnv) return fromEnv;
  const text = readFileSync(new URL("../.dev.vars", import.meta.url), "utf8");
  const line = text.split(/\r?\n/).find((entry) => entry.startsWith("BETTER_AUTH_SECRET="));
  if (!line) throw new Error("BETTER_AUTH_SECRET missing");
  return line.slice("BETTER_AUTH_SECRET=".length).trim();
}

function cookieFor(token: string): string {
  const signature = createHmac("sha256", secretFromDevVars()).update(token).digest("base64");
  return `better-auth.session_token=${encodeURIComponent(`${token}.${signature}`)}`;
}

const ADMIN_COOKIE = cookieFor("t3-admin-token");
const USER_COOKIE = cookieFor("t3-user-token");

function client(cookie?: string, skipRegion = true) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${BASE}/api/trpc`,
        transformer: superjson,
        headers() {
          const headers: Record<string, string> = {};
          if (cookie) headers["cookie"] = cookie;
          if (skipRegion) headers[PORTAL_SKIP_REGION_HEADER] = "1";
          return headers;
        },
      }),
    ],
  });
}

const admin = client(ADMIN_COOKIE);
const user = client(USER_COOKIE);
const anon = client();

function record(name: string, ok: boolean, detail?: string) {
  results.push({ name, ok, ...(detail ? { detail } : {}) });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

function check(name: string, ok: boolean, detail?: string) {
  record(name, ok, detail);
  return ok;
}

function d1Json(command: string): unknown {
  const raw = execFileSync(
    process.execPath,
    ["--no-warnings", wranglerBin, "d1", "execute", "volley-project", "--local", "--command", command, "--json"],
    { encoding: "utf8" },
  );
  const start = raw.indexOf("[");
  if (start < 0) throw new Error(`No JSON in wrangler output: ${raw.slice(0, 200)}`);
  return JSON.parse(raw.slice(start));
}

function d1Rows<T extends Record<string, unknown>>(command: string): T[] {
  const parsed = d1Json(command) as Array<{ results?: T[] }>;
  return parsed[0]?.results ?? [];
}

function d1Count(command: string): number {
  const rows = d1Rows<{ c?: number; count?: number }>(command);
  const row = rows[0];
  if (!row) return 0;
  return Number(row.c ?? row.count ?? Object.values(row)[0] ?? 0);
}

async function waitForServer() {
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE}/`);
      if (response.ok || response.status === 500) return;
    } catch {
      /* still booting */
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`Dev server did not become ready at ${BASE}`);
}

async function expectReject(name: string, run: () => Promise<unknown>, match?: RegExp) {
  try {
    await run();
    record(name, false, "expected rejection");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const ok = match ? match.test(message) : true;
    record(name, ok, message.slice(0, 180));
  }
}

type Preview = Awaited<ReturnType<typeof admin.sheetImport.assemblePreview.mutate>>;

type StagedSources = {
  masterTeams: unknown[];
  masterGames: unknown[];
  regionalTeams: unknown[];
  regionalBlocks: unknown[];
  sourceWarnings: string[];
};

async function loadPortalPreview(input: {
  seasonNumber: number;
  startDate: string;
  endDate?: string | null;
  theme?: string | null;
  masterUrl?: string;
  regionalUrls: { na?: string; eu?: string; as?: string };
}): Promise<{ preview: Preview; sources: StagedSources; sessionId: string }> {
  const { sessionId } = await admin.sheetImport.startSession.mutate();
  const regionalEntries = (
    [
      ["na", input.regionalUrls.na],
      ["eu", input.regionalUrls.eu],
      ["as", input.regionalUrls.as],
    ] as const
  ).filter((entry): entry is ["na" | "eu" | "as", string] => Boolean(entry[1]));

  let masterTeams: StagedSources["masterTeams"] = [];
  let masterGames: StagedSources["masterGames"] = [];
  const regionalTeams: StagedSources["regionalTeams"] = [];
  const regionalBlocks: StagedSources["regionalBlocks"] = [];
  const sourceWarnings: string[] = [];

  if (input.masterUrl) {
    console.log("  loading master sheet…");
    const master = await admin.sheetImport.loadMaster.mutate({
      url: input.masterUrl,
      sessionId,
      startDate: input.startDate,
    });
    masterTeams = master.teams;
    masterGames = master.games;
    sourceWarnings.push(...master.warnings);
    console.log(
      `  master: ${master.tabCount} tabs, ${master.teams.length} teams, ${master.games.length} games`,
    );
  }

  for (const [region, url] of regionalEntries) {
    let startIndex = 0;
    let teamsLoaded = 0;
    let blocksLoaded = 0;
    for (;;) {
      const batch = await admin.sheetImport.loadRegionalBatch.mutate({
        url,
        region,
        startIndex,
        batchSize: 4,
        sessionId,
      });
      teamsLoaded += batch.teams.length;
      blocksLoaded += batch.blocks.length;
      regionalTeams.push(...batch.teams);
      regionalBlocks.push(...batch.blocks);
      sourceWarnings.push(...batch.warnings);
      process.stdout.write(
        `\r  ${region.toUpperCase()} tabs ${Math.min(batch.nextIndex, batch.tabCount)}/${batch.tabCount}   `,
      );
      if (batch.done) break;
      startIndex = batch.nextIndex;
    }
    console.log(`\n  ${region.toUpperCase()}: ${teamsLoaded} teams, ${blocksLoaded} blocks`);
  }

  console.log("  assembling preview…");
  const preview = await admin.sheetImport.assemblePreview.mutate({
    mode: "full",
    seasonNumber: input.seasonNumber,
    startDate: input.startDate,
    endDate: input.endDate ?? null,
    theme: input.theme ?? null,
    sessionId,
  });

  return {
    preview,
    sources: { masterTeams, masterGames, regionalTeams, regionalBlocks, sourceWarnings },
    sessionId,
  };
}

async function seasonCounts(seasonId: number) {
  return {
    teams: d1Count(`select count(*) as c from teams where season_id = ${seasonId}`),
    games: d1Count(`select count(*) as c from games where season_id = ${seasonId}`),
    stats: d1Count(
      `select count(*) as c from stats where game_id in (select id from games where season_id = ${seasonId})`,
    ),
    roster: d1Count(
      `select count(*) as c from teams_players where team_id in (select id from teams where season_id = ${seasonId})`,
    ),
    leadership: d1Count(
      `select count(*) as c from teams_players where role is not null and team_id in (select id from teams where season_id = ${seasonId})`,
    ),
    twoSlotGames: d1Count(
      `select count(*) as c from (select game_id from teams_games where game_id in (select id from games where season_id = ${seasonId}) group by game_id having count(*) = 2)`,
    ),
    orphanGames: d1Count(
      `select count(*) as c from games where season_id = ${seasonId} and id not in (select game_id from teams_games)`,
    ),
  };
}

async function fetchPage(path: string, cookie?: string) {
  const response = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: cookie ? { cookie } : {},
  });
  const body = await response.text();
  return { status: response.status, location: response.headers.get("location"), body };
}

function pageHas(body: string, needle: string) {
  return body.toLowerCase().includes(needle.toLowerCase());
}

async function phaseAuthAndValidation() {
  console.log("\n== auth / validation ==");
  await expectReject("anon cannot start import session", () =>
    anon.sheetImport.startSession.mutate(),
  );
  await expectReject("user cannot start import session", () =>
    user.sheetImport.startSession.mutate(),
  );
  await expectReject(
    "full import without sources is rejected",
    () =>
      admin.seasons.commitSheetImport.mutate({
        mode: "full",
        seasonNumber: 99,
        startDate: "2026-01-01",
      }),
    /session id|master sheet|preview|sources/i,
  );
  await expectReject(
    "invalid sheet url is rejected",
    () =>
      admin.sheetImport.loadMaster.mutate({
        url: "not-a-url",
        startDate: START_DATE,
      }),
    /invalid|url/i,
  );
  await expectReject(
    "missing session is rejected",
    () =>
      admin.sheetImport.assemblePreview.mutate({
        mode: "full",
        seasonNumber: SEASON_NUMBER,
        startDate: START_DATE,
        sessionId: "00000000-0000-4000-8000-000000000000",
      }),
    /expired|session/i,
  );
  await expectReject("anon cannot delete a season", () => anon.seasons.delete.mutate({ id: 1 }));
}

async function deleteSeasonIfPresent(seasonNumber: number) {
  const rows = d1Rows<{ id: number }>(
    `select id from seasons where season_number = ${seasonNumber}`,
  );
  const id = rows[0]?.id;
  if (id == null) return null;
  try {
    await admin.seasons.delete.mutate({ id });
    record(`delete existing season ${seasonNumber} via portal`, true, `id ${id}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    record(`delete existing season ${seasonNumber} via portal`, false, message.slice(0, 180));
    d1Json(`delete from seasons where id = ${id}`);
  }
  return id;
}

async function phaseImportS2() {
  console.log("\n== create S2 via portal import flow ==");
  const deletedId = await deleteSeasonIfPresent(SEASON_NUMBER);
  const leftoverTeams = d1Count(
    `select count(*) as c from teams where season_id = ${deletedId ?? -1}`,
  );
  check(
    "deleting fixture S2 does not leave teams behind",
    leftoverTeams === 0,
    leftoverTeams === 0 ? undefined : `${leftoverTeams} orphan teams`,
  );
  const leftoverGames = d1Count(
    `select count(*) as c from games where season_id = ${deletedId ?? -1}`,
  );
  check(
    "deleting fixture S2 does not leave games behind",
    leftoverGames === 0,
    leftoverGames === 0 ? undefined : `${leftoverGames} orphan games`,
  );

  const loaded = await loadPortalPreview({
    seasonNumber: SEASON_NUMBER,
    startDate: START_DATE,
    endDate: END_DATE,
    theme: THEME,
    masterUrl: MASTER,
    regionalUrls: REGIONAL,
  });

  check("preview has teams", loaded.preview.counts.teams > 0, String(loaded.preview.counts.teams));
  check("preview has games", loaded.preview.counts.games > 0, String(loaded.preview.counts.games));
  check(
    "preview has players",
    loaded.preview.counts.players > 0,
    String(loaded.preview.counts.players),
  );
  check(
    "client preview strips stat rows",
    loaded.preview.stats.length === 0,
    String(loaded.preview.stats.length),
  );
  check(
    "preview reports a stats count",
    loaded.preview.counts.stats > 0,
    String(loaded.preview.counts.stats),
  );
  check("preview has no hard errors", loaded.preview.errors.length === 0, loaded.preview.errors[0]);

  const excludedTeam = loaded.preview.teams.find((team) => team.included);
  const excludedGame = loaded.preview.games.find((game) => game.included);
  if (excludedTeam && excludedGame) {
    const filtered = await admin.sheetImport.assemblePreview.mutate({
      mode: "full",
      seasonNumber: SEASON_NUMBER,
      startDate: START_DATE,
      endDate: END_DATE,
      theme: THEME,
      sessionId: loaded.sessionId,
      excludeTeamKeys: [excludedTeam.key],
      excludeGameKeys: [excludedGame.key],
    });
    check(
      "exclude team reduces preview team count",
      filtered.counts.teams === loaded.preview.counts.teams - 1,
      `${filtered.counts.teams} vs ${loaded.preview.counts.teams}`,
    );
    check(
      "exclude game reduces preview game count",
      filtered.counts.games === loaded.preview.counts.games - 1,
      `${filtered.counts.games} vs ${loaded.preview.counts.games}`,
    );
  }

  console.log("  committing S2…");
  const commit = await admin.seasons.commitSheetImport.mutate({
    mode: "full",
    seasonNumber: SEASON_NUMBER,
    startDate: START_DATE,
    endDate: END_DATE,
    theme: THEME,
    sessionId: loaded.sessionId,
  });
  record(
    "commit S2 via session",
    true,
    `season ${commit.seasonId} teams+${commit.teamsCreated} players+${commit.playersCreated} games+${commit.gamesCreated} stats+${commit.statsCreated}`,
  );

  return { ...loaded, commit };
}

async function phaseVerify(preview: Preview, seasonId: number) {
  console.log("\n== verify imported S2 ==");
  const counts = await seasonCounts(seasonId);
  console.log(JSON.stringify({ seasonId, ...counts, preview: preview.counts }, null, 2));

  check(
    "season row exists as number 2",
    d1Count(`select count(*) as c from seasons where season_number = ${SEASON_NUMBER}`) === 1,
  );
  check(
    "team count matches preview",
    counts.teams === preview.counts.teams,
    `${counts.teams} vs preview ${preview.counts.teams}`,
  );
  check(
    "game count matches preview",
    counts.games === preview.counts.games,
    `${counts.games} vs preview ${preview.counts.games}`,
  );
  check(
    "stat rows were written",
    counts.stats > 0 && counts.stats <= preview.counts.stats,
    `${counts.stats} / preview ${preview.counts.stats}`,
  );
  check(
    "stat count matches unique preview rows",
    counts.stats === preview.counts.stats,
    `${counts.stats} vs preview ${preview.counts.stats}`,
  );
  check("rosters were attached", counts.roster > 0, String(counts.roster));
  check("captaincy roles were written", counts.leadership > 0, String(counts.leadership));
  check(
    "every imported game has two team slots",
    counts.orphanGames === 0 && counts.twoSlotGames === counts.games,
    `two-slot=${counts.twoSlotGames} orphan=${counts.orphanGames} games=${counts.games}`,
  );

  const seasons = await admin.seasons.list.query();
  const s2 = seasons.find((row) => row.seasonNumber === SEASON_NUMBER);
  check("portal season list includes S2", Boolean(s2), s2 ? `id ${s2.id}` : "missing");
  if (s2) {
    check(
      "portal season list teamCount",
      Number(s2.teamCount) === counts.teams,
      `${s2.teamCount} vs ${counts.teams}`,
    );
    check(
      "portal season list gameCount",
      Number(s2.gameCount) === counts.games,
      `${s2.gameCount} vs ${counts.games}`,
    );
  }

  const detail = await admin.seasons.byId.query({ id: seasonId });
  check("season detail hydrates teams", (detail?.teams.length ?? 0) === counts.teams);
  check("season detail hydrates games", (detail?.games.length ?? 0) === counts.games);

  const teams = await admin.teams.list.query();
  const s2Teams = teams.filter((team) => team.seasonId === seasonId);
  check("teams.list returns S2 teams", s2Teams.length === counts.teams, String(s2Teams.length));

  const sampleTeam = s2Teams[0];
  if (sampleTeam) {
    const byName = await admin.teams.byName.query({ name: sampleTeam.name });
    check("team byName resolves", byName?.id === sampleTeam.id, sampleTeam.name);
    check(
      "team byName has players",
      (byName?.players?.length ?? 0) > 0,
      String(byName?.players?.length ?? 0),
    );
  }

  const games = await admin.games.list.query();
  const s2Games = games.filter((game) => game.seasonId === seasonId);
  check("games.list returns S2 games", s2Games.length === counts.games, String(s2Games.length));

  const played = s2Games.find((game) => game.team1Score != null);
  if (played) {
    const game = await admin.games.byId.query({ id: played.id });
    check("game detail loads", game?.id === played.id, played.name ?? String(played.id));
  }

  const regionTeams = {
    na: d1Count(
      `select count(distinct teams.id) as c from teams inner join teams_games on teams_games.team_id = teams.id inner join games on games.id = teams_games.game_id where teams.season_id = ${seasonId} and games.region = 'na'`,
    ),
    eu: d1Count(
      `select count(distinct teams.id) as c from teams inner join teams_games on teams_games.team_id = teams.id inner join games on games.id = teams_games.game_id where teams.season_id = ${seasonId} and games.region = 'eu'`,
    ),
    as: d1Count(
      `select count(distinct teams.id) as c from teams inner join teams_games on teams_games.team_id = teams.id inner join games on games.id = teams_games.game_id where teams.season_id = ${seasonId} and games.region = 'as'`,
    ),
  };
  check("NA games exist", regionTeams.na > 0, String(regionTeams.na));
  check("EU games exist", regionTeams.eu > 0, String(regionTeams.eu));
  check("AS games exist", regionTeams.as > 0, String(regionTeams.as));

  const naOnly = client(ADMIN_COOKIE, false);
  const scoped = await naOnly.seasons.byId.query({ id: seasonId, region: "na" });
  check(
    "NA-scoped season hides other-region games",
    (scoped?.games.length ?? 0) > 0 && (scoped?.games.length ?? 0) < counts.games,
    `${scoped?.games.length} of ${counts.games}`,
  );

  return { counts, sampleTeam, sampleGame: played ?? s2Games[0] };
}

async function phasePages(seasonId: number, teamName?: string, gameId?: number) {
  console.log("\n== public / portal pages ==");
  const adminPages = [
    "/portal/seasons",
    "/portal/teams",
    "/portal/players",
    "/portal/games",
    "/portal/stats",
  ];
  for (const path of adminPages) {
    const anonPage = await fetchPage(path);
    check(
      `anon redirected from ${path}`,
      anonPage.status === 307 && (anonPage.location ?? "").includes("/login"),
      `${anonPage.status} ${anonPage.location ?? ""}`,
    );
    const adminPage = await fetchPage(path, ADMIN_COOKIE);
    check(`${path} renders for admin`, adminPage.status === 200, String(adminPage.status));
  }

  const publicPaths = [
    "/",
    "/seasons",
    `/seasons/${seasonId}`,
    "/teams",
    "/players",
    "/games",
    "/stats",
    "/schedules",
  ];
  if (teamName) publicPaths.push(`/teams/${encodeURIComponent(teamName)}`);
  if (gameId) publicPaths.push(`/games/${gameId}`);

  for (const path of publicPaths) {
    const page = await fetchPage(path, SITE_REGION_ALL);
    check(
      `public ${path} is 200`,
      page.status === 200 && !page.body.includes('class="error-page"'),
      String(page.status),
    );
    if (path === `/seasons/${seasonId}` && page.status === 200) {
      check("season page mentions Season 2", pageHas(page.body, "Season 2"));
    }
  }
}

async function phaseIdempotent(
  seasonId: number,
  sources: StagedSources,
  before: Awaited<ReturnType<typeof seasonCounts>>,
) {
  console.log("\n== re-import (resume / idempotent) ==");
  const commit = await admin.seasons.commitSheetImport.mutate({
    mode: "full",
    seasonNumber: SEASON_NUMBER,
    startDate: START_DATE,
    endDate: END_DATE,
    theme: THEME,
    sources: sources as never,
  });
  record(
    "resume commit against existing S2",
    true,
    `teams+${commit.teamsCreated} players+${commit.playersCreated} games+${commit.gamesCreated} stats+${commit.statsCreated}`,
  );
  check("resume does not create another season", commit.seasonId === seasonId);
  check("resume creates no extra teams", commit.teamsCreated === 0, String(commit.teamsCreated));
  check("resume creates no extra games", commit.gamesCreated === 0, String(commit.gamesCreated));

  const after = await seasonCounts(seasonId);
  check("team count unchanged after resume", after.teams === before.teams);
  check("game count unchanged after resume", after.games === before.games);
  check(
    "stat count unchanged after resume",
    after.stats === before.stats,
    `${after.stats} vs ${before.stats}`,
  );
}

async function phaseDeletes(
  seasonId: number,
  sources: StagedSources,
  sample: { teamId?: number; gameId?: number },
) {
  console.log("\n== deletions and restore ==");
  const statRow = d1Rows<{ id: number; player_id: number; game_id: number }>(
    `select id, player_id, game_id from stats where game_id in (select id from games where season_id = ${seasonId}) order by id limit 1`,
  )[0];
  if (statRow) {
    await admin.stats.delete.mutate({ id: statRow.id });
    const gone = d1Count(`select count(*) as c from stats where id = ${statRow.id}`);
    check("delete one stat removes the row", gone === 0);
    await admin.seasons.commitSheetImport.mutate({
      mode: "full",
      seasonNumber: SEASON_NUMBER,
      startDate: START_DATE,
      sources: sources as never,
    });
    const restored = d1Count(
      `select count(*) as c from stats where player_id = ${statRow.player_id} and game_id = ${statRow.game_id}`,
    );
    check("re-import restores deleted stat", restored === 1, String(restored));
  }

  const gameId = sample.gameId;
  if (gameId) {
    const statsBefore = d1Count(`select count(*) as c from stats where game_id = ${gameId}`);
    await admin.games.delete.mutate({ id: gameId });
    const gameGone = d1Count(`select count(*) as c from games where id = ${gameId}`);
    const statsLeft = d1Count(`select count(*) as c from stats where game_id = ${gameId}`);
    check("delete game removes the game", gameGone === 0);
    check(
      "delete game cascades stats",
      statsLeft === 0,
      `${statsLeft} orphan stats (had ${statsBefore})`,
    );
    await admin.seasons.commitSheetImport.mutate({
      mode: "full",
      seasonNumber: SEASON_NUMBER,
      startDate: START_DATE,
      sources: sources as never,
    });
    const gamesAfter = (await seasonCounts(seasonId)).games;
    check("re-import restores deleted game", gamesAfter > 0, String(gamesAfter));
  }

  const playerRow = d1Rows<{ id: number; name: string }>(
    `select players.id, players.name from players inner join teams_players on teams_players.player_id = players.id inner join teams on teams.id = teams_players.team_id where teams.season_id = ${seasonId} and players.id not in (select tp.player_id from teams_players tp inner join teams t on t.id = tp.team_id where t.season_id != ${seasonId}) order by players.id limit 1`,
  )[0];
  if (playerRow) {
    const statsBefore = d1Count(`select count(*) as c from stats where player_id = ${playerRow.id}`);
    await admin.players.delete.mutate({ id: playerRow.id });
    const playerGone = d1Count(`select count(*) as c from players where id = ${playerRow.id}`);
    const statsLeft = d1Count(`select count(*) as c from stats where player_id = ${playerRow.id}`);
    check("delete player removes the player", playerGone === 0, playerRow.name);
    check(
      "delete player cascades stats",
      statsLeft === 0,
      `${statsLeft} orphan stats (had ${statsBefore})`,
    );
    await admin.seasons.commitSheetImport.mutate({
      mode: "full",
      seasonNumber: SEASON_NUMBER,
      startDate: START_DATE,
      sources: sources as never,
    });
    const restored = d1Count(
      `select count(*) as c from players where name = '${playerRow.name.replaceAll("'", "''")}'`,
    );
    check("re-import restores deleted player", restored === 1, playerRow.name);
  }

  const teamId = sample.teamId;
  if (teamId) {
    const teamGames = d1Count(`select count(*) as c from teams_games where team_id = ${teamId}`);
    const gamesBeforeTeamDelete = (await seasonCounts(seasonId)).games;
    try {
      await admin.teams.delete.mutate({ id: teamId });
      const teamGone = d1Count(`select count(*) as c from teams where id = ${teamId}`);
      const linksLeft = d1Count(`select count(*) as c from teams_games where team_id = ${teamId}`);
      const gamesAfterDelete = d1Count(
        `select count(*) as c from games where season_id = ${seasonId}`,
      );
      check("delete team removes the team", teamGone === 0);
      check(
        "delete team cascades team-game links",
        linksLeft === 0,
        `${linksLeft} leftover links (had ${teamGames})`,
      );
      check(
        "delete team removes that team's games",
        gamesAfterDelete === gamesBeforeTeamDelete - teamGames,
        `${gamesAfterDelete} vs ${gamesBeforeTeamDelete} - ${teamGames}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      record("delete team via portal", false, message.slice(0, 180));
    }
    await admin.seasons.commitSheetImport.mutate({
      mode: "full",
      seasonNumber: SEASON_NUMBER,
      startDate: START_DATE,
      sources: sources as never,
    });
    const after = await seasonCounts(seasonId);
    check("re-import restores deleted team", after.teams > 0, String(after.teams));
    check(
      "re-import after team delete does not duplicate games",
      after.games === gamesBeforeTeamDelete,
      `${after.games} vs ${gamesBeforeTeamDelete}`,
    );
  }
}

async function phaseSeasonCascade(
  sources: StagedSources,
  expected: Awaited<ReturnType<typeof seasonCounts>>,
) {
  console.log("\n== season delete cascade + recreate ==");
  const row = d1Rows<{ id: number }>(
    `select id from seasons where season_number = ${SEASON_NUMBER}`,
  )[0];
  if (!row) {
    record("season 2 exists before cascade delete", false);
    return;
  }
  const before = await seasonCounts(row.id);
  await admin.seasons.delete.mutate({ id: row.id });
  const seasonGone = d1Count(`select count(*) as c from seasons where id = ${row.id}`);
  const leftoverTeams = d1Count(`select count(*) as c from teams where season_id = ${row.id}`);
  const leftoverGames = d1Count(`select count(*) as c from games where season_id = ${row.id}`);
  const leftoverStats = d1Count(
    `select count(*) as c from stats where game_id in (select id from games where season_id = ${row.id})`,
  );
  const leftoverRecords = d1Count(`select count(*) as c from records where season_id = ${row.id}`);
  check("season delete removes the season", seasonGone === 0);
  check(
    "season delete cascades teams",
    leftoverTeams === 0,
    leftoverTeams === 0 ? `had ${before.teams}` : `${leftoverTeams} leftover`,
  );
  check(
    "season delete cascades games",
    leftoverGames === 0,
    leftoverGames === 0 ? `had ${before.games}` : `${leftoverGames} leftover`,
  );
  check("season delete leaves no season-scoped stats", leftoverStats === 0, String(leftoverStats));
  check("season delete removes records", leftoverRecords === 0, String(leftoverRecords));

  console.log("  recreating S2 after cascade delete…");
  const commit = await admin.seasons.commitSheetImport.mutate({
    mode: "full",
    seasonNumber: SEASON_NUMBER,
    startDate: START_DATE,
    endDate: END_DATE,
    theme: THEME,
    sources: sources as never,
  });
  record(
    "recreate S2 after season delete",
    true,
    `season ${commit.seasonId} teams+${commit.teamsCreated} games+${commit.gamesCreated} stats+${commit.statsCreated}`,
  );
  const after = await seasonCounts(commit.seasonId);
  check(
    "recreated team count",
    after.teams === expected.teams,
    `${after.teams} vs ${expected.teams}`,
  );
  check(
    "recreated game count",
    after.games === expected.games,
    `${after.games} vs ${expected.games}`,
  );
  check(
    "recreated stat count",
    after.stats === expected.stats,
    `${after.stats} vs ${expected.stats}`,
  );
  return commit.seasonId;
}

async function phasePartialModes(seasonId: number, sources: StagedSources) {
  console.log("\n== teams / players-only modes ==");
  const teamsOnly = await admin.teams.commitSheetImport.mutate({
    mode: "teams",
    seasonId,
    sources: sources as never,
  });
  check("teams-only resume creates nothing new", teamsOnly.teamsCreated === 0);

  const playersOnly = await admin.teams.commitSheetImport.mutate({
    mode: "players",
    seasonId,
    sources: sources as never,
  });
  check(
    "players-only resume attaches existing rosters",
    playersOnly.playersAttached >= 0,
    String(playersOnly.playersAttached),
  );
}

async function main() {
  console.log(`S2 local import test against ${BASE}`);
  await waitForServer();
  record("dev server reachable", true, BASE);

  await phaseAuthAndValidation();
  const imported = await phaseImportS2();
  const verified = await phaseVerify(imported.preview, imported.commit.seasonId);
  await phasePages(imported.commit.seasonId, verified.sampleTeam?.name, verified.sampleGame?.id);
  await phaseIdempotent(imported.commit.seasonId, imported.sources, verified.counts);
  await phaseDeletes(imported.commit.seasonId, imported.sources, {
    ...(verified.sampleTeam?.id !== undefined ? { teamId: verified.sampleTeam.id } : {}),
    ...(verified.sampleGame?.id !== undefined ? { gameId: verified.sampleGame.id } : {}),
  });
  const recreatedId = await phaseSeasonCascade(imported.sources, verified.counts);
  if (recreatedId) await phasePartialModes(recreatedId, imported.sources);

  const failed = results.filter((row) => !row.ok);
  console.log(`\n${results.length} checks, ${failed.length} failed`);
  for (const row of failed) {
    console.log(`  - ${row.name}${row.detail ? ` (${row.detail})` : ""}`);
  }
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
