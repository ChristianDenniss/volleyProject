import { sql, type SQL } from "drizzle-orm";

export function correlatedCount(
  table: string,
  column: string,
  outerTable: string,
  outerColumn: string,
): SQL<number> {
  return sql<number>`${sql.raw(
    `(select count(*) from "${table}" where "${table}"."${column}" = "${outerTable}"."${outerColumn}")`,
  )}`;
}

export function correlatedSum(expression: string): SQL<number> {
  return sql<number>`${sql.raw(expression)}`;
}
