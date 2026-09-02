"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface RecordRow {
  id: number;
  type: string;
  metric: string;
  minAttempts: number | null;
  rank: number;
  value: number;
  playerId: number;
  playerName: string;
  seasonId: number | null;
  seasonNumber: number | null;
  gameId: number | null;
  gameName: string | null;
}

export function RecordsBoard({ records }: { records: RecordRow[] }) {
  const types = useMemo(() => {
    const values = new Set<string>();
    records.forEach((record) => values.add(record.type));
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [records]);

  const [type, setType] = useState(types[0] ?? "game");

  const groups = useMemo(() => {
    const map = new Map<string, RecordRow[]>();
    records
      .filter((record) => record.type === type)
      .forEach((record) => {
        const label = record.minAttempts
          ? `${record.metric} (${record.minAttempts}+ att)`
          : record.metric;
        map.set(label, [...(map.get(label) ?? []), record]);
      });
    return [...map.entries()].map(
      ([label, rows]) => [label, [...rows].sort((a, b) => a.rank - b.rank)] as const,
    );
  }, [records, type]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-rvl-line px-5 py-6 sm:px-8 xl:px-14">
        <span className="mr-3 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-rvl-dim">
          Record book
        </span>
        {types.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value)}
            className={cn(
              "cursor-pointer rounded-xs border px-4 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] transition-colors",
              type === value
                ? "border-rvl-accent-bg bg-rvl-accent-bg text-rvl-on-accent"
                : "border-rvl-line bg-transparent text-rvl-dim hover:border-rvl-accent-soft hover:text-rvl-accent",
            )}
          >
            {value} records
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-x-12 gap-y-14 px-5 py-12 sm:px-8 lg:grid-cols-2 xl:grid-cols-3 xl:px-14">
        {groups.map(([label, rows]) => {
          // Ranks are computed per season, so a group holds one rank-1 row per
          // season. The best mark is the highest value, not whatever the list
          // happens to start with.
          const topMark = rows.reduce<RecordRow | undefined>(
            (best, row) => (best === undefined || row.value > best.value ? row : best),
            undefined,
          );

          return (
            <section key={label}>
              <h2 className="m-0 mb-5 border-b border-rvl-line-strong pb-3 font-mono text-[0.7rem] font-bold uppercase tracking-[0.22em] text-rvl-accent">
                {label}
              </h2>

              <ol className="m-0 flex list-none flex-col p-0">
                {rows.map((record) => (
                  <li
                    key={record.id}
                    className="flex items-baseline gap-4 border-b border-rvl-line py-3"
                  >
                    <span
                      className={cn(
                        "w-6 shrink-0 font-mono text-[0.72rem] tabular-nums",
                        record.rank === 1 ? "font-bold text-rvl-accent" : "text-rvl-dim",
                      )}
                    >
                      {record.rank}
                    </span>

                    <Link
                      href={`/players/${record.playerId}`}
                      className="text-[0.95rem] font-semibold capitalize text-rvl-ink no-underline transition-colors hover:text-rvl-accent"
                    >
                      {record.playerName}
                    </Link>

                    {/* Where the mark was set — without it the repeated per-season
                        ranks are indistinguishable from one another. */}
                    {record.gameId !== null ? (
                      <Link
                        href={`/games/${record.gameId}`}
                        className="truncate font-mono text-[0.6rem] uppercase tracking-[0.14em] text-rvl-dim no-underline transition-colors hover:text-rvl-accent"
                      >
                        {record.gameName ?? `Game ${record.gameId}`}
                      </Link>
                    ) : record.seasonId !== null ? (
                      <Link
                        href={`/seasons/${record.seasonId}`}
                        className="truncate font-mono text-[0.6rem] uppercase tracking-[0.14em] text-rvl-dim no-underline transition-colors hover:text-rvl-accent"
                      >
                        S{record.seasonNumber ?? record.seasonId}
                      </Link>
                    ) : null}

                    <span
                      className={cn(
                        "ml-auto font-mono text-[1.05rem] tabular-nums",
                        record.rank === 1 ? "font-bold text-rvl-accent" : "text-rvl-ink-2",
                      )}
                    >
                      {record.value}
                    </span>
                  </li>
                ))}
              </ol>

              <p className="m-0 mt-3 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-rvl-dim">
                {topMark?.gameId
                  ? `Top mark: ${topMark.gameName ?? `Game ${topMark.gameId}`}`
                  : topMark?.seasonNumber
                    ? `Top mark: Season ${topMark.seasonNumber}`
                    : "Top ten, all time"}
              </p>
            </section>
          );
        })}
      </div>
    </>
  );
}
