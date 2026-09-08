import { AsyncLocalStorage } from "node:async_hooks";

export interface QueryRecord {
  sql: string;
  rowsRead: number;
  rowsWritten: number;
  durationMs: number;
}

export interface QueryStats {
  scope: string;
  detail: Record<string, unknown>;
  queries: QueryRecord[];
  rowsRead: number;
  rowsWritten: number;
}

const DETAIL_THRESHOLD_ROWS = 5000;
const SLOW_QUERY_SAMPLE = 3;
const SQL_PREVIEW_LENGTH = 160;

const REAL_STATEMENT = Symbol("d1.realStatement");

const storage = new AsyncLocalStorage<QueryStats>();

export function currentQueryStats(): QueryStats | undefined {
  return storage.getStore();
}

export function recordQuery(sql: string, meta: unknown, fallbackDuration = 0): void {
  const stats = storage.getStore();
  if (!stats) return;

  const source = (meta ?? {}) as {
    rows_read?: number;
    rows_written?: number;
    duration?: number;
  };
  const record: QueryRecord = {
    sql: sql.length > SQL_PREVIEW_LENGTH ? `${sql.slice(0, SQL_PREVIEW_LENGTH)}…` : sql,
    rowsRead: source.rows_read ?? 0,
    rowsWritten: source.rows_written ?? 0,
    durationMs: source.duration ?? fallbackDuration,
  };

  stats.queries.push(record);
  stats.rowsRead += record.rowsRead;
  stats.rowsWritten += record.rowsWritten;
}

function statementText(statement: D1PreparedStatement): string {
  const candidate = statement as unknown as { statement?: unknown };
  return typeof candidate.statement === "string" ? candidate.statement : "<unknown>";
}

function wrapStatement(statement: D1PreparedStatement, sql: string): D1PreparedStatement {
  return new Proxy(statement, {
    get(target, property, receiver) {
      if (property === REAL_STATEMENT) return target;

      if (property === "bind") {
        return (...values: unknown[]) => wrapStatement(target.bind(...values), sql);
      }

      if (property === "run" || property === "all") {
        return async (...args: unknown[]) => {
          const started = Date.now();
          const result = (await (
            target[property] as (...inner: unknown[]) => Promise<unknown>
          )(...args)) as { meta?: unknown };
          recordQuery(sql, result?.meta, Date.now() - started);
          return result;
        };
      }

      const value = Reflect.get(target, property, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

function unwrapStatement(statement: D1PreparedStatement): D1PreparedStatement {
  const candidate = statement as unknown as Record<symbol, D1PreparedStatement | undefined>;
  return candidate[REAL_STATEMENT] ?? statement;
}

export function instrumentD1(binding: D1Database): D1Database {
  return new Proxy(binding, {
    get(target, property, receiver) {
      if (property === "prepare") {
        return (sql: string) => wrapStatement(target.prepare(sql), sql);
      }

      if (property === "batch") {
        return async (statements: D1PreparedStatement[]) => {
          const started = Date.now();
          const results = (await target.batch(statements.map(unwrapStatement))) as {
            meta?: unknown;
          }[];
          const elapsed = Date.now() - started;
          for (const [index, result] of results.entries()) {
            const statement = statements[index];
            recordQuery(statement ? statementText(statement) : "<batch>", result?.meta, elapsed);
          }
          return results;
        };
      }

      const value = Reflect.get(target, property, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

export function logQueryStats(stats: QueryStats): void {
  const payload: Record<string, unknown> = {
    level: "info",
    scope: "d1.usage",
    at: stats.scope,
    rowsRead: stats.rowsRead,
    rowsWritten: stats.rowsWritten,
    queries: stats.queries.length,
    ...stats.detail,
  };

  if (stats.rowsRead >= DETAIL_THRESHOLD_ROWS) {
    payload["top"] = [...stats.queries]
      .sort((a, b) => b.rowsRead - a.rowsRead)
      .slice(0, SLOW_QUERY_SAMPLE)
      .map((query) => ({ sql: query.sql, rowsRead: query.rowsRead, ms: query.durationMs }));
  }

  console.log(JSON.stringify(payload));
}

export async function withQueryStats<T>(
  scope: string,
  detail: Record<string, unknown>,
  run: () => Promise<T>,
): Promise<T> {
  const stats: QueryStats = { scope, detail, queries: [], rowsRead: 0, rowsWritten: 0 };
  try {
    return await storage.run(stats, run);
  } finally {
    if (stats.queries.length > 0) logQueryStats(stats);
  }
}
