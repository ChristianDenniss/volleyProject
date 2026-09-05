import { getTableColumns, type InferInsertModel } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { Db } from "./index";

export const D1_MAX_BOUND_PARAMETERS = 100;

export function chunkRows<T>(rows: T[], columnCount: number): T[][] {
  const perStatement = Math.max(1, Math.floor(D1_MAX_BOUND_PARAMETERS / Math.max(1, columnCount)));
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += perStatement) {
    chunks.push(rows.slice(index, index + perStatement));
  }
  return chunks;
}

export async function insertMany<TTable extends SQLiteTable>(
  db: Db,
  table: TTable,
  rows: InferInsertModel<TTable>[],
): Promise<void> {
  if (rows.length === 0) return;
  const columnCount = Object.keys(getTableColumns(table)).length;
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
  const columnCount = Object.keys(getTableColumns(table)).length;
  for (const chunk of chunkRows(rows, columnCount)) {
    await db.insert(table).values(chunk as never).onConflictDoNothing();
  }
}
