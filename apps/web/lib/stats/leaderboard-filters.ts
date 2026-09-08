export const STAT_TYPES = ["total", "perGame", "perSet"] as const;
export type StatType = (typeof STAT_TYPES)[number];

export const COMPARISON_OPERATORS = ["==", "!=", ">", ">=", "<", "<="] as const;
export type ComparisonOperator = (typeof COMPARISON_OPERATORS)[number];

export const FILTER_STAT_KEYS = [
  "spikeKills",
  "spikeAttempts",
  "Spike%",
  "apeKills",
  "apeAttempts",
  "Ape%",
  "totalKills",
  "totalAttempts",
  "totalSpike%",
  "spikingErrors",
  "blocks",
  "assists",
  "settingErrors",
  "digs",
  "blockFollows",
  "totalReceives",
  "aces",
  "servingErrors",
  "PRF",
  "plusMinus",
  "totalErrors",
  "miscErrors",
  "gamesPlayed",
] as const;
export type FilterStatKey = (typeof FILTER_STAT_KEYS)[number];

export const PERCENTAGE_STAT_KEYS = ["Spike%", "Ape%", "totalSpike%"] as const;
export const PERCENTAGE_STATS: ReadonlySet<FilterStatKey> = new Set<FilterStatKey>(
  PERCENTAGE_STAT_KEYS,
);

export const LEADERBOARD_SORT_KEYS = [
  ...FILTER_STAT_KEYS,
  "playerName",
  "teamName",
] as const;
export type LeaderboardSortKey = (typeof LEADERBOARD_SORT_KEYS)[number];

export const SORT_DIRECTIONS = ["asc", "desc"] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export const EQUALITY_EPSILON = 0.001;
export const MAX_FILTER_CONDITIONS = 10;
export const MAX_FILTER_VALUE = 1_000_000;

const NUMERIC_VALUE = /^-?\d+(\.\d+)?$/;

export interface StatCondition {
  stat: FilterStatKey;
  operator: ComparisonOperator;
  value: number;
}

export interface FilterCondition extends StatCondition {
  id: string;
}

export function isStatType(value: string): value is StatType {
  return (STAT_TYPES as readonly string[]).includes(value);
}

export function isFilterStatKey(value: string): value is FilterStatKey {
  return (FILTER_STAT_KEYS as readonly string[]).includes(value);
}

export function isComparisonOperator(value: string): value is ComparisonOperator {
  return (COMPARISON_OPERATORS as readonly string[]).includes(value);
}

export function isLeaderboardSortKey(value: string): value is LeaderboardSortKey {
  return (LEADERBOARD_SORT_KEYS as readonly string[]).includes(value);
}

export function isSortDirection(value: string): value is SortDirection {
  return (SORT_DIRECTIONS as readonly string[]).includes(value);
}

export function encodeFilterConditions(conditions: readonly StatCondition[]): string {
  return conditions
    .slice(0, MAX_FILTER_CONDITIONS)
    .map((condition) => `${condition.stat}:${condition.operator}:${condition.value}`)
    .join(",");
}

export function decodeFilterConditions(raw: string | undefined | null): FilterCondition[] {
  if (!raw) return [];

  const conditions: FilterCondition[] = [];
  for (const part of raw.split(",")) {
    if (conditions.length >= MAX_FILTER_CONDITIONS) break;

    const pieces = part.split(":");
    if (pieces.length !== 3) continue;

    const [stat = "", operator = "", value = ""] = pieces;
    if (!isFilterStatKey(stat) || !isComparisonOperator(operator)) continue;

    if (!NUMERIC_VALUE.test(value)) continue;
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed) || Math.abs(parsed) > MAX_FILTER_VALUE) continue;

    conditions.push({ id: String(conditions.length), stat, operator, value: parsed });
  }

  return conditions;
}

export function defaultSortDirection(sort: LeaderboardSortKey): SortDirection {
  return sort === "playerName" || sort === "teamName" ? "asc" : "desc";
}

export interface StatValueSource {
  gamesPlayed: number;
  totalSets: number;
  spikeKills: number;
  spikeAttempts: number;
  apeKills: number;
  apeAttempts: number;
  totalKills: number;
  totalAttempts: number;
  spikingPercentage: number;
  spikingErrors: number;
  assists: number;
  settingErrors: number;
  blocks: number;
  blockFollows: number;
  digs: number;
  aces: number;
  servingErrors: number;
  miscErrors: number;
  totalErrors: number;
}

function rawStatValue(row: StatValueSource, stat: FilterStatKey): number {
  switch (stat) {
    case "Spike%":
      return row.spikeAttempts === 0 ? 0 : (row.spikeKills / row.spikeAttempts) * 100;
    case "Ape%":
      return row.apeAttempts === 0 ? 0 : (row.apeKills / row.apeAttempts) * 100;
    case "totalSpike%":
      return row.spikingPercentage;
    case "totalReceives":
      return row.digs + row.blockFollows;
    case "PRF":
      return row.totalKills + row.aces + row.assists;
    case "plusMinus":
      return row.totalKills + row.aces + row.assists - row.totalErrors;
    default:
      return row[stat];
  }
}

export function getRowStatValue(
  row: StatValueSource,
  stat: FilterStatKey,
  statType: StatType = "total",
): number {
  const raw = rawStatValue(row, stat);
  if (PERCENTAGE_STATS.has(stat) || statType === "total") return raw;
  if (statType === "perGame") {
    return row.gamesPlayed === 0 ? 0 : raw / row.gamesPlayed;
  }
  return row.totalSets === 0 ? 0 : raw / row.totalSets;
}

export function compareStatValue(
  statValue: number,
  operator: ComparisonOperator,
  value: number,
): boolean {
  switch (operator) {
    case "==":
      return Math.abs(statValue - value) < EQUALITY_EPSILON;
    case "!=":
      return Math.abs(statValue - value) >= EQUALITY_EPSILON;
    case ">":
      return statValue > value;
    case ">=":
      return statValue >= value;
    case "<":
      return statValue < value;
    case "<=":
      return statValue <= value;
  }
}

export function passesFilterConditions(
  row: StatValueSource,
  conditions: readonly StatCondition[],
  statType: StatType = "total",
): boolean {
  return conditions.every((condition) =>
    compareStatValue(
      getRowStatValue(row, condition.stat, statType),
      condition.operator,
      condition.value,
    ),
  );
}
