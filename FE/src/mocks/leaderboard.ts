import type { Stats } from "../types/interfaces";
import { db } from "./db";

type StatType = "total" | "perGame" | "perSet";
type ViewType = "player" | "team";

type AggTotals = {
  spikeKills: number;
  spikeAttempts: number;
  apeKills: number;
  apeAttempts: number;
  spikingErrors: number;
  digs: number;
  blocks: number;
  assists: number;
  aces: number;
  settingErrors: number;
  blockFollows: number;
  servingErrors: number;
  miscErrors: number;
  gamesPlayed: number;
  totalSets: number;
};

export type LeaderboardRow = Record<string, string | number | null | undefined> & {
  id: number;
  name: string;
};

const emptyAgg = (): AggTotals => ({
  spikeKills: 0,
  spikeAttempts: 0,
  apeKills: 0,
  apeAttempts: 0,
  spikingErrors: 0,
  digs: 0,
  blocks: 0,
  assists: 0,
  aces: 0,
  settingErrors: 0,
  blockFollows: 0,
  servingErrors: 0,
  miscErrors: 0,
  gamesPlayed: 0,
  totalSets: 0,
});

function addStat(agg: AggTotals, stat: Stats, gameIds: Set<number>): void {
  agg.spikeKills += stat.spikeKills;
  agg.spikeAttempts += stat.spikeAttempts;
  agg.apeKills += stat.apeKills;
  agg.apeAttempts += stat.apeAttempts;
  agg.spikingErrors += stat.spikingErrors;
  agg.digs += stat.digs;
  agg.blocks += stat.blocks;
  agg.assists += stat.assists;
  agg.aces += stat.aces;
  agg.settingErrors += stat.settingErrors;
  agg.blockFollows += stat.blockFollows;
  agg.servingErrors += stat.servingErrors;
  agg.miscErrors += stat.miscErrors;

  const gameId = stat.game?.id;
  if (gameId != null && !gameIds.has(gameId)) {
    gameIds.add(gameId);
    agg.gamesPlayed += 1;
    const sets =
      (Number(stat.game?.team1Score) || 0) + (Number(stat.game?.team2Score) || 0);
    agg.totalSets += sets;
  }
}

function ratio(num: number, den: number): number {
  return den === 0 ? 0 : num / den;
}

function normalize(agg: AggTotals, statType: StatType): Record<string, number> {
  const totalKills = agg.apeKills + agg.spikeKills;
  const totalAttempts = agg.apeAttempts + agg.spikeAttempts;
  const totalReceives = agg.digs + agg.blockFollows;
  const PRF = totalKills + agg.aces + agg.assists;
  const totalErrors =
    agg.miscErrors + agg.spikingErrors + agg.settingErrors + agg.servingErrors;

  const base: Record<string, number> = {
    spikeKills: agg.spikeKills,
    spikeAttempts: agg.spikeAttempts,
    apeKills: agg.apeKills,
    apeAttempts: agg.apeAttempts,
    spikingErrors: agg.spikingErrors,
    digs: agg.digs,
    blocks: agg.blocks,
    assists: agg.assists,
    aces: agg.aces,
    settingErrors: agg.settingErrors,
    blockFollows: agg.blockFollows,
    servingErrors: agg.servingErrors,
    miscErrors: agg.miscErrors,
    totalKills,
    totalAttempts,
    totalReceives,
    PRF,
    totalErrors,
    plusMinus: PRF - totalErrors,
    "Spike%": ratio(agg.spikeKills, agg.spikeAttempts),
    "Ape%": ratio(agg.apeKills, agg.apeAttempts),
    "totalSpike%": ratio(totalKills, totalAttempts),
    gamesPlayed: agg.gamesPlayed,
    totalSets: agg.totalSets,
  };

  if (statType === "total") return base;

  const divisor = statType === "perGame" ? agg.gamesPlayed : agg.totalSets;
  const out: Record<string, number> = { ...base };
  for (const [key, value] of Object.entries(base)) {
    if (key === "Spike%" || key === "Ape%" || key === "totalSpike%") continue;
    if (key === "gamesPlayed" || key === "totalSets") continue;
    out[key] = divisor === 0 ? 0 : value / divisor;
  }
  return out;
}

function activitySum(agg: AggTotals): number {
  return (
    agg.spikeKills +
    agg.spikeAttempts +
    agg.apeKills +
    agg.apeAttempts +
    agg.spikingErrors +
    agg.digs +
    agg.blocks +
    agg.assists +
    agg.aces +
    agg.settingErrors +
    agg.blockFollows +
    agg.servingErrors +
    agg.miscErrors
  );
}

function matchesSeason(stat: Stats, seasonNumber?: number): boolean {
  if (seasonNumber == null) return true;
  return stat.game?.season?.seasonNumber === seasonNumber;
}

function matchesRegion(stat: Stats, regionId?: number, region?: string): boolean {
  if (regionId == null && !region) return true;
  const gameRegion = stat.game?.region;
  if (gameRegion == null) return true; // seeded rows may omit region
  if (typeof gameRegion === "string") return !region || gameRegion === region;
  if (typeof gameRegion === "object") {
    if (regionId != null && "id" in gameRegion && Number(gameRegion.id) === regionId) {
      return true;
    }
    if (region && "code" in gameRegion && gameRegion.code === region) return true;
    if (regionId == null && !region) return true;
    // If only regionId is set and object has no id, don't exclude.
    return regionId != null && !("id" in gameRegion);
  }
  return true;
}

function matchesStage(stat: Stats, stageRound?: string): boolean {
  if (!stageRound || stageRound === "all") return true;
  const stage = stat.game?.stage ?? "";
  return stage.includes(stageRound);
}

type FilterCondition = { stat: string; operator: string; value: number };

function parseFilters(raw: string | null): FilterCondition[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is FilterCondition => {
        return (
          !!item &&
          typeof item === "object" &&
          typeof (item as FilterCondition).stat === "string" &&
          typeof (item as FilterCondition).operator === "string" &&
          Number.isFinite(Number((item as FilterCondition).value))
        );
      })
      .map((item) => ({
        stat: item.stat,
        operator: item.operator,
        value: Number(item.value),
      }));
  } catch {
    return [];
  }
}

function passesFilters(row: LeaderboardRow, filters: FilterCondition[]): boolean {
  return filters.every(({ stat, operator, value }) => {
    const raw = Number(row[stat] ?? 0);
    switch (operator) {
      case "==":
        return Math.abs(raw - value) < 0.001;
      case "!=":
        return Math.abs(raw - value) >= 0.001;
      case ">":
        return raw > value;
      case ">=":
        return raw >= value;
      case "<":
        return raw < value;
      case "<=":
        return raw <= value;
      default:
        return true;
    }
  });
}

function buildPlayerRows(stats: Stats[], statType: StatType): LeaderboardRow[] {
  const byPlayer = new Map<
    number,
    { name: string; agg: AggTotals; gameIds: Set<number> }
  >();

  for (const stat of stats) {
    const playerId = stat.playerId ?? stat.player?.id;
    if (playerId == null) continue;
    const name = stat.player?.name ?? `Player ${playerId}`;
    let entry = byPlayer.get(playerId);
    if (!entry) {
      entry = { name, agg: emptyAgg(), gameIds: new Set() };
      byPlayer.set(playerId, entry);
    }
    addStat(entry.agg, stat, entry.gameIds);
  }

  const rows: LeaderboardRow[] = [];
  for (const [id, { name, agg }] of byPlayer) {
    if (activitySum(agg) <= 0) continue;
    rows.push({ id, name, ...normalize(agg, statType) });
  }
  return rows;
}

function buildTeamRows(stats: Stats[], statType: StatType): LeaderboardRow[] {
  const byTeam = new Map<
    number,
    {
      name: string;
      logoUrl?: string | null;
      seasonNumber?: number | null;
      agg: AggTotals;
      gameIds: Set<number>;
      playerIds: Set<number>;
      setSum: number;
    }
  >();

  for (const stat of stats) {
    const playerId = stat.playerId ?? stat.player?.id;
    const teams = stat.game?.teams ?? [];
    const playerTeams = new Set(
      (stat.player?.teams ?? []).map((t) => t.id)
    );
    const matched = teams.filter((t) => playerTeams.has(t.id));
    const targets = matched.length > 0 ? matched : teams.slice(0, 1);

    for (const team of targets) {
      let entry = byTeam.get(team.id);
      if (!entry) {
        entry = {
          name: team.name,
          logoUrl: team.logoUrl,
          seasonNumber: team.season?.seasonNumber ?? stat.game?.season?.seasonNumber ?? null,
          agg: emptyAgg(),
          gameIds: new Set(),
          playerIds: new Set(),
          setSum: 0,
        };
        byTeam.set(team.id, entry);
      }
      if (playerId != null) entry.playerIds.add(playerId);
      const before = entry.gameIds.size;
      addStat(entry.agg, stat, entry.gameIds);
      if (entry.gameIds.size > before) {
        entry.setSum +=
          (Number(stat.game?.team1Score) || 0) + (Number(stat.game?.team2Score) || 0);
      }
    }
  }

  const rows: LeaderboardRow[] = [];
  for (const [id, entry] of byTeam) {
    if (activitySum(entry.agg) <= 0) continue;
    // Mirror BE: totalSets averaged across contributing players
    const players = entry.playerIds.size || 1;
    entry.agg.totalSets = entry.setSum / players;
    rows.push({
      id,
      name: entry.name,
      logoUrl: entry.logoUrl ?? null,
      seasonNumber: entry.seasonNumber ?? null,
      ...normalize(entry.agg, statType),
    });
  }
  return rows;
}

/**
 * Build a paginated leaderboard response from seeded MSW stats.
 * Shape mirrors GET /api/stats/leaderboard (toPaginatedResult).
 */
export function buildMockLeaderboard(searchParams: URLSearchParams): {
  data: LeaderboardRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  const view = (searchParams.get("view") === "team" ? "team" : "player") as ViewType;
  const statTypeRaw = searchParams.get("statType");
  const statType: StatType =
    statTypeRaw === "perGame" || statTypeRaw === "perSet" ? statTypeRaw : "total";

  const seasonRaw = searchParams.get("season") ?? searchParams.get("seasonNumber");
  const seasonNumber =
    seasonRaw && Number.isFinite(Number(seasonRaw)) ? Number(seasonRaw) : undefined;

  const search = searchParams.get("search")?.trim().toLowerCase() || undefined;
  const regionIdRaw = searchParams.get("regionId");
  const regionId =
    regionIdRaw && Number.isFinite(Number(regionIdRaw)) ? Number(regionIdRaw) : undefined;
  const region = searchParams.get("region") || undefined;
  const stageRound = searchParams.get("stageRound") || "all";
  const sortBy = searchParams.get("sortBy") || "totalKills";
  const sortDir = (searchParams.get("sortDir") || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const filters = parseFilters(searchParams.get("filters"));

  const rawPage = Number(searchParams.get("page"));
  const rawLimit = Number(searchParams.get("limit"));
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit >= 1
      ? Math.min(Math.floor(rawLimit), 500)
      : 25;

  const filteredStats = db.stats.filter(
    (stat) =>
      matchesSeason(stat, seasonNumber) &&
      matchesRegion(stat, regionId, region) &&
      matchesStage(stat, stageRound)
  );

  let rows =
    view === "team"
      ? buildTeamRows(filteredStats, statType)
      : buildPlayerRows(filteredStats, statType);

  if (search) {
    rows = rows.filter((row) => String(row.name).toLowerCase().includes(search));
  }
  rows = rows.filter((row) => passesFilters(row, filters));

  rows.sort((a, b) => {
    if (sortBy === "name") {
      const cmp = String(a.name).localeCompare(String(b.name));
      return sortDir === "asc" ? cmp : -cmp;
    }
    const av = Number(a[sortBy] ?? 0);
    const bv = Number(b[sortBy] ?? 0);
    if (av === bv) return String(a.name).localeCompare(String(b.name));
    return sortDir === "asc" ? av - bv : bv - av;
  });

  const total = rows.length;
  const skip = (page - 1) * limit;
  const data = rows.slice(skip, skip + limit);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
