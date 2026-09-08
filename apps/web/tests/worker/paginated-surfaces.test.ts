import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { makeDb, type Db } from "@db";
import { awards, games, records, stats } from "@server/services";
import {
  decodeFilterConditions,
  encodeFilterConditions,
  getRowStatValue,
} from "@/lib/stats/leaderboard-filters";
import { FIXTURES, seed } from "../fixtures/seed";

let db: Db;

beforeEach(async () => {
  db = makeDb(env.DB);
  await seed(db);
});

describe("leaderboard filter encoding", () => {
  it("round trips a condition list", () => {
    const encoded = encodeFilterConditions([
      { stat: "aces", operator: ">=", value: 10 },
      { stat: "Spike%", operator: "<", value: 42.5 },
    ]);
    expect(encoded).toBe("aces:>=:10,Spike%:<:42.5");
    expect(decodeFilterConditions(encoded)).toEqual([
      { id: "0", stat: "aces", operator: ">=", value: 10 },
      { id: "1", stat: "Spike%", operator: "<", value: 42.5 },
    ]);
  });

  it("drops anything that is not a known stat, operator or number", () => {
    expect(
      decodeFilterConditions("nope:>=:1,aces:~:1,aces:>=:abc,aces:>=:1); drop table stats;--"),
    ).toEqual([]);
    expect(decodeFilterConditions("aces:>=:1,garbage")).toEqual([
      { id: "0", stat: "aces", operator: ">=", value: 1 },
    ]);
  });

  it("caps the number of conditions it will accept", () => {
    const raw = Array.from({ length: 25 }, () => "aces:>=:1").join(",");
    expect(decodeFilterConditions(raw)).toHaveLength(10);
  });
});

describe("stats.leaderboardPage", () => {
  it("pages the grouped rows and reports the whole total", async () => {
    const first = await stats.leaderboardPage(db, { perPage: 2 });
    expect(first.total).toBe(4);
    expect(first.totalPages).toBe(2);
    expect(first.rows).toHaveLength(2);

    const second = await stats.leaderboardPage(db, { perPage: 2, page: 2 });
    expect(second.rows).toHaveLength(2);
    const ids = [...first.rows, ...second.rows].map((row) => row.playerId);
    expect(new Set(ids).size).toBe(4);
  });

  it("returns an empty page past the last one", async () => {
    const page = await stats.leaderboardPage(db, { perPage: 2, page: 9 });
    expect(page.rows).toEqual([]);
    expect(page.total).toBe(4);
  });

  it("searches on the player name", async () => {
    const page = await stats.leaderboardPage(db, { search: "ava" });
    expect(page.total).toBe(1);
    expect(page.rows[0]?.playerName).toBe(FIXTURES.playerName);
  });

  it("sorts by any stat column in both directions", async () => {
    const desc = await stats.leaderboardPage(db, { sort: "aces", dir: "desc" });
    const asc = await stats.leaderboardPage(db, { sort: "aces", dir: "asc" });
    const descending = desc.rows.map((row) => Number(row.aces));
    expect([...descending].sort((a, b) => b - a)).toEqual(descending);
    expect(asc.rows.map((row) => Number(row.aces))).toEqual([...descending].reverse());
  });

  it("sorts by player name", async () => {
    const page = await stats.leaderboardPage(db, { sort: "playerName", dir: "asc" });
    const names = page.rows.map((row) => row.playerName);
    expect(names).toEqual([...names].sort());
  });

  it("sorts by the team name held in the selected season", async () => {
    const page = await stats.leaderboardPage(db, {
      seasonId: FIXTURES.seasonId,
      sort: "teamName",
      dir: "asc",
    });
    const names = page.rows.map((row) => row.teamName);
    expect(names).toEqual([...names].sort());
    expect(names).toContain(FIXTURES.teamName);
  });

  it("matches the client-side scaling for every stat type", async () => {
    const totals = await stats.leaderboardPage(db, { sort: "playerName", dir: "asc" });

    for (const statType of ["perGame", "perSet"] as const) {
      const scaled = await stats.leaderboardPage(db, {
        sort: "playerName",
        dir: "asc",
        statType,
        conditions: [{ stat: "totalKills", operator: ">=", value: 0 }],
      });
      expect(scaled.rows.map((row) => row.playerId)).toEqual(
        totals.rows.map((row) => row.playerId),
      );
    }

    const top = totals.rows[0];
    expect(top).toBeDefined();
    if (!top) return;

    const perGame = getRowStatValue(top, "totalKills", "perGame");
    const filtered = await stats.leaderboardPage(db, {
      statType: "perGame",
      conditions: [{ stat: "totalKills", operator: "==", value: perGame }],
    });
    expect(filtered.rows.map((row) => row.playerId)).toContain(top.playerId);
  });

  it("never scales a percentage stat", async () => {
    const totals = await stats.leaderboardPage(db, { sort: "playerName", dir: "asc" });
    const first = totals.rows[0];
    expect(first).toBeDefined();
    if (!first) return;

    const percentage = getRowStatValue(first, "totalSpike%", "total");
    const perSet = await stats.leaderboardPage(db, {
      statType: "perSet",
      conditions: [{ stat: "totalSpike%", operator: "==", value: percentage }],
    });
    expect(perSet.rows.map((row) => row.playerId)).toContain(first.playerId);
  });

  it("turns conditions into having clauses that narrow the total", async () => {
    const all = await stats.leaderboardPage(db, {});
    const threshold = Number(all.rows[0]?.totalKills ?? 0);

    const narrowed = await stats.leaderboardPage(db, {
      conditions: [{ stat: "totalKills", operator: ">=", value: threshold }],
    });
    expect(narrowed.total).toBeGreaterThan(0);
    expect(narrowed.total).toBeLessThanOrEqual(all.total);
    expect(narrowed.rows.every((row) => Number(row.totalKills) >= threshold)).toBe(true);

    const impossible = await stats.leaderboardPage(db, {
      conditions: [{ stat: "totalKills", operator: ">", value: 1_000_000 }],
    });
    expect(impossible.total).toBe(0);
    expect(impossible.rows).toEqual([]);
  });

  it("applies equality with the same epsilon the client uses", async () => {
    const all = await stats.leaderboardPage(db, {});
    const target = all.rows[0];
    expect(target).toBeDefined();
    if (!target) return;

    const exact = await stats.leaderboardPage(db, {
      conditions: [{ stat: "aces", operator: "==", value: Number(target.aces) + 0.0005 }],
    });
    expect(exact.rows.map((row) => row.playerId)).toContain(target.playerId);

    const excluded = await stats.leaderboardPage(db, {
      conditions: [{ stat: "aces", operator: "!=", value: Number(target.aces) }],
    });
    expect(excluded.rows.map((row) => row.playerId)).not.toContain(target.playerId);
  });

  it("computes the derived stats the same way the client does", async () => {
    const page = await stats.leaderboardPage(db, { sort: "playerName", dir: "asc" });
    for (const row of page.rows) {
      expect(getRowStatValue(row, "totalReceives", "total")).toBe(
        Number(row.digs) + Number(row.blockFollows),
      );
      const prf = Number(row.totalKills) + Number(row.aces) + Number(row.assists);
      const matched = await stats.leaderboardPage(db, {
        conditions: [
          { stat: "PRF", operator: "==", value: prf },
          { stat: "plusMinus", operator: "==", value: prf - Number(row.totalErrors) },
        ],
      });
      expect(matched.rows.map((entry) => entry.playerId)).toContain(row.playerId);
    }
  });

  it("scopes the season, the region and the stage round", async () => {
    const season = await stats.leaderboardPage(db, { seasonId: FIXTURES.seasonId });
    expect(season.total).toBe(4);
    expect(season.rows.every((row) => row.teamName !== null)).toBe(true);

    const eu = await stats.leaderboardPage(db, { region: "eu" });
    expect(eu.total).toBe(0);

    const finals = await stats.leaderboardPage(db, { stageRound: "R4" });
    expect(finals.total).toBeLessThan(5);
  });
});

describe("records.listGroupsPage", () => {
  it("pages the groups, not the rows", async () => {
    const page = await records.listGroupsPage(db, { type: "game", perPage: 1 });
    expect(page.total).toBe(1);
    expect(page.rows).toHaveLength(1);
    expect(page.rows[0]?.metric).toBe("spike kills");
    expect(page.rows[0]?.minAttempts).toBeNull();
    expect(page.rows[0]?.rows.map((row) => row.rank)).toEqual([1, 2]);
  });

  it("keeps the attempt threshold as part of the group key", async () => {
    const page = await records.listGroupsPage(db, { type: "season" });
    expect(page.rows).toHaveLength(1);
    expect(page.rows[0]?.metric).toBe("spiking percentage");
    expect(page.rows[0]?.minAttempts).toBe(10);
  });

  it("returns an empty page past the last group", async () => {
    const page = await records.listGroupsPage(db, { type: "game", page: 4, perPage: 1 });
    expect(page.rows).toEqual([]);
    expect(page.total).toBe(1);
  });

  it("lists the record types for the tab bar", async () => {
    expect(await records.listTypes(db)).toEqual(["game", "season"]);
    expect(await records.listTypes(db, "eu")).toEqual([]);
  });
});

describe("games.listSchedulePage", () => {
  it("pages by day and keeps every match of a visible day", async () => {
    const page = await games.listSchedulePage(db, { perPage: 1 });
    expect(page.total).toBe(2);
    expect(page.rows).toHaveLength(1);
    expect(page.rows[0]?.date).toBe("2026-01-12");
    expect(page.rows[0]?.matches.map((match) => match.id)).toEqual([1]);

    const second = await games.listSchedulePage(db, { perPage: 1, page: 2 });
    expect(second.rows[0]?.date).toBe("2026-04-26");
    expect(second.rows[0]?.matches.map((match) => match.id)).toEqual([5]);

    const past = await games.listSchedulePage(db, { perPage: 1, page: 3 });
    expect(past.rows).toEqual([]);
  });

  it("filters by status, round, season and search", async () => {
    expect((await games.listSchedulePage(db, { status: "scheduled" })).total).toBe(1);
    expect((await games.listSchedulePage(db, { round: "Semi-Finals" })).total).toBe(1);
    expect((await games.listSchedulePage(db, { seasonId: FIXTURES.seasonId })).total).toBe(1);
    expect((await games.listSchedulePage(db, { region: "eu" })).total).toBe(1);
    expect((await games.listSchedulePage(db, { search: "mountain" })).total).toBe(1);
    expect((await games.listSchedulePage(db, { search: "Semi-Finals - Match 1" })).total).toBe(1);
    expect((await games.listSchedulePage(db, { search: "no such team" })).total).toBe(0);
  });

  it("offers the status and round options the filters accept", async () => {
    expect(await games.listScheduleStatuses(db)).toEqual(["completed", "scheduled"]);
    expect(await games.listScheduleRounds(db)).toEqual(["Round 1", "Semi-Finals"]);
    expect(await games.listScheduleRounds(db, undefined, "eu")).toEqual(["Semi-Finals"]);
  });
});

describe("awards.listPage", () => {
  it("filters by season number and type", async () => {
    const all = await awards.listPage(db, {});
    expect(all.total).toBe(2);

    const season = await awards.listPage(db, { season: 1 });
    expect(season.total).toBe(1);
    expect(season.rows[0]?.id).toBe(FIXTURES.awardId);
    expect(season.rows[0]?.players.map((player) => player.id)).toEqual([1]);

    const typed = await awards.listPage(db, { type: "Best Blocker" });
    expect(typed.total).toBe(1);
    expect(typed.rows[0]?.type).toBe("Best Blocker");

    expect((await awards.listPage(db, { season: 1, type: "Best Blocker" })).total).toBe(0);
  });

  it("pages and stops past the last page", async () => {
    const first = await awards.listPage(db, { perPage: 1 });
    expect(first.rows).toHaveLength(1);
    expect(first.totalPages).toBe(2);

    const past = await awards.listPage(db, { perPage: 1, page: 5 });
    expect(past.rows).toEqual([]);
    expect(past.total).toBe(2);
  });

  it("offers the filter option lists", async () => {
    expect(await awards.listTypes(db)).toEqual(["Best Blocker", "MVP"]);
    expect(await awards.listSeasonNumbers(db)).toEqual([2, 1]);
  });
});
