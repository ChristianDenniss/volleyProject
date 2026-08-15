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

const rankBadge = (rank: number) =>
  rank === 1
    ? "bg-brand-gold text-[#1a1a1a]"
    : rank === 2
      ? "bg-brand-silver text-[#1a1a1a]"
      : rank === 3
        ? "bg-[#cd7f32] text-white"
        : "bg-brand-navy text-white";

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
      <div className="mb-8 flex justify-center">
        {types.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value)}
            className={cn(
              "mx-2 cursor-pointer rounded border-2 border-brand-navy px-6 py-3 font-bold uppercase text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.2)] max-[480px]:px-4 max-[480px]:py-2 max-[480px]:text-[0.9rem]",
              type === value ? "bg-brand-navy" : "bg-[#1a1a1a]",
            )}
          >
            {value} records
          </button>
        ))}
      </div>

      <div className="mb-8 grid grid-cols-3 gap-8 max-[1200px]:grid-cols-2 max-md:grid-cols-1 max-md:gap-6">
        {groups.map(([label, rows]) => (
          <section key={label} className="mb-8">
            <h2 className="relative mx-auto mb-4 max-w-fit text-center text-2xl font-bold uppercase leading-tight text-[#1a1a1a] max-md:text-[1.3rem] max-[480px]:text-[1.2rem]">
              {label}
            </h2>

            <div className="mb-4 max-h-[500px] overflow-y-auto rounded-lg border-2 border-brand-navy bg-[#1a1a1a] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.3)] max-md:max-h-[300px] max-md:overflow-x-auto">
              <table className="m-0 w-full border-collapse text-[0.85rem] max-md:text-[0.8em]">
                <thead className="sticky top-0 z-10 bg-brand-navy text-white">
                  <tr>
                    <th className="border-b-2 border-[#1a1a1a] px-1 py-2 text-left text-xs font-bold uppercase">
                      #
                    </th>
                    <th className="border-b-2 border-[#1a1a1a] px-1 py-2 text-left text-xs font-bold uppercase">
                      Player
                    </th>
                    <th className="border-b-2 border-[#1a1a1a] px-1 py-2 text-left text-xs font-bold uppercase">
                      Value
                    </th>
                    <th className="border-b-2 border-[#1a1a1a] px-1 py-2 text-left text-xs font-bold uppercase">
                      Where
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((record, index) => (
                    <tr
                      key={record.id}
                      className={cn(
                        "text-white transition-colors duration-200 hover:bg-[#333]",
                        index % 2 === 1 ? "bg-[#2a2a2a]" : "bg-[#1a1a1a]",
                      )}
                    >
                      <td className="border-b border-[#333] px-1 py-1.5 text-center align-middle font-bold">
                        <span
                          className={cn(
                            "inline-block size-6 rounded-full text-center text-[0.8rem] font-bold leading-6",
                            rankBadge(record.rank),
                          )}
                        >
                          {record.rank}
                        </span>
                      </td>
                      <td className="border-b border-[#333] px-1 py-1.5 align-middle">
                        <Link
                          href={`/players/${record.playerId}`}
                          className="text-[0.85rem] font-medium capitalize text-white no-underline transition-colors duration-200 hover:text-brand-navy-hover hover:underline"
                        >
                          {record.playerName}
                        </Link>
                      </td>
                      <td className="border-b border-[#333] px-1 py-1.5 align-middle text-base font-bold text-white">
                        {record.value}
                      </td>
                      <td className="border-b border-[#333] px-1 py-1.5 align-middle">
                        {record.gameId ? (
                          <Link
                            href={`/games/${record.gameId}`}
                            className="text-[0.85rem] font-medium text-white no-underline transition-colors duration-200 hover:text-brand-navy-hover hover:underline"
                          >
                            {record.gameName ?? `Game ${record.gameId}`}
                          </Link>
                        ) : record.seasonNumber ? (
                          <Link
                            href={`/seasons/${record.seasonId}`}
                            className="text-[0.85rem] font-medium text-white no-underline transition-colors duration-200 hover:text-brand-navy-hover hover:underline"
                          >
                            Season {record.seasonNumber}
                          </Link>
                        ) : (
                          <span className="text-[0.8rem] text-[#ccc]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
