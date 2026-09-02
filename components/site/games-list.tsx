"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClearFiltersButton, FilterSelect, Pagination, SearchBar } from "./controls";

export interface GameListRow {
  id: number;
  name: string;
  date: string;
  stage: string | null;
  seasonNumber: number | null;
  team1Score: number;
  team2Score: number;
}

const PER_PAGE = 25;

// A game date is a plain YYYY-MM-DD string, which Date parses as UTC midnight.
// Formatting it in the viewer's zone would shift it a day west of UTC and disagree
// with the server render, so pin the calendar to UTC.
function shortDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });
}

export function GamesList({ games }: { games: GameListRow[] }) {
  const [search, setSearch] = useState("");
  const [season, setSeason] = useState("");
  const [stage, setStage] = useState("");
  const [page, setPage] = useState(1);

  const seasons = useMemo(() => {
    const values = new Set<number>();
    games.forEach((game) => {
      if (game.seasonNumber != null) values.add(game.seasonNumber);
    });
    return [...values].sort((a, b) => b - a);
  }, [games]);

  const stages = useMemo(() => {
    const values = new Set<string>();
    games.forEach((game) => {
      if (game.stage) values.add(game.stage);
    });
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [games]);

  const filtered = useMemo(
    () =>
      games.filter((game) => {
        const matchesSearch = game.name.toLowerCase().includes(search.toLowerCase());
        const matchesSeason = !season || String(game.seasonNumber) === season;
        const matchesStage = !stage || game.stage === stage;
        return matchesSearch && matchesSeason && matchesStage;
      }),
    [games, search, season, stage],
  );

  const totalPages = Math.max(Math.ceil(filtered.length / PER_PAGE), 1);
  const current = Math.min(page, totalPages);
  const visible = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const clearFilters = () => {
    setSearch("");
    setSeason("");
    setStage("");
    setPage(1);
  };

  return (
    <>
      <div className="flex flex-col gap-6 border-b border-rvl-line px-5 py-7 sm:px-8 xl:px-14">
        <div className="flex flex-wrap items-end gap-5">
          <FilterSelect
            id="season-filter"
            label="Season"
            value={season}
            onChange={(value) => {
              setSeason(value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All seasons" },
              ...seasons.map((value) => ({ value: String(value), label: `Season ${value}` })),
            ]}
          />

          <FilterSelect
            id="stage-filter"
            label="Stage"
            value={stage}
            onChange={(value) => {
              setStage(value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All stages" },
              ...stages.map((value) => ({ value, label: value })),
            ]}
          />

          <SearchBar
            className="max-w-[340px]"
            value={search}
            placeholder="Search games"
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />

          {search || season || stage ? <ClearFiltersButton onClick={clearFilters} /> : null}

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

      <div className="px-5 py-12 sm:px-8 xl:px-14">
        <div className="border-t border-rvl-line">
          {visible.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-rvl-line py-5 text-inherit no-underline transition-colors hover:bg-rvl-panel"
            >
              <span className="w-[150px] shrink-0 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-rvl-dim">
                {shortDate(game.date)}
              </span>
              <span className="text-[1.02rem] font-semibold capitalize">{game.name}</span>
              <span className="font-mono text-[1.15rem] font-bold tabular-nums text-rvl-accent">
                {game.team1Score}
                <span className="px-1.5 text-rvl-dim">–</span>
                {game.team2Score}
              </span>
              <span className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-dim md:ml-auto">
                S{game.seasonNumber ?? "—"}
                {game.stage ? ` · ${game.stage}` : ""}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
