"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
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

const isPodium = (placement: string) => /champion|1st|2nd|3rd|runner/i.test(placement);

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
            id="placement-filter"
            label="Placement"
            value={placement}
            onChange={(value) => {
              setPlacement(value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All placements" },
              ...placements.map((value) => ({ value, label: value })),
            ]}
          />

          <SearchBar
            className="max-w-[340px]"
            value={search}
            placeholder="Search teams"
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />

          {search || season || placement ? <ClearFiltersButton onClick={clearFilters} /> : null}

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

      <div className="grid grid-cols-1 gap-6 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-3 xl:px-14 2xl:grid-cols-4">
        {visible.map((team) => {
          const place = normalizePlacement(team.placement);

          return (
            <Link
              key={team.id}
              href={`/teams/${encodeURIComponent(team.name)}`}
              className="group relative block overflow-hidden border border-rvl-line p-6 text-inherit no-underline transition-colors hover:border-rvl-accent-soft"
            >
              {team.logoUrl ? (
                <img
                  src={team.logoUrl}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-6 -top-6 size-32 object-contain opacity-[0.07] transition-opacity group-hover:opacity-15"
                />
              ) : null}

              <div className="relative flex items-center gap-3">
                {team.logoUrl ? (
                  <img
                    src={team.logoUrl}
                    alt=""
                    className="size-10 shrink-0 rounded-xs border border-rvl-line object-cover"
                  />
                ) : null}
                <h2 className="m-0 text-[1.2rem] font-bold capitalize leading-tight">
                  {team.name}
                </h2>
              </div>

              {place ? (
                <span
                  className={cn(
                    "relative mt-4 inline-block border px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.18em]",
                    isPodium(place)
                      ? "border-rvl-accent-soft text-rvl-accent"
                      : "border-rvl-line text-rvl-dim",
                  )}
                >
                  {place}
                </span>
              ) : null}

              <dl className="relative mt-5 flex gap-7 font-mono">
                <div className="flex flex-col gap-1">
                  <dt className="text-[0.56rem] uppercase tracking-[0.2em] text-rvl-dim">Season</dt>
                  <dd className="m-0 text-[0.95rem] tabular-nums">{team.seasonNumber ?? "—"}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-[0.56rem] uppercase tracking-[0.2em] text-rvl-dim">
                    Players
                  </dt>
                  <dd className="m-0 text-[0.95rem] tabular-nums">{team.playerCount}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-[0.56rem] uppercase tracking-[0.2em] text-rvl-dim">ID</dt>
                  <dd className="m-0 text-[0.95rem] tabular-nums text-rvl-dim">{team.id}</dd>
                </div>
              </dl>
            </Link>
          );
        })}
      </div>
    </>
  );
}
