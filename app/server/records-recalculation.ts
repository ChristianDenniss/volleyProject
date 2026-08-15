import { sql } from "drizzle-orm";
import type { Db } from "@db";
import type { RECORD_METRICS } from "@db/schema";

type Metric = (typeof RECORD_METRICS)[number];

const KILLS = "(s.spike_kills + s.ape_kills)";
const ATTEMPTS = "(s.spike_attempts + s.ape_attempts)";
const ERRORS = "(s.spiking_errors + s.setting_errors + s.serving_errors + s.misc_errors)";

const COUNTING_METRICS: Record<Exclude<Metric, "spiking percentage">, string> = {
  "spike kills": "s.spike_kills",
  assists: "s.assists",
  "ape kills": "s.ape_kills",
  digs: "s.digs",
  "block follows": "s.block_follows",
  blocks: "s.blocks",
  aces: "s.aces",
  "serve errors": "s.serving_errors",
  "misc errors": "s.misc_errors",
  "set errors": "s.setting_errors",
  "spike errors": "s.spiking_errors",
  "spike attempts": "s.spike_attempts",
  "ape attempts": "s.ape_attempts",
  "total kills": KILLS,
  "total attempts": ATTEMPTS,
  "total errors": ERRORS,
};

export const ATTEMPT_THRESHOLDS = Array.from({ length: 25 }, (_, index) => (index + 1) * 10);

const COLUMNS =
  "(metric, min_attempts, type, rank, value, date, season_id, player_id, game_id, created_at, updated_at)";

export interface RecalculationOptions {
  seasonId?: number | null;
}

function seasonFilter(seasonId: number | null | undefined): string {
  return seasonId ? ` and g.season_id = ${seasonId}` : "";
}

function gameStatement(metric: string, expression: string, seasonId: number | null | undefined) {
  const stamp = Date.now();
  return sql.raw(`
    insert into records ${COLUMNS}
    select '${metric}', null, 'game', rank, value, date, season_id, player_id, game_id, ${stamp}, ${stamp}
    from (
      select
        ${expression} as value,
        g.date as date,
        g.season_id as season_id,
        s.player_id as player_id,
        s.game_id as game_id,
        row_number() over (partition by g.season_id order by ${expression} desc, s.id asc) as rank
      from stats s
      join games g on g.id = s.game_id
      where g.season_id is not null${seasonFilter(seasonId)}
    )
    where rank <= 10 and value > 0
  `);
}

function seasonStatement(metric: string, expression: string, seasonId: number | null | undefined) {
  const stamp = Date.now();
  return sql.raw(`
    insert into records ${COLUMNS}
    select '${metric}', null, 'season', rank, value, null, season_id, player_id, null, ${stamp}, ${stamp}
    from (
      select
        sum(${expression}) as value,
        g.season_id as season_id,
        s.player_id as player_id,
        row_number() over (partition by g.season_id order by sum(${expression}) desc, s.player_id asc) as rank
      from stats s
      join games g on g.id = s.game_id
      where g.season_id is not null${seasonFilter(seasonId)}
      group by g.season_id, s.player_id
    )
    where rank <= 10 and value > 0
  `);
}

function thresholdsCte(): string {
  return `with thresholds(min_attempts) as (values ${ATTEMPT_THRESHOLDS.map((value) => `(${value})`).join(", ")})`;
}

function gamePercentageStatement(seasonId: number | null | undefined) {
  const stamp = Date.now();
  return sql.raw(`
    ${thresholdsCte()}
    insert into records ${COLUMNS}
    select 'spiking percentage', min_attempts, 'game', rank, value, date, season_id, player_id, game_id, ${stamp}, ${stamp}
    from (
      select
        t.min_attempts as min_attempts,
        round(100.0 * ${KILLS} / ${ATTEMPTS}, 2) as value,
        g.date as date,
        g.season_id as season_id,
        s.player_id as player_id,
        s.game_id as game_id,
        row_number() over (
          partition by g.season_id, t.min_attempts
          order by (1.0 * ${KILLS} / ${ATTEMPTS}) desc, s.id asc
        ) as rank
      from stats s
      join games g on g.id = s.game_id
      cross join thresholds t
      where g.season_id is not null${seasonFilter(seasonId)} and ${ATTEMPTS} >= t.min_attempts
    )
    where rank <= 10
  `);
}

function seasonPercentageStatement(seasonId: number | null | undefined) {
  const stamp = Date.now();
  return sql.raw(`
    ${thresholdsCte()}
    insert into records ${COLUMNS}
    select 'spiking percentage', min_attempts, 'season', rank, value, null, season_id, player_id, null, ${stamp}, ${stamp}
    from (
      select
        t.min_attempts as min_attempts,
        round(100.0 * sum(${KILLS}) / sum(${ATTEMPTS}), 2) as value,
        g.season_id as season_id,
        s.player_id as player_id,
        row_number() over (
          partition by g.season_id, t.min_attempts
          order by (1.0 * sum(${KILLS}) / sum(${ATTEMPTS})) desc, s.player_id asc
        ) as rank
      from stats s
      join games g on g.id = s.game_id
      cross join thresholds t
      where g.season_id is not null${seasonFilter(seasonId)}
      group by g.season_id, s.player_id, t.min_attempts
      having sum(${ATTEMPTS}) >= t.min_attempts
    )
    where rank <= 10
  `);
}

export async function recalculateRecords(
  db: Db,
  options: RecalculationOptions = {},
): Promise<{ rowsWritten: number }> {
  const seasonId = options.seasonId ?? null;

  await db.run(
    sql.raw(
      seasonId ? `delete from records where season_id = ${seasonId}` : "delete from records",
    ),
  );

  const statements = [
    ...Object.entries(COUNTING_METRICS).map(([metric, expression]) =>
      gameStatement(metric, expression, seasonId),
    ),
    ...Object.entries(COUNTING_METRICS).map(([metric, expression]) =>
      seasonStatement(metric, expression, seasonId),
    ),
    gamePercentageStatement(seasonId),
    seasonPercentageStatement(seasonId),
  ];

  for (const statement of statements) {
    await db.run(statement);
  }

  const [row] = await db.all<{ total: number }>(sql.raw("select count(*) as total from records"));
  return { rowsWritten: row?.total ?? 0 };
}
