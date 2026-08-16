import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { makeDb, type Db } from "@db";
import {
  articles,
  awards,
  games,
  matches,
  players,
  records,
  seasons,
  stats,
  teams,
  trivia,
  users,
} from "@server/services";
import { FIXTURES, seed } from "../fixtures/seed";

let db: Db;

beforeEach(async () => {
  db = makeDb(env.DB);
  await seed(db);
});

describe("seasons", () => {
  it("lists newest first with team and game counts", async () => {
    const rows = await seasons.list(db);
    expect(rows.map((row) => row.seasonNumber)).toEqual([2, 1]);
    expect(rows.find((row) => row.seasonNumber === 1)?.teamCount).toBe(2);
    expect(rows.find((row) => row.seasonNumber === 1)?.gameCount).toBe(2);
  });

  it("hydrates one season with its teams, games, awards and matches", async () => {
    const season = await seasons.getById(db, FIXTURES.seasonId);
    expect(season?.teams).toHaveLength(2);
    expect(season?.games).toHaveLength(2);
    expect(season?.awards).toHaveLength(1);
    expect(season?.matches).toHaveLength(1);
  });

  it("returns null for a missing season", async () => {
    expect(await seasons.getById(db, FIXTURES.missingId)).toBeNull();
  });
});

describe("teams", () => {
  it("keys a team by name", async () => {
    const team = await teams.getByName(db, FIXTURES.teamName);
    expect(team?.id).toBe(FIXTURES.teamId);
    expect(team?.players).toHaveLength(2);
    expect(team?.games).toHaveLength(2);
    expect(team?.season?.seasonNumber).toBe(1);
  });

  it("returns null for an unknown team name", async () => {
    expect(await teams.getByName(db, FIXTURES.missingTeamName)).toBeNull();
  });

  it("refuses a duplicate name inside one season", async () => {
    await expect(
      teams.create(db, { name: FIXTURES.teamName, seasonId: FIXTURES.seasonId }),
    ).rejects.toThrow(/already exists/);
  });
});

describe("players", () => {
  it("hydrates a player with teams, stats, awards and records", async () => {
    const player = await players.getById(db, FIXTURES.playerId);
    expect(player?.teams).toHaveLength(1);
    expect(player?.stats).toHaveLength(4);
    expect(player?.awards).toHaveLength(1);
    expect(player?.records).toHaveLength(1);
  });

  it("merges one player into another, moving stats and links", async () => {
    const before = await players.getById(db, 5);
    expect(before?.stats).toHaveLength(0);

    await players.merge(db, FIXTURES.playerId, 5);

    expect(await players.getById(db, 5)).toBeNull();
    const target = await players.getById(db, FIXTURES.playerId);
    expect(target?.teams.map((team) => team.id).sort()).toEqual([1, 3]);
  });

  it("reports a missing merge source", async () => {
    await expect(players.merge(db, FIXTURES.playerId, FIXTURES.missingId)).rejects.toThrow(
      /not found/,
    );
  });
});

describe("games", () => {
  it("attaches both teams to every listed game", async () => {
    const rows = await games.list(db);
    expect(rows).toHaveLength(4);
    expect(rows.every((row) => row.teams.length === 2)).toBe(true);
  });

  it("creates a game from team names and links them", async () => {
    const created = await games.createByNames(db, {
      date: "2026-02-02",
      seasonId: FIXTURES.seasonId,
      teamNames: [FIXTURES.teamName, FIXTURES.otherTeamName],
      team1Score: 3,
      team2Score: 0,
    });

    const hydrated = await games.getById(db, created.id);
    expect(hydrated?.teams).toHaveLength(2);
    expect(hydrated?.name).toBe("Ocean Spikers Vs. Mountain Blockers");
  });

  it("rejects a negative score", async () => {
    await expect(
      games.create(db, {
        date: "2026-02-02",
        seasonId: FIXTURES.seasonId,
        teamIds: [1, 2],
        team1Score: -1,
        team2Score: 0,
      }),
    ).rejects.toThrow(/negative/);
  });
});

describe("stats", () => {
  it("aggregates a leaderboard with a spiking percentage", async () => {
    const rows = await stats.leaderboard(db);
    expect(rows).toHaveLength(4);
    const top = rows[0];
    expect(top.gamesPlayed).toBe(4);
    expect(top.spikingPercentage).toBeGreaterThan(0);
  });

  it("scopes the leaderboard to one season", async () => {
    const rows = await stats.leaderboard(db, FIXTURES.seasonId);
    expect(rows.every((row) => row.gamesPlayed === 2)).toBe(true);
  });

  it("refuses a second stat line for the same player and game", async () => {
    await expect(
      stats.create(db, { playerId: FIXTURES.playerId, gameId: FIXTURES.gameId }),
    ).rejects.toThrow(/already has a stat line/);
  });

  it("imports parsed csv rows keyed by player name", async () => {
    const result = await stats.createManyFromRows(db, 1, [
      { playerName: "eli vance", spikeKills: 12, spikeAttempts: 20 },
      { playerName: "fay oduya", spikeKills: 8, spikeAttempts: 15 },
    ]);
    expect(result.inserted).toBe(2);
    expect(await stats.listByGame(db, 1)).toHaveLength(6);
  });

  it("names the players it could not resolve", async () => {
    await expect(
      stats.createManyFromRows(db, 1, [{ playerName: "Nobody At All" }]),
    ).rejects.toThrow(/Nobody At All/);
  });
});

describe("awards", () => {
  it("lists awards with their players", async () => {
    const rows = await awards.list(db);
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.type === "MVP")?.players[0].name).toBe(FIXTURES.playerName);
  });

  it("creates an award from player names", async () => {
    const created = await awards.createWithPlayerNames(db, {
      type: "Best Setter",
      description: "Cleanest hands",
      seasonId: FIXTURES.seasonId,
      playerNames: ["bo reyes"],
    });
    const hydrated = await awards.getById(db, created.id);
    expect(hydrated?.players.map((player) => player.name)).toEqual(["bo reyes"]);
  });
});

describe("records", () => {
  it("filters by metric and minimum attempts", async () => {
    expect(await records.listByMetric(db, "spike kills")).toHaveLength(2);
    expect(await records.listByMetric(db, "spiking percentage", 10)).toHaveLength(1);
    expect(await records.listByMetric(db, "spiking percentage")).toHaveLength(0);
  });

  it("returns the top ten for one season and metric", async () => {
    const rows = await records.top10(db, "spike kills", FIXTURES.seasonId);
    expect(rows.map((row) => row.rank)).toEqual([1, 2]);
    expect(rows[0].playerName).toBeDefined();
  });
});

describe("matches", () => {
  it("lists by season and by round", async () => {
    expect(await matches.listBySeason(db, FIXTURES.seasonId)).toHaveLength(1);
    expect(await matches.listByRound(db, FIXTURES.seasonId, "Round 1")).toHaveLength(1);
    expect(await matches.listByRound(db, FIXTURES.seasonId, "Finals")).toHaveLength(0);
  });

  it("fills a missing logo from the team of the same name", async () => {
    const created = await matches.create(db, {
      matchNumber: "Round 2 - Match 1",
      round: "Round 2",
      date: "2026-02-02",
      seasonId: FIXTURES.seasonId,
      team1Name: FIXTURES.teamName,
      team2Name: "Nobody",
    });
    expect(created.team1LogoUrl).toBe("/images/rvlLogo.png");
    expect(created.team2LogoUrl).toBeNull();
  });

  it("imports challonge matches and skips ones already present", async () => {
    const payload = {
      matches: [
        {
          match: {
            id: 501,
            round: 1,
            state: "complete",
            scores_csv: "25-20,25-22",
            player1_id: 1,
            player2_id: 2,
            scheduled_time: "2026-01-12T18:00:00Z",
          },
        },
      ],
      participants: [
        { participant: { id: 1, name: FIXTURES.teamName } },
        { participant: { id: 2, name: FIXTURES.otherTeamName } },
      ],
    };

    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      const body = url.includes("participants") ? payload.participants : payload.matches;
      return new Response(JSON.stringify(body), { status: 200 });
    }) as typeof fetch;

    const first = await matches.importFromChallonge(db, {
      tournamentId: "abc123",
      seasonId: FIXTURES.seasonId,
      apiKey: "test-key",
      fetchImpl,
    });
    expect(first).toEqual({ imported: 1, skipped: 0 });

    const second = await matches.importFromChallonge(db, {
      tournamentId: "abc123",
      seasonId: FIXTURES.seasonId,
      apiKey: "test-key",
      fetchImpl,
    });
    expect(second).toEqual({ imported: 0, skipped: 1 });

    const imported = (await matches.listBySeason(db, FIXTURES.seasonId)).find(
      (match) => match.challongeMatchId === "501",
    );
    expect(imported?.team1Score).toBe(2);
    expect(imported?.set2Score).toBe("25-22");
  });
});

describe("articles", () => {
  it("lists with the author name and can filter to approved", async () => {
    expect(await articles.list(db)).toHaveLength(2);
    const approved = await articles.list(db, { approvedOnly: true });
    expect(approved).toHaveLength(1);
    expect(approved[0].authorName).toBe("fixtureadmin");
  });

  it("likes once and unlikes back to zero", async () => {
    const second = 2;
    expect(await articles.like(db, second, FIXTURES.userId)).toEqual({ liked: true, likes: 1 });
    expect(await articles.like(db, second, FIXTURES.userId)).toEqual({ liked: true, likes: 1 });
    expect(await articles.unlike(db, second, FIXTURES.userId)).toEqual({ liked: false, likes: 0 });
  });

  it("reports like status per user", async () => {
    expect(await articles.likeStatus(db, FIXTURES.articleId, FIXTURES.userId)).toEqual({
      liked: true,
    });
    expect(await articles.likeStatus(db, FIXTURES.articleId, FIXTURES.adminId)).toEqual({
      liked: false,
    });
    expect(await articles.likeStatus(db, FIXTURES.articleId, null)).toEqual({ liked: false });
  });
});

describe("users", () => {
  it("exposes a profile with authored articles", async () => {
    const profile = await users.profile(db, FIXTURES.adminId);
    expect(profile?.articles).toHaveLength(1);
    expect(profile?.role).toBe("admin");
  });

  it("promotes a user", async () => {
    const updated = await users.setRole(db, FIXTURES.userId, "superadmin");
    expect(updated.role).toBe("superadmin");
    expect(users.isAdmin(updated.role)).toBe(true);
  });
});

describe("trivia", () => {
  const always = () => 0;

  it("scores difficulty from relation counts", () => {
    expect(trivia.playerDifficulty(21)).toBe("easy");
    expect(trivia.playerDifficulty(12)).toBe("medium");
    expect(trivia.playerDifficulty(6)).toBe("hard");
    expect(trivia.playerDifficulty(1)).toBe("impossible");
    expect(trivia.teamDifficulty(12, "Didnt make playoffs")).toBe("hard");
    expect(trivia.teamDifficulty(12, "Champion")).toBe("medium");
    expect(trivia.seasonDifficulty(9)).toBe("easy");
    expect(trivia.seasonDifficulty(1)).toBe("hard");
  });

  it("picks a player at the requested difficulty", async () => {
    const player = await trivia.randomPlayer(db, "hard", always);
    expect(player.hintCount).toBe(10);
    expect(player.stats.length).toBeGreaterThan(0);
  });

  it("falls back from impossible to hard for seasons", async () => {
    const season = await trivia.randomSeason(db, "impossible", always);
    expect(season.difficulty).toBe("hard");
  });

  it("compares a guess ignoring case and spacing", async () => {
    const result = await trivia.checkGuess(db, "season", FIXTURES.seasonId, "season 1");
    expect(result).toEqual({ correct: true, answer: "Season 1", message: "Correct!" });

    const wrong = await trivia.checkGuess(db, "player", FIXTURES.playerId, "someone else");
    expect(wrong.correct).toBe(false);
  });
});
