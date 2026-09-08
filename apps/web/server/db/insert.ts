import { getTableColumns, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { Db } from "./index";

export const D1_MAX_BOUND_PARAMETERS = 100;
/** D1 allows up to 50 statements per batch call (counts as one subrequest). */
export const D1_MAX_BATCH_STATEMENTS = 50;

export function chunkRows<T>(rows: T[], columnCount: number): T[][] {
  const perStatement = Math.max(
    1,
    Math.floor(D1_MAX_BOUND_PARAMETERS / Math.max(1, columnCount)) - 1,
  );
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += perStatement) {
    chunks.push(rows.slice(index, index + perStatement));
  }
  return chunks;
}

/** Chunk bind values for D1 `IN (...)` clauses (100-param limit). */
export function chunkValues<T>(values: T[], max = 80): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += max) {
    chunks.push(values.slice(index, index + max));
  }
  return chunks;
}

/** @deprecated Prefer chunkValues — kept for call sites keyed on numeric ids. */
export function chunkIds(ids: number[], max = 80): number[][] {
  return chunkValues(ids, max);
}

function boundColumnCount<TTable extends SQLiteTable>(
  table: TTable,
  rows: InferInsertModel<TTable>[],
): number {
  const tableCols = Object.keys(getTableColumns(table)).length;
  const rowCols = rows[0] ? Object.keys(rows[0] as object).length : 0;
  return Math.max(tableCols, rowCols);
}

export async function insertMany<TTable extends SQLiteTable>(
  db: Db,
  table: TTable,
  rows: InferInsertModel<TTable>[],
): Promise<void> {
  if (rows.length === 0) return;
  const columnCount = boundColumnCount(table, rows);
  for (const chunk of chunkRows(rows, columnCount)) {
    await db.insert(table).values(chunk as never);
  }
}

export async function insertManyIgnore<TTable extends SQLiteTable>(
  db: Db,
  table: TTable,
  rows: InferInsertModel<TTable>[],
): Promise<void> {
  if (rows.length === 0) return;
  const columnCount = boundColumnCount(table, rows);
  for (const chunk of chunkRows(rows, columnCount)) {
    await db.insert(table).values(chunk as never).onConflictDoNothing();
  }
}

/** Chunked multi-row insert that returns created rows (order matches input). */
export async function insertManyReturning<TTable extends SQLiteTable>(
  db: Db,
  table: TTable,
  rows: InferInsertModel<TTable>[],
): Promise<InferSelectModel<TTable>[]> {
  if (rows.length === 0) return [];
  const columnCount = boundColumnCount(table, rows);
  const created: InferSelectModel<TTable>[] = [];
  for (const chunk of chunkRows(rows, columnCount)) {
    const part = await db.insert(table).values(chunk as never).returning();
    created.push(...(part as InferSelectModel<TTable>[]));
  }
  return created;
}

/** Run up to 50 D1 prepared statements per batch call. */
export async function runD1Batch(
  d1: D1Database,
  statements: D1PreparedStatement[],
): Promise<void> {
  if (statements.length === 0) return;
  for (let index = 0; index < statements.length; index += D1_MAX_BATCH_STATEMENTS) {
    await d1.batch(statements.slice(index, index + D1_MAX_BATCH_STATEMENTS));
  }
}

export type StatInsertRow = {
  playerId: number;
  gameId: number;
  spikeKills: number;
  spikeAttempts: number;
  spikingErrors: number;
  apeKills: number;
  apeAttempts: number;
  assists: number;
  settingErrors: number;
  blocks: number;
  blockFollows: number;
  digs: number;
  aces: number;
  servingErrors: number;
  miscErrors: number;
};

const STATS_INSERT_SQL = `INSERT INTO stats (player_id, game_id, spike_kills, spike_attempts, spiking_errors, ape_kills, ape_attempts, assists, setting_errors, blocks, block_follows, digs, aces, serving_errors, misc_errors, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (player_id, game_id) DO NOTHING`;

function bindStatRow(row: StatInsertRow, now: number) {
  return [
    row.playerId,
    row.gameId,
    row.spikeKills,
    row.spikeAttempts,
    row.spikingErrors,
    row.apeKills,
    row.apeAttempts,
    row.assists,
    row.settingErrors,
    row.blocks,
    row.blockFollows,
    row.digs,
    row.aces,
    row.servingErrors,
    row.miscErrors,
    now,
    now,
  ];
}

/** One D1 batch call per up to 50 rows — avoids wide multi-row INSERT param limits. */
export async function insertStatsIgnoreBatch(d1: D1Database, rows: StatInsertRow[]): Promise<void> {
  if (rows.length === 0) return;
  for (let index = 0; index < rows.length; index += D1_MAX_BATCH_STATEMENTS) {
    const chunk = rows.slice(index, index + D1_MAX_BATCH_STATEMENTS);
    const now = Date.now();
    await d1.batch(
      chunk.map((row) => d1.prepare(STATS_INSERT_SQL).bind(...bindStatRow(row, now))),
    );
  }
}
