import { and, asc, desc, eq, inArray, isNotNull, or, sql } from "drizzle-orm";
import type { Db } from "@db";
import { insertMany } from "@db/insert";
import {
  gameStaff,
  games,
  MATCH_PHASES,
  MATCH_REGIONS,
  MATCH_STATUSES,
  players,
  seasons,
  stats,
  teams,
  teamsGames,
  user,
  type ContributionRole,
} from "@db/schema";
import { BadRequestError, found, inserted, NotFoundError } from "./errors";
import type { PartialInput } from "./input";

export type GameStatus = (typeof MATCH_STATUSES)[number];
export type GamePhase = (typeof MATCH_PHASES)[number];
export type GameRegion = (typeof MATCH_REGIONS)[number];

export interface GameStaffMember {
  id: string;
  name: string;
  email: string;
}

export interface GameStaffSlots {
  streamed: GameStaffMember | null;
  reffed: GameStaffMember | null;
  commentated: GameStaffMember | null;
}

export interface GameInput {
  name?: string | null | undefined;
  matchNumber?: string | null | undefined;
  round?: string | null | undefined;
  status?: GameStatus | undefined;
  phase?: GamePhase | undefined;
  region?: GameRegion | undefined;
  date: string;
  seasonId: number;
  team1Id?: number | null | undefined;
  team2Id?: number | null | undefined;
  teamIds?: number[] | undefined;
  team1Score?: number | null | undefined;
  team2Score?: number | null | undefined;
  set1Score?: string | null | undefined;
  set2Score?: string | null | undefined;
  set3Score?: string | null | undefined;
  set4Score?: string | null | undefined;
  set5Score?: string | null | undefined;
  stage?: string | undefined;
  videoUrl?: string | null | undefined;
  streamer?: string | null | undefined;
  referee?: string | null | undefined;
  commentator?: string | null | undefined;
  tags?: string[] | null | undefined;
  challongeMatchId?: string | null | undefined;
  challongeTournamentId?: string | null | undefined;
  challongeRound?: number | null | undefined;
}

export interface ScheduleRow {
  id: number;
  matchNumber: string;
  round: string;
  status: string;
  phase: string;
  region: string;
  date: string;
  seasonId: number;
  team1Name: string | null;
  team2Name: string | null;
  team1LogoUrl: string | null;
  team2LogoUrl: string | null;
  team1Score: number | null;
  team2Score: number | null;
  set1Score: string | null;
  set2Score: string | null;
  set3Score: string | null;
  set4Score: string | null;
  set5Score: string | null;
}

interface TeamRef {
  id: number;
  name: string;
  logoUrl: string | null;
}

const listColumns = {
  id: games.id,
  name: games.name,
  matchNumber: games.matchNumber,
  round: games.round,
  status: games.status,
  phase: games.phase,
  region: games.region,
  date: games.date,
  stage: games.stage,
  videoUrl: games.videoUrl,
  team1Score: games.team1Score,
  team2Score: games.team2Score,
  set1Score: games.set1Score,
  set2Score: games.set2Score,
  set3Score: games.set3Score,
  set4Score: games.set4Score,
  set5Score: games.set5Score,
  seasonId: games.seasonId,
  seasonNumber: seasons.seasonNumber,
  tags: games.tags,
  challongeMatchId: games.challongeMatchId,
  challongeTournamentId: games.challongeTournamentId,
  challongeRound: games.challongeRound,
};

function scheduleFilter(seasonId?: number) {
  const hasSchedule = or(isNotNull(games.matchNumber), eq(games.status, "scheduled"));
  return seasonId === undefined ? hasSchedule : and(eq(games.seasonId, seasonId), hasSchedule);
}

function toScheduleRow(
  row: {
    id: number;
    matchNumber: string | null;
    round: string | null;
    status: string;
    phase: string;
    region: string;
    date: string;
    seasonId: number | null;
    team1Score: number | null;
    team2Score: number | null;
    set1Score: string | null;
    set2Score: string | null;
    set3Score: string | null;
    set4Score: string | null;
    set5Score: string | null;
    teams: TeamRef[];
  },
): ScheduleRow {
  return {
    id: row.id,
    matchNumber: row.matchNumber ?? `Game ${row.id}`,
    round: row.round ?? row.status,
    status: row.status,
    phase: row.phase,
    region: row.region,
    date: row.date,
    seasonId: row.seasonId ?? 0,
    team1Name: row.teams[0]?.name ?? null,
    team2Name: row.teams[1]?.name ?? null,
    team1LogoUrl: row.teams[0]?.logoUrl ?? null,
    team2LogoUrl: row.teams[1]?.logoUrl ?? null,
    team1Score: row.team1Score,
    team2Score: row.team2Score,
    set1Score: row.set1Score,
    set2Score: row.set2Score,
    set3Score: row.set3Score,
    set4Score: row.set4Score,
    set5Score: row.set5Score,
  };
}

export async function list(db: Db) {
  const rows = await db
    .select(listColumns)
    .from(games)
    .leftJoin(seasons, eq(games.seasonId, seasons.id))
    .orderBy(desc(games.date));
  return attachTeams(db, rows);
}

export async function listPlayed(db: Db) {
  const rows = await db
    .select(listColumns)
    .from(games)
    .leftJoin(seasons, eq(games.seasonId, seasons.id))
    .where(eq(games.status, "completed"))
    .orderBy(desc(games.date));
  return attachTeams(db, rows);
}

export async function listSchedule(db: Db, seasonId?: number) {
  const rows = await db
    .select(listColumns)
    .from(games)
    .leftJoin(seasons, eq(games.seasonId, seasons.id))
    .where(scheduleFilter(seasonId))
    .orderBy(asc(games.date));
  const withTeams = await attachTeams(db, rows);
  return withTeams.map(toScheduleRow);
}

export async function listBySeason(db: Db, seasonId: number) {
  const rows = await db
    .select(listColumns)
    .from(games)
    .leftJoin(seasons, eq(games.seasonId, seasons.id))
    .where(eq(games.seasonId, seasonId))
    .orderBy(asc(games.date));
  return attachTeams(db, rows);
}

export async function listByRound(db: Db, seasonId: number, round: string) {
  const rows = await db
    .select(listColumns)
    .from(games)
    .leftJoin(seasons, eq(games.seasonId, seasons.id))
    .where(and(eq(games.seasonId, seasonId), eq(games.round, round)))
    .orderBy(asc(games.date));
  return attachTeams(db, rows).then((items) => items.map(toScheduleRow));
}

async function attachTeams<T extends { id: number }>(db: Db, rows: T[]) {
  if (rows.length === 0) {
    return attachStaff(
      db,
      rows.map((row) => ({ ...row, teams: [] as TeamRef[] })),
    );
  }

  const links = await db
    .select({
      gameId: teamsGames.gameId,
      slot: teamsGames.slot,
      id: teams.id,
      name: teams.name,
      logoUrl: teams.logoUrl,
    })
    .from(teamsGames)
    .innerJoin(teams, eq(teamsGames.teamId, teams.id))
    .where(
      inArray(
        teamsGames.gameId,
        rows.map((row) => row.id),
      ),
    )
    .orderBy(asc(teamsGames.slot));

  const byGame = new Map<number, TeamRef[]>();
  for (const link of links) {
    const bucket = byGame.get(link.gameId) ?? [];
    bucket.push({ id: link.id, name: link.name, logoUrl: link.logoUrl });
    byGame.set(link.gameId, bucket);
  }

  const withTeams = rows.map((row) => ({ ...row, teams: byGame.get(row.id) ?? [] }));
  return attachStaff(db, withTeams);
}

function emptyStaff(): GameStaffSlots {
  return { streamed: null, reffed: null, commentated: null };
}

async function attachStaff<T extends { id: number }>(db: Db, rows: T[]) {
  if (rows.length === 0) return rows.map((row) => ({ ...row, staff: emptyStaff() }));

  const links = await db
    .select({
      gameId: gameStaff.gameId,
      role: gameStaff.role,
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(gameStaff)
    .innerJoin(user, eq(gameStaff.userId, user.id))
    .where(
      inArray(
        gameStaff.gameId,
        rows.map((row) => row.id),
      ),
    );

  const byGame = new Map<number, GameStaffSlots>();
  for (const link of links) {
    const bucket = byGame.get(link.gameId) ?? emptyStaff();
    bucket[link.role] = { id: link.id, name: link.name, email: link.email };
    byGame.set(link.gameId, bucket);
  }

  return rows.map((row) => ({ ...row, staff: byGame.get(row.id) ?? emptyStaff() }));
}

async function findUserByHandle(db: Db, handle: string) {
  const row = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(or(eq(user.email, handle), eq(user.name, handle)))
    .get();
  return row ?? null;
}

async function setStaffRole(
  db: Db,
  gameId: number,
  role: ContributionRole,
  handle: string | null | undefined,
) {
  if (handle === undefined) return;
  await db.delete(gameStaff).where(and(eq(gameStaff.gameId, gameId), eq(gameStaff.role, role)));
  if (!handle) return;

  const person = await findUserByHandle(db, handle);
  if (!person) throw new NotFoundError(`User ${handle}`);
  await db.insert(gameStaff).values({ gameId, userId: person.id, role });
}

async function syncStaff(
  db: Db,
  gameId: number,
  staff: Pick<GameInput, "streamer" | "referee" | "commentator">,
) {
  await setStaffRole(db, gameId, "streamed", staff.streamer);
  await setStaffRole(db, gameId, "reffed", staff.referee);
  await setStaffRole(db, gameId, "commentated", staff.commentator);
}

async function syncTeamSlots(
  db: Db,
  gameId: number,
  teamIds: number[] | undefined,
  team1Id: number | null | undefined,
  team2Id: number | null | undefined,
) {
  await db.delete(teamsGames).where(eq(teamsGames.gameId, gameId));
  const entries: { gameId: number; slot: number; teamId: number }[] = [];
  if (teamIds?.length) {
    for (const [index, teamId] of teamIds.entries()) {
      entries.push({ gameId, slot: index + 1, teamId });
    }
  } else {
    if (team1Id) entries.push({ gameId, slot: 1, teamId: team1Id });
    if (team2Id) entries.push({ gameId, slot: 2, teamId: team2Id });
  }
  if (entries.length > 0) await insertMany(db, teamsGames, entries);
}

function countTeams(
  teamIds: number[] | undefined,
  team1Id: number | null | undefined,
  team2Id: number | null | undefined,
) {
  if (teamIds?.length) return teamIds.length;
  return (team1Id ? 1 : 0) + (team2Id ? 1 : 0);
}

function teamIdsFromInput(
  teamIds: number[] | undefined,
  team1Id: number | null | undefined,
  team2Id: number | null | undefined,
) {
  return teamIds ?? [team1Id, team2Id].filter((id): id is number => !!id);
}

function assertTeamRequirement(status: GameStatus, count: number) {
  if (status === "completed" && count < 2) {
    throw new BadRequestError("Completed games require both teams");
  }
}

async function assertTeamsInSeason(db: Db, seasonId: number, ids: number[]) {
  if (ids.length === 0) return [];
  const linked = await db
    .select()
    .from(teams)
    .where(and(eq(teams.seasonId, seasonId), inArray(teams.id, ids)));
  if (linked.length !== ids.length) {
    const missing = ids.filter((id) => !linked.some((team) => team.id === id));
    throw new NotFoundError(`Teams ${missing.join(", ")}`);
  }
  return linked;
}

function defaultName(teamsLinked: TeamRef[], fallback = "TBD vs TBD") {
  if (teamsLinked.length === 0) return fallback;
  if (teamsLinked.length === 1) return `${teamsLinked[0]?.name ?? "TBD"} vs TBD`;
  return teamsLinked.map((team) => team.name).join(" Vs. ");
}

export async function getById(db: Db, id: number) {
  const game = await db.query.games.findFirst({ where: eq(games.id, id) });
  if (!game) return null;

  const [gameTeams, gameStats, season, [withStaff]] = await Promise.all([
    db
      .select({
        id: teams.id,
        name: teams.name,
        logoUrl: teams.logoUrl,
        placement: teams.placement,
        slot: teamsGames.slot,
      })
      .from(teamsGames)
      .innerJoin(teams, eq(teamsGames.teamId, teams.id))
      .where(eq(teamsGames.gameId, id))
      .orderBy(asc(teamsGames.slot)),
    db
      .select({
        id: stats.id,
        playerId: stats.playerId,
        playerName: players.name,
        spikeKills: stats.spikeKills,
        spikeAttempts: stats.spikeAttempts,
        spikingErrors: stats.spikingErrors,
        apeKills: stats.apeKills,
        apeAttempts: stats.apeAttempts,
        assists: stats.assists,
        settingErrors: stats.settingErrors,
        blocks: stats.blocks,
        blockFollows: stats.blockFollows,
        digs: stats.digs,
        aces: stats.aces,
        servingErrors: stats.servingErrors,
        miscErrors: stats.miscErrors,
      })
      .from(stats)
      .innerJoin(players, eq(stats.playerId, players.id))
      .where(eq(stats.gameId, id))
      .orderBy(asc(players.name)),
    game.seasonId
      ? db.query.seasons.findFirst({ where: eq(seasons.id, game.seasonId) })
      : Promise.resolve(undefined),
    attachStaff(db, [{ id }]),
  ]);

  return {
    ...game,
    teams: gameTeams.map(({ slot: _slot, ...team }) => team),
    stats: gameStats,
    season: season ?? null,
    staff: withStaff?.staff ?? emptyStaff(),
  };
}

export async function getScore(db: Db, id: number) {
  const row = await db
    .select({ team1Score: games.team1Score, team2Score: games.team2Score })
    .from(games)
    .where(eq(games.id, id))
    .get();
  return row ?? null;
}

export async function count(db: Db) {
  return db.$count(games);
}

async function assertSeason(db: Db, seasonId: number) {
  const season = await db.query.seasons.findFirst({ where: eq(seasons.id, seasonId) });
  if (!season) throw new NotFoundError(`Season ${seasonId}`);
  return season;
}

export async function create(db: Db, input: GameInput) {
  const {
    teamIds,
    team1Id,
    team2Id,
    streamer,
    referee,
    commentator,
    ...gameFields
  } = input;
  const status = input.status ?? (input.matchNumber ? "scheduled" : "completed");
  const ids = teamIdsFromInput(teamIds, team1Id, team2Id);

  assertTeamRequirement(status, countTeams(teamIds, team1Id, team2Id));
  if ((input.team1Score ?? 0) < 0 || (input.team2Score ?? 0) < 0) {
    throw new BadRequestError("Scores cannot be negative");
  }
  await assertSeason(db, input.seasonId);

  const linked = await assertTeamsInSeason(db, input.seasonId, ids);
  const teamRefs: TeamRef[] = linked.map((team) => ({
    id: team.id,
    name: team.name,
    logoUrl: team.logoUrl,
  }));

  const name = input.name ?? defaultName(teamRefs);

  const [created] = await db
    .insert(games)
    .values({
      ...gameFields,
      name,
      status,
      team1Score: input.team1Score ?? null,
      team2Score: input.team2Score ?? null,
    })
    .returning();

  const row = inserted(created, "Game");
  await syncTeamSlots(db, row.id, teamIds, team1Id, team2Id);
  await syncStaff(db, row.id, { streamer, referee, commentator });

  return row;
}

export async function createMany(db: Db, input: GameInput[]) {
  const created = [];
  for (const game of input) created.push(await create(db, game));
  return created;
}

export async function createByNames(
  db: Db,
  input: Omit<GameInput, "teamIds" | "team1Id" | "team2Id"> & { teamNames: string[] },
) {
  const linked = await db.select().from(teams).where(inArray(teams.name, input.teamNames));
  if (linked.length !== input.teamNames.length) {
    const missing = input.teamNames.filter((name) => !linked.some((team) => team.name === name));
    throw new NotFoundError(`Teams ${missing.join(", ")}`);
  }
  return create(db, { ...input, teamIds: linked.map((team) => team.id) });
}

export async function update(
  db: Db,
  id: number,
  input: PartialInput<Omit<GameInput, "teamIds" | "team1Id" | "team2Id">> & {
    teamIds?: number[] | undefined;
    team1Id?: number | null | undefined;
    team2Id?: number | null | undefined;
  },
) {
  const { teamIds, team1Id, team2Id, streamer, referee, commentator, ...rest } = input;
  const existing = await db.query.games.findFirst({ where: eq(games.id, id) });
  if (!existing) throw new NotFoundError(`Game ${id}`);

  const status = rest.status ?? existing.status;
  const seasonId = rest.seasonId ?? existing.seasonId;
  if (!seasonId) throw new BadRequestError("Game must belong to a season");

  const hasSlotUpdate = teamIds !== undefined || team1Id !== undefined || team2Id !== undefined;
  if (hasSlotUpdate) {
    const ids = teamIdsFromInput(teamIds, team1Id, team2Id);
    assertTeamRequirement(status, countTeams(teamIds, team1Id, team2Id));
    await assertTeamsInSeason(db, seasonId, ids);
    await syncTeamSlots(db, id, teamIds, team1Id, team2Id);
  } else if (status === "completed") {
    const current = await db.select().from(teamsGames).where(eq(teamsGames.gameId, id));
    assertTeamRequirement(status, current.length);
  }

  const [row] =
    Object.keys(rest).length > 0
      ? await db.update(games).set(rest).where(eq(games.id, id)).returning()
      : [existing];

  await syncStaff(db, id, { streamer, referee, commentator });

  return row;
}

export async function remove(db: Db, id: number) {
  const [row] = await db.delete(games).where(eq(games.id, id)).returning({ id: games.id });
  found(row, `Game ${id}`);
  return { id };
}

export async function countBySeason(db: Db) {
  return db
    .select({ seasonId: games.seasonId, total: sql<number>`count(*)` })
    .from(games)
    .groupBy(games.seasonId);
}

interface ChallongeMatch {
  id: number | string;
  round: number;
  state: string;
  scores_csv?: string | null | undefined;
  player1_id?: number | null | undefined;
  player2_id?: number | null | undefined;
  suggested_play_order?: number | null | undefined;
  updated_at?: string | null | undefined;
  started_at?: string | null | undefined;
  scheduled_time?: string | null | undefined;
}

interface ChallongeParticipant {
  id: number | string;
  name: string;
}

export interface ChallongeImportInput {
  tournamentId: string;
  seasonId: number;
  apiKey: string;
  phase?: GamePhase | undefined;
  region?: GameRegion | undefined;
  tags?: string[] | null | undefined;
  fetchImpl?: typeof fetch | undefined;
}

function setScores(scoresCsv: string | null | undefined) {
  const sets = (scoresCsv ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  let team1Score = 0;
  let team2Score = 0;
  for (const set of sets) {
    const [left, right] = set.split("-").map((value) => Number.parseInt(value, 10));
    if (left === undefined || right === undefined) continue;
    if (Number.isNaN(left) || Number.isNaN(right)) continue;
    if (left > right) team1Score += 1;
    else if (right > left) team2Score += 1;
  }
  return {
    team1Score: sets.length > 0 ? team1Score : null,
    team2Score: sets.length > 0 ? team2Score : null,
    set1Score: sets[0] ?? null,
    set2Score: sets[1] ?? null,
    set3Score: sets[2] ?? null,
    set4Score: sets[3] ?? null,
    set5Score: sets[4] ?? null,
  };
}

async function teamIdForName(db: Db, seasonId: number, name: string | null) {
  if (!name) return null;
  const team = await db.query.teams.findFirst({
    where: and(eq(teams.seasonId, seasonId), eq(teams.name, name)),
  });
  return team?.id ?? null;
}

export async function importFromChallonge(db: Db, input: ChallongeImportInput) {
  await assertSeason(db, input.seasonId);
  if (!input.apiKey) throw new BadRequestError("A Challonge API key is required");

  const call = input.fetchImpl ?? fetch;
  const base = `https://api.challonge.com/v1/tournaments/${input.tournamentId}`;
  const query = `api_key=${encodeURIComponent(input.apiKey)}`;

  const [matchResponse, participantResponse] = await Promise.all([
    call(`${base}/matches.json?${query}`),
    call(`${base}/participants.json?${query}`),
  ]);

  if (!matchResponse.ok || !participantResponse.ok) {
    throw new BadRequestError(
      `Challonge rejected the request (${matchResponse.status}/${participantResponse.status})`,
    );
  }

  const rawMatches = (await matchResponse.json()) as { match: ChallongeMatch }[];
  const rawParticipants = (await participantResponse.json()) as {
    participant: ChallongeParticipant;
  }[];

  const nameById = new Map(
    rawParticipants.map((entry) => [String(entry.participant.id), entry.participant.name]),
  );

  const existing = await db
    .select({ challongeMatchId: games.challongeMatchId })
    .from(games)
    .where(eq(games.challongeTournamentId, input.tournamentId));
  const known = new Set(existing.map((row) => row.challongeMatchId));

  let imported = 0;
  for (const entry of rawMatches) {
    const match = entry.match;
    if (known.has(String(match.id))) continue;

    const team1Name = match.player1_id ? (nameById.get(String(match.player1_id)) ?? null) : null;
    const team2Name = match.player2_id ? (nameById.get(String(match.player2_id)) ?? null) : null;
    const date = match.scheduled_time ?? match.started_at ?? match.updated_at ?? null;
    const status: GameStatus = match.state === "complete" ? "completed" : "scheduled";
    const team1Id = await teamIdForName(db, input.seasonId, team1Name);
    const team2Id = await teamIdForName(db, input.seasonId, team2Name);
    const scores = setScores(match.scores_csv);

    const [created] = await db
      .insert(games)
      .values({
        matchNumber: `Round ${match.round} - Match ${match.suggested_play_order ?? match.id}`,
        round: `Round ${match.round}`,
        status,
        phase: input.phase ?? "qualifiers",
        region: input.region ?? "na",
        date: (date ?? new Date().toISOString()).slice(0, 10),
        seasonId: input.seasonId,
        name: [team1Name ?? "TBD", team2Name ?? "TBD"].join(" Vs. "),
        challongeMatchId: String(match.id),
        challongeTournamentId: input.tournamentId,
        challongeRound: match.round,
        tags: input.tags ?? null,
        ...scores,
      })
      .returning();

    if (created) {
      await syncTeamSlots(db, created.id, undefined, team1Id, team2Id);
      imported += 1;
    }
  }

  return { imported, skipped: rawMatches.length - imported };
}
