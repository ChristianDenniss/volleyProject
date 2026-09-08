import { sql } from "drizzle-orm";
import type { Db } from "@db";
import type { RECORD_METRICS } from "@db/schema";

type Metric = (typeof RECORD_METRICS)[number];

const KILLS = "(s.spike_kills + s.ape_kills)";
const ATTEMPTS = "(s.spike_attempts + s.ape_attempts)";
const ERRORS = "(s.spiking_errors + s.setting_errors + s.serving_errors + s.misc_errors)";

interface CountingMetric {
  metric: Exclude<Metric, "spiking percentage">;
  column: string;
  expression: string;
}

const COUNTING_METRIC_LIST: CountingMetric[] = [
  { metric: "spike kills", column: "spike_kills", expression: "s.spike_kills" },
  { metric: "assists", column: "assists", expression: "s.assists" },
  { metric: "ape kills", column: "ape_kills", expression: "s.ape_kills" },
  { metric: "digs", column: "digs", expression: "s.digs" },
  { metric: "block follows", column: "block_follows", expression: "s.block_follows" },
  { metric: "blocks", column: "blocks", expression: "s.blocks" },
  { metric: "aces", column: "aces", expression: "s.aces" },
  { metric: "serve errors", column: "serving_errors", expression: "s.serving_errors" },
  { metric: "misc errors", column: "misc_errors", expression: "s.misc_errors" },
  { metric: "set errors", column: "setting_errors", expression: "s.setting_errors" },
  { metric: "spike errors", column: "spiking_errors", expression: "s.spiking_errors" },
  { metric: "spike attempts", column: "spike_attempts", expression: "s.spike_attempts" },
  { metric: "ape attempts", column: "ape_attempts", expression: "s.ape_attempts" },
  { metric: "total kills", column: "total_kills", expression: KILLS },
  { metric: "total attempts", column: "total_attempts", expression: ATTEMPTS },
  { metric: "total errors", column: "total_errors", expression: ERRORS },
];

export const COUNTING_METRICS: Record<Exclude<Metric, "spiking percentage">, string> =
  Object.fromEntries(
    COUNTING_METRIC_LIST.map((entry) => [entry.metric, entry.expression]),
  ) as Record<Exclude<Metric, "spiking percentage">, string>;

export const ATTEMPT_THRESHOLDS = Array.from({ length: 25 }, (_, index) => (index + 1) * 10);

const MIN_THRESHOLD = ATTEMPT_THRESHOLDS[0] ?? 10;
const TOP_RANK = 10;

const COLUMNS =
  "(metric, min_attempts, type, rank, value, date, season_id, player_id, game_id, created_at, updated_at)";

const MAX_COMPOUND_TERMS = 5;

export interface RecalculationOptions {
  seasonId?: number | null;
}

function chunkTerms(terms: string[]): string[][] {
  const groups: string[][] = [];
  for (let index = 0; index < terms.length; index += MAX_COMPOUND_TERMS) {
    groups.push(terms.slice(index, index + MAX_COMPOUND_TERMS));
  }
  return groups;
}

function unionAll(terms: string[]): string {
  if (terms.length <= MAX_COMPOUND_TERMS) return terms.join("\n      union all\n      ");
  return unionAll(
    chunkTerms(terms).map((group) => `select * from (${group.join("\n      union all\n      ")})`),
  );
}

function seasonFilter(seasonId: number | null | undefined): string {
  return seasonId ? ` and g.season_id = ${seasonId}` : "";
}

function gameBaseCte(seasonId: number | null | undefined): string {
  const columns = COUNTING_METRIC_LIST.map(
    (entry) => `${entry.expression} as ${entry.column}`,
  ).join(",\n        ");

  return `base as materialized (
      select
        s.id as id,
        s.player_id as player_id,
        s.game_id as game_id,
        g.season_id as season_id,
        g.date as date,
        ${columns}
      from stats s
      join games g on g.id = s.game_id
      where g.season_id is not null${seasonFilter(seasonId)}
    )`;
}

function seasonTotalsCte(seasonId: number | null | undefined): string {
  const columns = COUNTING_METRIC_LIST.map(
    (entry) => `sum(${entry.expression}) as ${entry.column}`,
  ).join(",\n        ");

  return `totals as materialized (
      select
        g.season_id as season_id,
        s.player_id as player_id,
        ${columns}
      from stats s
      join games g on g.id = s.game_id
      where g.season_id is not null${seasonFilter(seasonId)}
      group by g.season_id, s.player_id
    )`;
}

function gameCountingStatement(seasonId: number | null | undefined) {
  const stamp = Date.now();
  const branches = unionAll(
    COUNTING_METRIC_LIST.map(
      (entry) => `select
        '${entry.metric}' as metric,
        ${entry.column} as value,
        date,
        season_id,
        player_id,
        game_id,
        row_number() over (partition by season_id order by ${entry.column} desc, id asc) as rank
      from base
      where ${entry.column} > 0`,
    ),
  );

  return `
with ${gameBaseCte(seasonId)}
    insert into records ${COLUMNS}
    select metric, null, 'game', rank, value, date, season_id, player_id, game_id, ${stamp}, ${stamp}
    from (
      ${branches}
    )
    where rank <= ${TOP_RANK} and value > 0
  `;
}

function seasonCountingStatement(seasonId: number | null | undefined) {
  const stamp = Date.now();
  const branches = unionAll(
    COUNTING_METRIC_LIST.map(
      (entry) => `select
        '${entry.metric}' as metric,
        ${entry.column} as value,
        season_id,
        player_id,
        row_number() over (partition by season_id order by ${entry.column} desc, player_id asc) as rank
      from totals
      where ${entry.column} > 0`,
    ),
  );

  return `
with ${seasonTotalsCte(seasonId)}
    insert into records ${COLUMNS}
    select metric, null, 'season', rank, value, null, season_id, player_id, null, ${stamp}, ${stamp}
    from (
      ${branches}
    )
    where rank <= ${TOP_RANK} and value > 0
  `;
}

function thresholdRankColumns(): string {
  return ATTEMPT_THRESHOLDS.map(
    (threshold) =>
      `sum(case when attempts >= ${threshold} then 1 else 0 end) over ranking as rank_${threshold}`,
  ).join(",\n        ");
}

function thresholdQualifier(): string {
  return ATTEMPT_THRESHOLDS.map(
    (threshold) => `(attempts >= ${threshold} and rank_${threshold} <= ${TOP_RANK})`,
  ).join("\n        or ");
}

function gamePercentageStatement(seasonId: number | null | undefined) {
  const stamp = Date.now();
  const branches = unionAll(
    ATTEMPT_THRESHOLDS.map(
      (threshold) => `select
        ${threshold} as min_attempts,
        rank_${threshold} as rank,
        round(100.0 * kills / attempts, 2) as value,
        date,
        season_id,
        player_id,
        game_id
      from qualified
      where attempts >= ${threshold} and rank_${threshold} <= ${TOP_RANK}`,
    ),
  );

  return `
with base as materialized (
      select
        s.id as id,
        s.player_id as player_id,
        s.game_id as game_id,
        g.season_id as season_id,
        g.date as date,
        ${KILLS} as kills,
        ${ATTEMPTS} as attempts
      from stats s
      join games g on g.id = s.game_id
      where g.season_id is not null${seasonFilter(seasonId)} and ${ATTEMPTS} >= ${MIN_THRESHOLD}
    ),
    ranked as materialized (
      select
        id,
        player_id,
        game_id,
        season_id,
        date,
        kills,
        attempts,
        ${thresholdRankColumns()}
      from base
      window ranking as (
        partition by season_id
        order by (1.0 * kills / attempts) desc, id asc
        rows between unbounded preceding and current row
      )
    ),
    qualified as materialized (
      select * from ranked
      where ${thresholdQualifier()}
    )
    insert into records ${COLUMNS}
    select 'spiking percentage', min_attempts, 'game', rank, value, date, season_id, player_id, game_id, ${stamp}, ${stamp}
    from (
      ${branches}
    )
  `;
}

function seasonPercentageStatement(seasonId: number | null | undefined) {
  const stamp = Date.now();
  const branches = unionAll(
    ATTEMPT_THRESHOLDS.map(
      (threshold) => `select
        ${threshold} as min_attempts,
        rank_${threshold} as rank,
        round(100.0 * kills / attempts, 2) as value,
        season_id,
        player_id
      from qualified
      where attempts >= ${threshold} and rank_${threshold} <= ${TOP_RANK}`,
    ),
  );

  return `
with totals as materialized (
      select
        g.season_id as season_id,
        s.player_id as player_id,
        sum(${KILLS}) as kills,
        sum(${ATTEMPTS}) as attempts
      from stats s
      join games g on g.id = s.game_id
      where g.season_id is not null${seasonFilter(seasonId)}
      group by g.season_id, s.player_id
      having sum(${ATTEMPTS}) >= ${MIN_THRESHOLD}
    ),
    ranked as materialized (
      select
        season_id,
        player_id,
        kills,
        attempts,
        ${thresholdRankColumns()}
      from totals
      window ranking as (
        partition by season_id
        order by (1.0 * kills / attempts) desc, player_id asc
        rows between unbounded preceding and current row
      )
    ),
    qualified as materialized (
      select * from ranked
      where ${thresholdQualifier()}
    )
    insert into records ${COLUMNS}
    select 'spiking percentage', min_attempts, 'season', rank, value, null, season_id, player_id, null, ${stamp}, ${stamp}
    from (
      ${branches}
    )
  `;
}

export async function recalculateRecords(
  db: Db,
  options: RecalculationOptions = {},
): Promise<{ rowsWritten: number }> {
  const seasonId = options.seasonId ?? null;
  const d1 = db.$client as D1Database;

  const statements = [
    seasonId ? `delete from records where season_id = ${seasonId}` : "delete from records",
    gameCountingStatement(seasonId),
    seasonCountingStatement(seasonId),
    gamePercentageStatement(seasonId),
    seasonPercentageStatement(seasonId),
  ];

  await d1.batch(statements.map((statement) => d1.prepare(statement)));

  const [row] = await db.all<{ total: number }>(
    sql.raw(
      seasonId
        ? `select count(*) as total from records where season_id = ${seasonId}`
        : "select count(*) as total from records",
    ),
  );
  return { rowsWritten: row?.total ?? 0 };
}
