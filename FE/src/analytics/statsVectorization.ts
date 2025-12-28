// src/analytics/statsVectorization.ts

import type { Player, Stats } from "../types/interfaces";

/*
  What this file is for
  - Convert (player, season) stat-lines into fixed-order numeric vectors.
  - Build a season "population" matrix of vectors (one per player).
  - Normalize the matrix within that season (z-scores).
  - (Optional) provide a placeholder projection-to-3D function you can swap for PCA later.

  Design notes
  - This assumes your DB ingest guarantees "complete stat lines" for any included stat record.
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
  | "spikeKillsPerSet"
  | "spikeAttemptsPerSet"
  | "apeKillsPerSet"
  | "apeAttemptsPerSet"
  | "blocksPerSet"
  | "assistsPerSet"
  | "acesPerSet"
  | "digsPerSet"
  | "blockFollowsPerSet"
  | "spikingErrorsPerSet"
  | "settingErrorsPerSet"
  | "servingErrorsPerSet"
  | "miscErrorsPerSet";

// Fixed order for the vectorss.
// If you change this order or the list, bump a `VECTOR_VERSION` constant.
export const VECTOR_FEATURE_ORDER: VectorFeatureKey[] =
[
  "spikeKillsPerSet",
  "spikeAttemptsPerSet",
  "apeKillsPerSet",
  "apeAttemptsPerSet",
  "blocksPerSet",
  "assistsPerSet",
  "acesPerSet",
  "digsPerSet",
  "blockFollowsPerSet",
  "spikingErrorsPerSet",
  "settingErrorsPerSet",
  "servingErrorsPerSet",
  "miscErrorsPerSet"
];

// Optional: if you want to display a version in API/UI.
export const VECTOR_VERSION = "v2";

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
    // computes the player's aggregated season totals (and sets played) from their game stat records
    const aggregate = aggregatePlayerSeason(player, seasonNumber);

    // skip players who don't meet your user-selected minimum sets threshold.
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

      // This reads the player's raw value for the current feature.
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
  PCA-based projection to 3D for visualization.
  
  This function computes Principal Component Analysis on all z-vectors in a season,
  then projects each player's 12-dimensional vector onto the first 3 principal components.
  This preserves the maximum variance across all 12 statistical dimensions.
  
  Returns both the 3D coordinates and the PCA model (for axis descriptions).
*/
export interface PCAModel {
  components: number[][]; // First 3 principal components (each is 12D)
  explainedVariance: number[]; // Variance explained by each component
  mean: number[]; // Mean of each feature (for centering)
}

export interface ProjectionResult {
  x: number;
  y: number;
  z: number;
  model: PCAModel;
}

/**
 * Compute PCA on a set of z-vectors and project to 3D
 * @param zVectors Array of z-scored vectors (12 dimensions each)
 * @returns Projected 3D coordinates and PCA model
 */
export function computePCA3D(zVectors: number[][]): { projections: { x: number; y: number; z: number }[]; model: PCAModel } {
  if (zVectors.length === 0) {
    return { projections: [], model: { components: [], explainedVariance: [], mean: [] } };
  }

  const numFeatures = zVectors[0].length;
  const numSamples = zVectors.length;

  // Step 1: Center the data (subtract mean from each feature)
  const mean: number[] = [];
  for (let i = 0; i < numFeatures; i++) {
    let sum = 0;
    for (let j = 0; j < numSamples; j++) {
      sum += zVectors[j][i];
    }
    mean[i] = sum / numSamples;
  }

  const centered: number[][] = zVectors.map(vec => 
    vec.map((val, idx) => val - mean[idx])
  );

  // Step 2: Compute covariance matrix
  const covariance: number[][] = [];
  for (let i = 0; i < numFeatures; i++) {
    covariance[i] = [];
    for (let j = 0; j < numFeatures; j++) {
      let sum = 0;
      for (let k = 0; k < numSamples; k++) {
        sum += centered[k][i] * centered[k][j];
      }
      covariance[i][j] = sum / (numSamples - 1);
    }
  }

  // Step 3: Compute eigenvalues and eigenvectors (power iteration with deflation)
  // Create a copy to avoid modifying the original
  const covarianceCopy = covariance.map(row => [...row]);
  const { eigenvalues, eigenvectors } = computeEigenDecomposition(covarianceCopy);

  // Step 4: Sort by eigenvalue (descending) and take top 3
  const sorted = eigenvalues.map((val, idx) => ({ val, idx }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 3);

  const components: number[][] = sorted.map(({ idx }) => {
    const eigenvector = eigenvectors[idx];
    // Normalize the eigenvector
    const norm = Math.sqrt(eigenvector.reduce((sum, v) => sum + v * v, 0));
    return eigenvector.map(v => v / norm);
  });

  const explainedVariance = sorted.map(({ val }) => val);

  // Step 5: Project each vector onto the first 3 principal components
  const projections = zVectors.map(vec => {
    const centeredVec = vec.map((val, idx) => val - mean[idx]);
    const x = dotProduct(centeredVec, components[0]);
    const y = components.length > 1 ? dotProduct(centeredVec, components[1]) : 0;
    const z = components.length > 2 ? dotProduct(centeredVec, components[2]) : 0;
    return { x, y, z };
  });

  return {
    projections,
    model: { components, explainedVariance, mean }
  };
}

/**
 * Project a single z-vector to 3D using a pre-computed PCA model
 */
export function projectZVectorTo3D(zVector: number[], model: PCAModel): { x: number; y: number; z: number } {
  if (model.components.length === 0) {
    // Fallback to simple projection if no model
    return {
      x: zVector.length > 0 ? zVector[0] : 0,
      y: zVector.length > 1 ? zVector[1] : 0,
      z: zVector.length > 2 ? zVector[2] : 0
    };
  }

  // Center the vector
  const centered = zVector.map((val, idx) => val - (model.mean[idx] || 0));

  // Project onto principal components
  const x = dotProduct(centered, model.components[0]);
  const y = model.components.length > 1 ? dotProduct(centered, model.components[1]) : 0;
  const z = model.components.length > 2 ? dotProduct(centered, model.components[2]) : 0;

  return { x, y, z };
}

/* --------------------------- PCA Helper Functions -------------------------- */

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, idx) => sum + val * (b[idx] || 0), 0);
}

function computeEigenDecomposition(matrix: number[][]): { eigenvalues: number[]; eigenvectors: number[][] } {
  const n = matrix.length;
  const eigenvalues: number[] = [];
  const eigenvectors: number[][] = [];

  // Simplified approach: Use power iteration for top eigenvalues
  // For a more robust implementation, consider using a library
  for (let i = 0; i < Math.min(3, n); i++) {
    let vector = new Array(n).fill(1 / Math.sqrt(n)); // Start with normalized vector
    let prevVector: number[] = [];
    let iterations = 0;
    const maxIterations = 100;

    // Power iteration
    while (iterations < maxIterations) {
      prevVector = [...vector];
      vector = matrixVectorMultiply(matrix, vector);
      const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
      if (norm < 1e-10) break;
      vector = vector.map(v => v / norm);

      // Check convergence
      const diff = Math.sqrt(prevVector.reduce((sum, v, idx) => sum + Math.pow(v - vector[idx], 2), 0));
      if (diff < 1e-6) break;
      iterations++;
    }

    // Compute eigenvalue (Rayleigh quotient)
    const Av = matrixVectorMultiply(matrix, vector);
    const eigenvalue = dotProduct(vector, Av);

    eigenvalues.push(eigenvalue);
    eigenvectors.push([...vector]);

    // Deflate matrix for next iteration (Gram-Schmidt)
    if (i < 2) {
      for (let j = 0; j < n; j++) {
        for (let k = 0; k < n; k++) {
          matrix[j][k] -= eigenvalue * vector[j] * vector[k];
        }
      }
    }
  }

  return { eigenvalues, eigenvectors };
}

function matrixVectorMultiply(matrix: number[][], vector: number[]): number[] {
  return matrix.map(row => dotProduct(row, vector));
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
    // It sums team1Score + team2Score per game stat record (since your "sets" are embedded there).
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

  return {
    spikeKillsPerSet: agg.spikeKills / sets,
    spikeAttemptsPerSet: agg.spikeAttempts / sets,
    apeKillsPerSet: agg.apeKills / sets,
    apeAttemptsPerSet: agg.apeAttempts / sets,
    blocksPerSet: agg.blocks / sets,
    assistsPerSet: agg.assists / sets,
    acesPerSet: agg.aces / sets,
    digsPerSet: agg.digs / sets,
    blockFollowsPerSet: agg.blockFollows / sets,
    spikingErrorsPerSet: agg.spikingErrors / sets,
    settingErrorsPerSet: agg.settingErrors / sets,
    servingErrorsPerSet: agg.servingErrors / sets,
    miscErrorsPerSet: agg.miscErrors / sets
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

