"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { RecalculateRecords } from "./recalculate-records";
import {
  optionalText,
  pick,
  ResourceView,
  type ColumnSpec,
  type FieldSpec,
} from "./resource-view";
import { trpc } from "@/lib/trpc";

const RECORD_METRICS = [
  "spike kills",
  "assists",
  "ape kills",
  "digs",
  "block follows",
  "blocks",
  "aces",
  "serve errors",
  "misc errors",
  "set errors",
  "spike errors",
  "spike attempts",
  "ape attempts",
  "total kills",
  "total attempts",
  "total errors",
  "spiking percentage",
] as const;

const RECORD_TYPES = ["game", "season"] as const;

type Metric = (typeof RECORD_METRICS)[number];
type RecordType = (typeof RECORD_TYPES)[number];

interface Row {
  id: number;
  metric: string;
  minAttempts: number | null;
  type: string;
  rank: number;
  value: number;
  date: string | null;
  seasonId: number;
  seasonNumber: number | null;
  playerId: number;
  playerName: string;
  gameId: number | null;
  gameName: string | null;
}

function statusClass(status: string | undefined) {
  if (status === "succeeded") return "text-rvl-mint";
  if (status === "failed") return "text-destructive";
  if (status === "running" || status === "queued") return "text-rvl-accent";
  return "text-rvl-dim";
}

function nullableInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

const COLUMNS: ColumnSpec<Row>[] = [
  { key: "metric", label: "Metric", render: (row) => row.metric },
  { key: "type", label: "Type", render: (row) => row.type },
  { key: "rank", label: "Rank", align: "right", render: (row) => row.rank },
  {
    key: "value",
    label: "Value",
    align: "right",
    render: (row) => (Number.isInteger(row.value) ? row.value : row.value.toFixed(3)),
  },
  {
    key: "player",
    label: "Player",
    render: (row) => <span className="capitalize">{row.playerName}</span>,
  },
  {
    key: "season",
    label: "Season",
    render: (row) => (row.seasonNumber != null ? `S${row.seasonNumber}` : "-"),
  },
  {
    key: "game",
    label: "Game",
    render: (row) => row.gameName ?? (row.gameId ? `#${row.gameId}` : "—"),
  },
  {
    key: "minAttempts",
    label: "Min att.",
    align: "right",
    render: (row) => row.minAttempts ?? "—",
  },
];

export function RecordsManager({
  rows,
  seasons,
  players,
  games,
  job,
}: {
  rows: Row[];
  seasons: { id: number; label: string }[];
  players: { id: number; name: string }[];
  games: { id: number; label: string }[];
  job: { status: string; rowsWritten: number | null; error: string | null } | null;
}) {
  const create = trpc.records.create.useMutation();
  const update = trpc.records.update.useMutation();
  const remove = trpc.records.delete.useMutation();

  const fields: FieldSpec[] = [
    {
      name: "metric",
      label: "Metric",
      type: "select",
      required: true,
      options: RECORD_METRICS.map((metric) => ({ value: metric, label: metric })),
    },
    {
      name: "type",
      label: "Type",
      type: "select",
      required: true,
      options: RECORD_TYPES.map((type) => ({ value: type, label: type })),
    },
    { name: "rank", label: "Rank", type: "number", required: true },
    { name: "value", label: "Value", type: "number", required: true },
    {
      name: "playerId",
      label: "Player",
      type: "select",
      required: true,
      options: players.map((player) => ({
        value: String(player.id),
        label: player.name,
      })),
    },
    {
      name: "seasonId",
      label: "Season",
      type: "select",
      required: true,
      options: seasons.map((season) => ({ value: String(season.id), label: season.label })),
    },
    {
      name: "gameId",
      label: "Game",
      type: "select",
      options: games.map((game) => ({ value: String(game.id), label: game.label })),
    },
    { name: "minAttempts", label: "Min attempts", type: "number" },
    { name: "date", label: "Date", type: "date" },
  ];

  const payload = (values: Record<string, string>) => ({
    metric: pick(values, "metric") as Metric,
    type: pick(values, "type") as RecordType,
    rank: Number.parseInt(pick(values, "rank"), 10),
    value: Number.parseFloat(pick(values, "value")),
    playerId: Number.parseInt(pick(values, "playerId"), 10),
    seasonId: Number.parseInt(pick(values, "seasonId"), 10),
    gameId: nullableInt(pick(values, "gameId")),
    minAttempts: nullableInt(pick(values, "minAttempts")),
    date: optionalText(pick(values, "date")) ?? null,
  });

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-1 gap-8 border border-rvl-line p-6 md:grid-cols-[210px_1fr] md:gap-12">
        <div>
          <h2 className="m-0 mb-3 font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
            Record job
          </h2>
          <p className="m-0 text-[0.84rem] text-rvl-dim">
            Clears the record table for the chosen scope, then rewrites every family from the stat
            table. Runs on a queue.
          </p>
          <Link
            href="/records"
            className="mt-4 inline-block border-b border-rvl-line pb-0.5 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-ink-2 no-underline transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent"
          >
            Public page →
          </Link>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-rvl-line pb-5 font-mono">
            <div className="flex flex-col gap-1">
              <span className="text-[0.56rem] uppercase tracking-[0.22em] text-rvl-dim">
                Last run
              </span>
              <span className={cn("text-[0.95rem] uppercase", statusClass(job?.status))}>
                {job?.status ?? "never"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[0.56rem] uppercase tracking-[0.22em] text-rvl-dim">
                Rows written
              </span>
              <span className="text-[0.95rem] tabular-nums">{job?.rowsWritten ?? "-"}</span>
            </div>
            {job?.error ? (
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-[0.56rem] uppercase tracking-[0.22em] text-rvl-dim">
                  Error
                </span>
                <span className="truncate text-[0.85rem] text-destructive">{job.error}</span>
              </div>
            ) : null}
          </div>

          <RecalculateRecords seasons={seasons} />
        </div>
      </section>

      <ResourceView<Row>
        title="record"
        rows={rows}
        columns={COLUMNS}
        fields={fields}
        toValues={(row) => ({
          metric: row.metric,
          type: row.type,
          rank: String(row.rank),
          value: String(row.value),
          playerId: String(row.playerId),
          seasonId: String(row.seasonId),
          gameId: row.gameId != null ? String(row.gameId) : "",
          minAttempts: row.minAttempts != null ? String(row.minAttempts) : "",
          date: row.date ?? "",
        })}
        onCreate={(values) => create.mutateAsync(payload(values))}
        onUpdate={(id, values) =>
          update.mutateAsync({
            id: id as number,
            patch: payload(values),
          })
        }
        onDelete={(id) => remove.mutateAsync({ id: id as number })}
      />
    </div>
  );
}
