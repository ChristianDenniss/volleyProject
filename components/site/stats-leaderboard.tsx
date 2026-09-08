"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useListQuery } from "@/hooks/use-list-query";
import {
  decodeFilterConditions,
  defaultSortDirection,
  encodeFilterConditions,
  getRowStatValue,
  type FilterCondition,
  type FilterStatKey,
  type LeaderboardSortKey,
  type SortDirection,
  type StatType,
} from "@/lib/stats/leaderboard-filters";
import { STAGE_ROUND_OPTIONS } from "@/lib/stats/stage-rounds";
import { UrlClearFilters, UrlFilterSelect, UrlPagination, UrlSearchBar } from "./url-controls";
import { StatsAdvancedFilter } from "./stats-advanced-filter";

export type { StatType };

export interface LeaderboardRow {
  playerId: number;
  playerName: string;
  position: string;
  teamName: string | null;
  teamLogoUrl: string | null;
  gamesPlayed: number;
  totalSets: number;
  spikeKills: number;
  spikeAttempts: number;
  apeKills: number;
  apeAttempts: number;
  totalKills: number;
  totalAttempts: number;
  spikingPercentage: number;
  spikingErrors: number;
  assists: number;
  settingErrors: number;
  blocks: number;
  blockFollows: number;
  digs: number;
  aces: number;
  servingErrors: number;
  miscErrors: number;
  totalErrors: number;
}

type ColumnKey = LeaderboardSortKey;

type Column = {
  key: ColumnKey;
  label: string;
  suffix?: string;
  isPercentage?: boolean;
};

const ALL_COLUMNS: Column[] = [
  { key: "playerName", label: "Player" },
  { key: "gamesPlayed", label: "Games" },
  { key: "spikeKills", label: "Spike Kills" },
  { key: "spikeAttempts", label: "Spike Attempts" },
  { key: "Spike%", label: "Spike %", suffix: "%", isPercentage: true },
  { key: "apeKills", label: "Ape Kills" },
  { key: "apeAttempts", label: "Ape Attempts" },
  { key: "Ape%", label: "Ape %", suffix: "%", isPercentage: true },
  { key: "totalKills", label: "Total Kills" },
  { key: "totalAttempts", label: "Total Attempts" },
  { key: "totalSpike%", label: "Total Spike %", suffix: "%", isPercentage: true },
  { key: "spikingErrors", label: "Spiking Errors" },
  { key: "blocks", label: "Blocks" },
  { key: "assists", label: "Assists" },
  { key: "settingErrors", label: "Setting Errors" },
  { key: "digs", label: "Digs" },
  { key: "blockFollows", label: "Block Follows" },
  { key: "totalReceives", label: "Total Receives" },
  { key: "aces", label: "Aces" },
  { key: "servingErrors", label: "Serving Errors" },
  { key: "PRF", label: "PRF" },
  { key: "plusMinus", label: "Plus Minus" },
  { key: "totalErrors", label: "Total Errors" },
  { key: "miscErrors", label: "Misc Errors" },
];

const DEFAULT_VISIBLE: Record<ColumnKey, boolean> = {
  playerName: true,
  teamName: false,
  gamesPlayed: false,
  spikeKills: false,
  spikeAttempts: false,
  "Spike%": false,
  apeKills: false,
  apeAttempts: false,
  "Ape%": false,
  totalKills: true,
  totalAttempts: true,
  "totalSpike%": true,
  spikingErrors: false,
  blocks: true,
  assists: true,
  settingErrors: false,
  digs: false,
  blockFollows: false,
  totalReceives: true,
  aces: true,
  servingErrors: false,
  PRF: false,
  plusMinus: false,
  totalErrors: true,
  miscErrors: false,
};

const FILTER_KEYS = ["q", "type", "f", "round"];
const CONDITION_DEBOUNCE_MS = 300;

const teamPillClass =
  "inline-flex max-w-full items-center gap-2 rounded-full border border-rvl-line bg-rvl-panel px-3 py-1.5 text-[0.88rem] font-semibold capitalize text-rvl-ink no-underline transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent";

function formatCellValue(row: LeaderboardRow, column: Column, statType: StatType): string {
  if (column.key === "playerName") return row.playerName;
  if (column.key === "teamName") return row.teamName ?? "";

  const value = getRowStatValue(row, column.key as FilterStatKey, statType);
  if (column.isPercentage) return `${value.toFixed(2)}%`;
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(2);
}

function statTypeSuffix(statType: StatType): string {
  if (statType === "perGame") return " / G";
  if (statType === "perSet") return " / S";
  return "";
}

function useUrlConditions() {
  const { get, setParams } = useListQuery();
  const encoded = get("f");
  const [conditions, setConditions] = useState<FilterCondition[]>(() =>
    decodeFilterConditions(encoded),
  );
  const latest = useRef(encoded);

  useEffect(() => {
    if (encoded !== latest.current) {
      latest.current = encoded;
      setConditions(decodeFilterConditions(encoded));
    }
  }, [encoded]);

  useEffect(() => {
    const next = encodeFilterConditions(conditions);
    if (next === latest.current) return;

    const timer = setTimeout(() => {
      latest.current = next;
      setParams({ f: next === "" ? null : next });
    }, CONDITION_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [conditions, setParams]);

  return { conditions, setConditions };
}

export function StatsLeaderboard({
  rows,
  seasons,
  seasonId,
  statType,
  sort,
  dir,
  page,
  perPage,
  total,
  totalPages,
}: {
  rows: LeaderboardRow[];
  seasons: { id: number; seasonNumber: number }[];
  seasonId?: number | undefined;
  statType: StatType;
  sort: LeaderboardSortKey;
  dir: SortDirection;
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}) {
  const { setParams } = useListQuery();
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [visibleStats, setVisibleStats] = useState(DEFAULT_VISIBLE);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const { conditions, setConditions } = useUrlConditions();

  useEffect(() => {
    if (!showFilterMenu || !filterButtonRef.current) return;
    const rect = filterButtonRef.current.getBoundingClientRect();
    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      minWidth: Math.max(rect.width, 320),
      zIndex: 50,
    });
  }, [showFilterMenu]);

  useEffect(() => {
    if (!showFilterMenu) return;
    const close = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (filterButtonRef.current?.contains(target)) return;
      if (filterMenuRef.current?.contains(target)) return;
      setShowFilterMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showFilterMenu]);

  const visibleColumns = useMemo(() => {
    const columns = ALL_COLUMNS.filter((column) => visibleStats[column.key]);
    if (!seasonId) return columns;

    const playerIndex = columns.findIndex((column) => column.key === "playerName");
    if (playerIndex === -1) return columns;

    const withTeam = [...columns];
    withTeam.splice(playerIndex + 1, 0, { key: "teamName", label: "Team" });
    return withTeam;
  }, [visibleStats, seasonId]);

  const toggleSort = useCallback(
    (key: ColumnKey) => {
      const nextDir: SortDirection =
        key === sort ? (dir === "asc" ? "desc" : "asc") : defaultSortDirection(key);
      setParams({ sort: key, dir: nextDir });
    },
    [sort, dir, setParams],
  );

  const toggleStatVisibility = (column: ColumnKey) => {
    if (column === "playerName") return;
    setVisibleStats((columns) => ({ ...columns, [column]: !columns[column] }));
  };

  const toggleAllStats = () => {
    const allOn = Object.entries(visibleStats)
      .filter(([key]) => key !== "playerName")
      .every(([, value]) => value);
    const next = { ...visibleStats };
    for (const column of ALL_COLUMNS) {
      if (column.key !== "playerName") next[column.key] = !allOn;
    }
    setVisibleStats(next);
  };

  const typeSuffix = statTypeSuffix(statType);
  const firstRank = (page - 1) * perPage + 1;

  return (
    <>
      <header className="px-5 py-10 sm:px-8 sm:py-12 xl:px-14">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-[52ch]">
            <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
              Leaderboard
            </span>
            <h1 className="mt-4 mb-0 text-balance text-[2.2rem] font-black uppercase leading-[0.95] tracking-[-0.035em] sm:text-[2.7rem]">
              Stat leaders
            </h1>
            <p className="m-0 mt-4 text-[0.98rem] text-rvl-ink-2">
              Sort any column to rank the league. Season totals come from every recorded stat line.
            </p>
          </div>

          <Link
            href="/records"
            className="rounded-xs border border-rvl-accent-soft bg-rvl-accent-soft px-4 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-ink no-underline transition-colors hover:border-rvl-accent hover:text-rvl-accent"
          >
            View stat records
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <UrlFilterSelect
              id="stats-season-filter"
              label="Season"
              paramKey="season"
              options={[
                { value: "", label: "All seasons" },
                ...seasons.map((season) => ({
                  value: String(season.id),
                  label: `Season ${season.seasonNumber}`,
                })),
              ]}
            />

            <UrlFilterSelect
              id="stats-round-filter"
              label="Round"
              paramKey="round"
              options={STAGE_ROUND_OPTIONS.map((option) => ({
                value: option.value === "all" ? "" : option.value,
                label: option.label,
              }))}
            />

            <UrlFilterSelect
              id="stats-type-filter"
              label="Stat type"
              paramKey="type"
              options={[
                { value: "", label: "Totals" },
                { value: "perGame", label: "Per game" },
                { value: "perSet", label: "Per set" },
              ]}
            />

            <div className="relative flex flex-col gap-1.5">
              <span className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-rvl-dim">
                Filter stats
              </span>
              <button
                ref={filterButtonRef}
                type="button"
                onClick={() => setShowFilterMenu((value) => !value)}
                className={cn(
                  "cursor-pointer rounded-xs border px-3.5 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] transition-colors",
                  showFilterMenu
                    ? "border-rvl-accent-soft bg-rvl-accent-soft text-rvl-accent"
                    : "border-rvl-line bg-transparent text-rvl-ink hover:border-rvl-line-strong",
                )}
              >
                Filter stats
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-rvl-dim">
                Advanced
              </span>
              <button
                type="button"
                onClick={() => setShowAdvancedFilter((value) => !value)}
                className={cn(
                  "cursor-pointer rounded-xs border px-3.5 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] transition-colors",
                  showAdvancedFilter || conditions.length > 0
                    ? "border-rvl-accent-soft bg-rvl-accent-soft text-rvl-accent"
                    : "border-rvl-line bg-transparent text-rvl-ink hover:border-rvl-line-strong",
                )}
              >
                Advanced filters
                {conditions.length > 0 ? ` (${conditions.length})` : ""}
              </button>
            </div>

            <UrlClearFilters keys={FILTER_KEYS} />
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <UrlSearchBar className="min-w-[220px] flex-1" placeholder="Search players" />

            <div className="flex items-center gap-4">
              <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-dim">
                {total} players
              </span>
              <UrlPagination variant="compact" totalPages={totalPages} />
            </div>
          </div>
        </div>

        {showAdvancedFilter ? (
          <div className="mt-6">
            <StatsAdvancedFilter conditions={conditions} onConditionsChange={setConditions} />
          </div>
        ) : null}
      </header>

      {showFilterMenu ? (
        <div
          ref={filterMenuRef}
          className="rounded-xs border border-rvl-line bg-rvl-ground p-4 shadow-lg"
          style={menuStyle}
        >
          <label className="mb-3 flex items-center gap-2 pb-1 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-rvl-ink">
            <input
              type="checkbox"
              checked={visibleColumns.length === ALL_COLUMNS.length}
              onChange={toggleAllStats}
            />
            All stats
          </label>
          <div className="grid max-h-[320px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {ALL_COLUMNS.filter((column) => column.key !== "playerName").map((column) => (
              <label
                key={column.key}
                className="flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-rvl-ink-2"
              >
                <input
                  type="checkbox"
                  checked={visibleStats[column.key]}
                  onChange={() => toggleStatVisibility(column.key)}
                />
                {column.label}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="px-5 pb-20 text-center font-mono text-[0.78rem] uppercase tracking-[0.14em] text-rvl-dim sm:px-8 xl:px-14">
          No players match those filters.
        </div>
      ) : (
      <div className="overflow-x-auto px-5 pb-12 sm:px-8 xl:px-14">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr>
              <th className="pb-3 pr-4 text-left font-mono text-[0.6rem] uppercase tracking-[0.2em] text-rvl-dim">
                #
              </th>
              {visibleColumns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => toggleSort(column.key)}
                  className={cn(
                    "cursor-pointer select-none px-4 pb-3 font-mono text-[0.6rem] font-bold uppercase tracking-[0.2em] transition-colors",
                    column.key === "playerName" || column.key === "teamName"
                      ? "text-left"
                      : "text-right",
                    sort === column.key ? "text-rvl-accent" : "text-rvl-dim hover:text-rvl-ink",
                  )}
                >
                  {column.label}
                  {column.key !== "playerName" && typeSuffix ? (
                    <span className="ml-1 normal-case tracking-normal text-rvl-dim">
                      {typeSuffix}
                    </span>
                  ) : null}
                  {sort === column.key ? (
                    <span className="ml-1.5">{dir === "asc" ? "▲" : "▼"}</span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.playerId} className="transition-colors hover:bg-rvl-panel">
                <td className="py-3.5 pr-4 font-mono text-[0.72rem] tabular-nums text-rvl-dim">
                  {firstRank + index}
                </td>
                {visibleColumns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-4 py-3.5",
                      column.key === "playerName"
                        ? "text-left text-[0.98rem] font-semibold capitalize"
                        : column.key === "teamName"
                          ? "text-left"
                          : "text-right font-mono text-[0.88rem] tabular-nums",
                      sort === column.key &&
                        column.key !== "playerName" &&
                        column.key !== "teamName"
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
                    ) : column.key === "teamName" ? (
                      row.teamName ? (
                        <Link
                          href={`/teams/${encodeURIComponent(row.teamName)}`}
                          className={teamPillClass}
                        >
                          {row.teamLogoUrl ? (
                            <img
                              src={row.teamLogoUrl}
                              alt=""
                              className="size-5 shrink-0 rounded-full border border-rvl-line object-cover"
                            />
                          ) : null}
                          <span className="truncate">{row.teamName}</span>
                        </Link>
                      ) : (
                        <span className="font-mono text-[0.78rem] text-rvl-dim">N/A</span>
                      )
                    ) : (
                      formatCellValue(row, column, statType)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </>
  );
}
