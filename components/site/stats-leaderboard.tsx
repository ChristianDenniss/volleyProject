"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FilterSelect, Pagination, SearchBar } from "./controls";

export interface LeaderboardRow {
  playerId: number;
  playerName: string;
  gamesPlayed: number;
  totalKills: number;
  spikingPercentage: number;
  assists: number;
  blocks: number;
  digs: number;
  aces: number;
  totalErrors: number;
}

type Column = {
  key: keyof LeaderboardRow;
  label: string;
  suffix?: string;
};

const COLUMNS: Column[] = [
  { key: "playerName", label: "Player" },
  { key: "gamesPlayed", label: "Games" },
  { key: "totalKills", label: "Kills" },
  { key: "spikingPercentage", label: "Kill %", suffix: "%" },
  { key: "assists", label: "Assists" },
  { key: "blocks", label: "Blocks" },
  { key: "digs", label: "Digs" },
  { key: "aces", label: "Aces" },
  { key: "totalErrors", label: "Errors" },
];

const PER_PAGE = 25;

export function StatsLeaderboard({
  rows,
  seasons,
  seasonId,
}: {
  rows: LeaderboardRow[];
  seasons: { id: number; seasonNumber: number }[];
  seasonId?: number | undefined;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof LeaderboardRow>("totalKills");
  const [ascending, setAscending] = useState(false);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const filtered = rows.filter((row) =>
      row.playerName.toLowerCase().includes(search.toLowerCase()),
    );
    return [...filtered].sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];
      if (typeof left === "string" || typeof right === "string") {
        const comparison = String(left).localeCompare(String(right));
        return ascending ? comparison : -comparison;
      }
      return ascending ? Number(left) - Number(right) : Number(right) - Number(left);
    });
  }, [rows, search, sortKey, ascending]);

  const totalPages = Math.max(Math.ceil(sorted.length / PER_PAGE), 1);
  const current = Math.min(page, totalPages);
  const visible = sorted.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const podium = sorted.slice(0, 3);
  const sortLabel = COLUMNS.find((column) => column.key === sortKey)?.label ?? "";
  const sortSuffix = COLUMNS.find((column) => column.key === sortKey)?.suffix ?? "";

  const toggleSort = (key: keyof LeaderboardRow) => {
    if (key === sortKey) {
      setAscending((value) => !value);
      return;
    }
    setSortKey(key);
    setAscending(key === "playerName");
  };

  return (
    <>
      <div className="flex flex-col gap-6 border-b border-rvl-line px-5 py-7 sm:px-8 xl:px-14">
        <div className="flex flex-wrap items-end gap-5">
          <FilterSelect
            id="stats-season-filter"
            label="Season"
            value={seasonId ? String(seasonId) : ""}
            onChange={(value) => router.push(value ? `/stats?season=${value}` : "/stats")}
            options={[
              { value: "", label: "All seasons" },
              ...seasons.map((season) => ({
                value: String(season.id),
                label: `Season ${season.seasonNumber}`,
              })),
            ]}
          />

          <SearchBar
            className="max-w-[340px]"
            value={search}
            placeholder="Search players"
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />

          <span className="self-end pb-2.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-dim">
            {sorted.length} players
          </span>

          <div className="ml-auto self-end">
            <Pagination
              variant="compact"
              currentPage={current}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      {podium.length > 0 && sortKey !== "playerName" ? (
        <div className="grid grid-cols-1 gap-8 border-b border-rvl-line px-5 py-12 sm:grid-cols-3 sm:px-8 xl:px-14">
          {podium.map((row, index) => (
            <Link
              key={row.playerId}
              href={`/players/${row.playerId}`}
              className="block text-inherit no-underline"
            >
              <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-rvl-dim">
                {ascending ? "Lowest" : "Top"} {sortLabel} · #{index + 1}
              </div>
              <div className="my-3 font-mono text-[2.6rem] font-bold leading-none tracking-[-0.045em] tabular-nums text-rvl-accent">
                {row[sortKey]}
                {sortSuffix}
              </div>
              <div className="text-[1.02rem] font-semibold capitalize">{row.playerName}</div>
              <div className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-rvl-dim">
                {row.gamesPlayed} games
              </div>
            </Link>
          ))}
        </div>
      ) : null}

      <div className="overflow-x-auto px-5 py-12 sm:px-8 xl:px-14">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr>
              <th className="border-b border-rvl-line-strong pb-3 pr-4 text-left font-mono text-[0.6rem] uppercase tracking-[0.2em] text-rvl-dim">
                #
              </th>
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  onClick={() => toggleSort(column.key)}
                  className={cn(
                    "cursor-pointer select-none border-b border-rvl-line-strong px-4 pb-3 font-mono text-[0.6rem] font-bold uppercase tracking-[0.2em] transition-colors",
                    column.key === "playerName" ? "text-left" : "text-right",
                    sortKey === column.key
                      ? "text-rvl-accent"
                      : "text-rvl-dim hover:text-rvl-ink",
                  )}
                >
                  {column.label}
                  {sortKey === column.key ? (
                    <span className="ml-1.5">{ascending ? "▲" : "▼"}</span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <tr key={row.playerId} className="transition-colors hover:bg-rvl-panel">
                <td className="border-b border-rvl-line py-3.5 pr-4 font-mono text-[0.72rem] tabular-nums text-rvl-dim">
                  {(current - 1) * PER_PAGE + index + 1}
                </td>
                {COLUMNS.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "border-b border-rvl-line px-4 py-3.5",
                      column.key === "playerName"
                        ? "text-left text-[0.98rem] font-semibold capitalize"
                        : "text-right font-mono text-[0.88rem] tabular-nums",
                      sortKey === column.key && column.key !== "playerName"
                        ? "font-bold text-rvl-accent"
                        : "text-rvl-ink-2",
                    )}
                  >
                    {column.key === "playerName" ? (
                      <Link
                        href={`/players/${row.playerId}`}
                        className="text-rvl-ink no-underline hover:text-rvl-accent"
                      >
                        {row.playerName}
                      </Link>
                    ) : (
                      `${row[column.key]}${column.suffix ?? ""}`
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
