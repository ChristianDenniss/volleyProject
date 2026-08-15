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
  seasonId?: number;
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
      <div className="my-5 flex flex-col gap-4">
        <div className="flex w-full flex-row flex-wrap items-center justify-between gap-4 max-md:flex-col max-md:items-stretch max-md:gap-2.5">
          <FilterSelect
            id="stats-season-filter"
            label="Season:"
            value={seasonId ? String(seasonId) : ""}
            onChange={(value) => router.push(value ? `/stats?season=${value}` : "/stats")}
          >
            <option value="">All Seasons</option>
            {seasons.map((season) => (
              <option key={season.id} value={String(season.id)}>
                Season {season.seasonNumber}
              </option>
            ))}
          </FilterSelect>

          <div className="ml-auto w-[300px] max-md:ml-0 max-md:w-full">
            <SearchBar
              value={search}
              placeholder="Search players..."
              onSearch={(value) => {
                setSearch(value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="flex flex-row flex-wrap items-center justify-between gap-4 max-md:flex-col max-md:items-stretch max-md:gap-2.5">
          <span className="font-medium text-[#2d3748]">{sorted.length} players</span>
          <div className="whitespace-nowrap">
            <Pagination
              variant="compact"
              currentPage={current}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-t shadow-[0_2px_8px_rgba(26,54,93,0.08)]">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr>
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  onClick={() => toggleSort(column.key)}
                  className="cursor-pointer select-none border-b border-[#e2e8f0] bg-brand-navy p-3 text-center font-semibold text-white transition-colors duration-200 hover:bg-brand-navy-hover max-md:px-[3px] max-md:py-1.5 max-md:text-[11px]"
                >
                  {column.label}
                  {sortKey === column.key ? (
                    <span className="ml-1.5 text-[0.8em]">{ascending ? "▲" : "▼"}</span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.playerId} className="transition-colors hover:bg-[#f7fafc]">
                {COLUMNS.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "border-b border-[#e2e8f0] p-3 text-center max-md:px-[3px] max-md:py-1.5 max-md:text-[11px]",
                      column.key === "playerName" && "font-medium capitalize",
                    )}
                  >
                    {column.key === "playerName" ? (
                      <Link href={`/players/${row.playerId}`} className="hover:underline">
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
