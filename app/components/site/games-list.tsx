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
      <div className="my-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-row flex-wrap items-center gap-4 max-md:flex-col max-md:items-stretch max-md:gap-2.5">
            <FilterSelect
              id="season-filter"
              label="Season:"
              value={season}
              onChange={(value) => {
                setSeason(value);
                setPage(1);
              }}
            >
              <option value="">All Seasons</option>
              {seasons.map((value) => (
                <option key={value} value={String(value)}>
                  Season {value}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              id="stage-filter"
              label="Stage:"
              value={stage}
              onChange={(value) => {
                setStage(value);
                setPage(1);
              }}
            >
              <option value="">All Stages</option>
              {stages.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </FilterSelect>

            {search || season || stage ? <ClearFiltersButton onClick={clearFilters} /> : null}
          </div>

          <div className="flex flex-row flex-wrap items-center justify-between gap-4 max-md:flex-col max-md:items-stretch max-md:gap-2.5">
            <SearchBar
              value={search}
              placeholder="Search games..."
              onSearch={(value) => {
                setSearch(value);
                setPage(1);
              }}
            />
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
      </div>

      <div className="w-full overflow-x-auto py-2.5">
        <div className="flex min-w-[700px] flex-col gap-2.5 py-2.5">
          {visible.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className="box-border grid min-h-[60px] w-full cursor-pointer items-center gap-5 rounded-lg border border-[#d1e7ff] bg-[#f0f5ff] px-5 py-2.5 leading-snug text-[#2d3748] no-underline shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#e6f2ff] hover:shadow-[0_4px_10px_rgba(0,0,0,0.08)] [grid-template-columns:3fr_1fr_1.5fr_1fr_2.5fr_1.5fr]"
            >
              <div className="truncate text-left text-base font-bold text-[#1a202c]">
                <strong>{game.name}</strong>
              </div>
              <div className="truncate text-left text-[15px] font-medium">
                <strong className="mr-1.5 font-semibold text-[#4a5568]">ID:</strong>
                {game.id}
              </div>
              <div className="truncate text-left text-[15px] font-medium">
                <strong className="mr-1.5 font-semibold text-[#4a5568]">Score:</strong>
                {game.team1Score} - {game.team2Score}
              </div>
              <div className="truncate text-left text-[15px] font-medium">
                <strong className="mr-1.5 font-semibold text-[#4a5568]">Season:</strong>
                {game.seasonNumber ?? "N/A"}
              </div>
              <div className="truncate text-left text-[15px] font-medium">
                <strong className="mr-1.5 font-semibold text-[#4a5568]">Stage:</strong>
                {game.stage || "N/A"}
              </div>
              <div className="truncate text-left text-[15px] font-medium">
                <strong className="mr-1.5 font-semibold text-[#4a5568]">Date:</strong>
                {game.date}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
