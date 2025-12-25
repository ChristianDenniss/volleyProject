// src/analytics/statsVectorization.ts

import type { Player, Stats } from "../types/interfaces";

/*
  What this file is for
  - Convert (player, season) stat-lines into fixed-order numeric vectors.
  - Build a season “population” matrix of vectors (one per player).
  - Normalize the matrix within that season (z-scores).
  - (Optional) provide a placeholder projection-to-3D function you can swap for PCA later.

  Design notes
  - This assumes your DB ingest guarantees “complete stat lines” for any included stat record.
    - I know this to be true for my current dataset, but good to note for future use.
  - This works purely on the Player objects you already fetch on the frontend.
*/


// What each computed row will look like for plotting / similarity.
export interface PlayerSeasonVectorRow
{
  playerId: string;
  playerName: string;
  seasonNumber: number;
  setsPlayed: number;

  // Raw per-set features BEFORE z-score normalization.
  rawPerSetFeatures: Record<VectorFeatureKey, number>;

  // Z-scored features in a fixed order defined by VECTOR_FEATURE_ORDER.
  zVector: number[];
}

// Keys you will vectorize (per-set)' Keep this list stable and version it if you change it.
export type VectorFeatureKey =
  | "killsPerSet"
  | "attemptsPerSet"
  | "totalSpikePct"
  | "spikePct"
  | "apePct"
  | "blocksPerSet"
  | "assistsPerSet"
  | "acesPerSet"
  | "digsPerSet"
  | "receivesPerSet"
  | "errorsPerSet"
  | "plusMinusPerSet";

// Fixed order for the vectorss.
// If you change this order or the list, bump a `VECTOR_VERSION` constant.
export const VECTOR_FEATURE_ORDER: VectorFeatureKey[] =
[
  "killsPerSet",
  "attemptsPerSet",
  "totalSpikePct",
  "spikePct",
  "apePct",
  "blocksPerSet",
  "assistsPerSet",
  "acesPerSet",
  "digsPerSet",
  "receivesPerSet",
  "errorsPerSet",
  "plusMinusPerSet"
];

// Optional: if you want to display a version in API/UI.
export const VECTOR_VERSION = "v1";

// Build z-scored vectors for a given season with a minimum sets-played filter.
export function buildSeasonVectors(
  players: Player[],
  seasonNumber: number,
  minSetsPlayed: number
): PlayerSeasonVectorRow[]
{
  // This collects raw per-set feature rows for all players in the season.
  const rawRows: Array<{
    playerId: string;
    playerName: string;
    seasonNumber: number;
    setsPlayed: number;
    rawPerSetFeatures: Record<VectorFeatureKey, number>;
  }> = [];

  // loop through each player and compute season totals, sets played, and per-set 
  for (const player of players)
  {
    // computes the player’s aggregated season totals (and sets played) from their game stat records
    const aggregate = aggregatePlayerSeason(player, seasonNumber);

    // skip players who don’t meet your user-selected minimum sets threshold.
    if (aggregate.setsPlayed < minSetsPlayed)
    {
      continue;
    }

    // convert the aggregated season totals into per-set features.
    const perSet = computePerSetFeatures(aggregate);

    rawRows.push({
      playerId: String(player.id),
      playerName: player.name,
      seasonNumber,
      setsPlayed: aggregate.setsPlayed,
      rawPerSetFeatures: perSet
    });
  }

  // This short-circuits when no players qualify (avoids divide-by-zero).
  if (rawRows.length === 0)
  {
    return [];
  }

  // This computes mean/std for each feature across the season population.
  const statsByFeature = computeFeaturePopulationStats(rawRows.map(r => r.rawPerSetFeatures));

  // This produces z-scored vectors in a fixed order.
  const zRows: PlayerSeasonVectorRow[] = rawRows.map(row =>
  {
    // This converts the raw per-set feature object into an ordered z-score vector.
    const zVector = VECTOR_FEATURE_ORDER.map((key) =>
    {
      // This reads population stats for the current feature.
      const pop = statsByFeature[key];

      // This reads the player’s raw value for the current feature.
      const value = row.rawPerSetFeatures[key];

      // This handles zero-variance features safely by returning 0 for everyone.
      if (pop.std <= 1e-9)
      {
        return 0;
      }

      // This converts the feature to a z-score.
      return (value - pop.mean) / pop.std;
    });

    return {
      playerId: row.playerId,
      playerName: row.playerName,
      seasonNumber: row.seasonNumber,
      setsPlayed: row.setsPlayed,
      rawPerSetFeatures: row.rawPerSetFeatures,
      zVector
    };
  });

  return zRows;
}

/*
  This is a placeholder “projection to 3D” for visualization.

  IMPORTANT:
  - For correctness, you should compute similarity using zVector (full D dims) or a higher-dim PCA space.
  - For plotting, you can project to 3D.

  v1: This just picks the first 3 dimensions from the z-vector.
  v2: Replace with PCA-3D (recommended) and store/loadings for axis descriptions.
*/
export function projectZVectorTo3D(zVector: number[]): { x: number; y: number; z: number }
{
  // This safely reads up to three components (missing dims default to 0).
  const x = zVector.length > 0 ? zVector[0] : 0;
  const y = zVector.length > 1 ? zVector[1] : 0;
  const z = zVector.length > 2 ? zVector[2] : 0;

  return { x, y, z };
}

/* --------------------------- Internal Helpers -------------------------- */

// Aggregated season totals used to compute per-set features.
interface PlayerSeasonAggregate
{
  seasonNumber: number;
  setsPlayed: number;

  spikeKills: number;
  spikeAttempts: number;
  apeKills: number;
  apeAttempts: number;

  blocks: number;
  assists: number;
  aces: number;

  digs: number;
  blockFollows: number;

  spikingErrors: number;
  settingErrors: number;
  servingErrors: number;
  miscErrors: number;
}

// This aggregates all stat records for a player within a season into totals and sets played.
function aggregatePlayerSeason(player: Player, seasonNumber: number): PlayerSeasonAggregate
{
  // This initializes all totals to zero.
  const aggregate: PlayerSeasonAggregate =
  {
    seasonNumber,
    setsPlayed: 0,

    spikeKills: 0,
    spikeAttempts: 0,
    apeKills: 0,
    apeAttempts: 0,

    blocks: 0,
    assists: 0,
    aces: 0,

    digs: 0,
    blockFollows: 0,

    spikingErrors: 0,
    settingErrors: 0,
    servingErrors: 0,
    miscErrors: 0
  };

  // This returns empty totals if the player has no stats.
  if (!player.stats || player.stats.length === 0)
  {
    return aggregate;
  }

  // This filters stat records down to only the target season.
  const seasonStats = player.stats.filter((sr) =>
  {
    return sr.game?.season?.seasonNumber === seasonNumber;
  });

  // This sums numeric fields for each stat record.
  for (const sr of seasonStats)
  {
    // This reads the raw stat record as your Stats type.
    const s = sr as unknown as Stats;

    // This safely adds each field (treat undefined as 0).
    aggregate.spikeKills += asNumber(s.spikeKills);
    aggregate.spikeAttempts += asNumber(s.spikeAttempts);
    aggregate.apeKills += asNumber(s.apeKills);
    aggregate.apeAttempts += asNumber(s.apeAttempts);

    aggregate.blocks += asNumber(s.blocks);
    aggregate.assists += asNumber(s.assists);
    aggregate.aces += asNumber(s.aces);

    aggregate.digs += asNumber(s.digs);
    aggregate.blockFollows += asNumber(s.blockFollows);

    aggregate.spikingErrors += asNumber(s.spikingErrors);
    aggregate.settingErrors += asNumber(s.settingErrors);
    aggregate.servingErrors += asNumber(s.servingErrors);
    aggregate.miscErrors += asNumber(s.miscErrors);

    // This increments sets played using the same logic you used in StatsLeaderboard.
    // It sums team1Score + team2Score per game stat record (since your “sets” are embedded there).
    const game = sr.game;
    if (game && typeof game.team1Score === "number" && typeof game.team2Score === "number")
    {
      aggregate.setsPlayed += (game.team1Score + game.team2Score);
    }
  }

  return aggregate;
}

// This converts season totals into the per-set features you will vectorize.
function computePerSetFeatures(agg: PlayerSeasonAggregate): Record<VectorFeatureKey, number>
{
  // This prevents division by zero.
  const sets = agg.setsPlayed > 0 ? agg.setsPlayed : 1;

  // This computes totals used by several features.
  const totalKills = agg.spikeKills + agg.apeKills;
  const totalAttempts = agg.spikeAttempts + agg.apeAttempts;

  // This computes error totals used by errors and plusMinus.
  const totalErrors = agg.miscErrors + agg.spikingErrors + agg.settingErrors + agg.servingErrors;

  // This mirrors your “receives” calculation from StatsLeaderboard (digs + blockFollows).
  const totalReceives = agg.digs + agg.blockFollows;

  // This computes spike-only percent.
  const spikePct = agg.spikeAttempts > 0 ? (agg.spikeKills / agg.spikeAttempts) : 0;

  // This computes ape-only percent.
  const apePct = agg.apeAttempts > 0 ? (agg.apeKills / agg.apeAttempts) : 0;

  // This computes combined (total) spike percent.
  const totalSpikePct = totalAttempts > 0 ? (totalKills / totalAttempts) : 0;

  // This mirrors your PRF / plusMinus definition (but per set).
  const prf = totalKills + agg.aces + agg.assists;
  const plusMinus = prf - totalErrors;

  return {
    killsPerSet: totalKills / sets,
    attemptsPerSet: totalAttempts / sets,
    totalSpikePct,
    spikePct,
    apePct,
    blocksPerSet: agg.blocks / sets,
    assistsPerSet: agg.assists / sets,
    acesPerSet: agg.aces / sets,
    digsPerSet: agg.digs / sets,
    receivesPerSet: totalReceives / sets,
    errorsPerSet: totalErrors / sets,
    plusMinusPerSet: plusMinus / sets
  };
}

// This computes population mean/std for each feature key.
function computeFeaturePopulationStats(
  featureRows: Array<Record<VectorFeatureKey, number>>
): Record<VectorFeatureKey, { mean: number; std: number }>
{
  // This initializes sums for each feature.
  const sums: Record<VectorFeatureKey, number> = createZeroFeatureRecord();

  // This initializes squared sums for each feature.
  const squaredSums: Record<VectorFeatureKey, number> = createZeroFeatureRecord();

  // This accumulates sums and squared sums across all players.
  for (const row of featureRows)
  {
    for (const key of VECTOR_FEATURE_ORDER)
    {
      // This reads the feature value.
      const v = row[key];

      // This adds to the sum.
      sums[key] += v;

      // This adds to the squared sum.
      squaredSums[key] += (v * v);
    }
  }

  // This computes mean and std from sums.
  const n = featureRows.length;
  const out: Record<VectorFeatureKey, { mean: number; std: number }> = {} as any;

  for (const key of VECTOR_FEATURE_ORDER)
  {
    // This computes the mean.
    const mean = sums[key] / n;

    // This computes variance using E[x^2] - (E[x])^2.
    const ex2 = squaredSums[key] / n;
    const variance = Math.max(0, ex2 - (mean * mean));

    // This computes standard deviation.
    const std = Math.sqrt(variance);

    out[key] = { mean, std };
  }

  return out;
}

// This creates a feature record initialized to zeros.
function createZeroFeatureRecord(): Record<VectorFeatureKey, number>
{
  // This constructs a record with 0 for each feature key.
  const rec = {} as Record<VectorFeatureKey, number>;

  for (const key of VECTOR_FEATURE_ORDER)
  {
    rec[key] = 0;
  }

  return rec;
}

// This safely converts undefined/null to 0.
function asNumber(value: unknown): number
{
  // This returns 0 for non-numbers.
  if (typeof value !== "number" || Number.isNaN(value))
  {
    return 0;
  }

  return value;
}
