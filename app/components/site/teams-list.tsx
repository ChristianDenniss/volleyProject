"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClearFiltersButton, FilterSelect, Pagination, SearchBar } from "./controls";

export interface TeamListRow {
  id: number;
  name: string;
  logoUrl: string | null;
  placement: string | null;
  seasonNumber: number | null;
  playerCount: number;
}

const PER_PAGE = 24;

const normalizePlacement = (placement: string | null) =>
  (placement ?? "").replace(/\s*\([Dd]\d\)$/, "").trim();

export function TeamsList({ teams }: { teams: TeamListRow[] }) {
  const [search, setSearch] = useState("");
  const [season, setSeason] = useState("");
  const [placement, setPlacement] = useState("");
  const [page, setPage] = useState(1);

  const seasons = useMemo(() => {
    const values = new Set<number>();
    teams.forEach((team) => {
      if (team.seasonNumber != null) values.add(team.seasonNumber);
    });
    return [...values].sort((a, b) => a - b);
  }, [teams]);

  const placements = useMemo(() => {
    const values = new Set<string>();
    teams.forEach((team) => {
      const value = normalizePlacement(team.placement);
      if (value) values.add(value);
    });
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [teams]);

  const filtered = useMemo(
    () =>
      teams.filter((team) => {
        const matchesSearch = team.name.toLowerCase().includes(search.toLowerCase());
        const matchesSeason = !season || String(team.seasonNumber) === season;
        const matchesPlacement = !placement || normalizePlacement(team.placement) === placement;
        return matchesSearch && matchesSeason && matchesPlacement;
      }),
    [teams, search, season, placement],
  );

  const totalPages = Math.max(Math.ceil(filtered.length / PER_PAGE), 1);
  const current = Math.min(page, totalPages);
  const visible = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const clearFilters = () => {
    setSearch("");
    setSeason("");
    setPlacement("");
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
              id="placement-filter"
              label="Placement:"
              value={placement}
              onChange={(value) => {
                setPlacement(value);
                setPage(1);
              }}
            >
              <option value="">All Placements</option>
              {placements.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </FilterSelect>

            {search || season || placement ? <ClearFiltersButton onClick={clearFilters} /> : null}
          </div>

          <div className="flex flex-row flex-wrap items-center justify-between gap-4 max-md:flex-col max-md:items-stretch max-md:gap-2.5">
            <SearchBar
              value={search}
              placeholder="Search teams..."
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

      <div className="grid content-start gap-6 py-2.5 [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]">
        {visible.map((team) => (
          <Link
            key={team.id}
            href={`/teams/${encodeURIComponent(team.name)}`}
            className="group relative box-border block min-h-[120px] cursor-pointer overflow-hidden rounded-[0.85rem] border border-[#1e1e1e] bg-[#141414] bg-linear-to-b from-white/7 from-0% to-transparent to-45% px-5 pb-[1.4rem] pt-7 no-underline transition-[transform,box-shadow] duration-150 hover:-translate-y-1 hover:shadow-[0_8px_22px_rgba(0,122,255,0.25)]"
          >
            {team.logoUrl ? (
              <div
                aria-hidden="true"
                style={{ backgroundImage: `url(${team.logoUrl})` }}
                className="pointer-events-none absolute right-0 top-0 z-0 size-[200px] translate-x-[30%] bg-contain bg-right bg-no-repeat opacity-25"
              />
            ) : null}

            <div className="relative z-1 mb-2 text-xl font-extrabold capitalize text-[#fafafa]">
              <strong>{team.name}</strong>
            </div>
            <div className="relative z-1 mb-1 text-sm font-medium text-[#a0a0a0]">
              <strong>ID:</strong> {team.id}
            </div>
            <div className="relative z-1 mb-1 text-sm font-medium text-[#a0a0a0]">
              <strong>Season:</strong> {team.seasonNumber ?? "N/A"}
            </div>
            <div className="relative z-1 mb-1 text-sm font-medium text-[#a0a0a0]">
              <strong>Placement:</strong> {team.placement || "N/A"}
            </div>
            <div className="relative z-1 mb-1 text-sm font-medium text-[#a0a0a0]">
              <strong>Players:</strong> {team.playerCount}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
