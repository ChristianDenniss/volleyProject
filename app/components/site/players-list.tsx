"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ClearFiltersButton, FilterSelect, Pagination, SearchBar } from "./controls";

export interface PlayerListRow {
  id: number;
  name: string;
  position: string | null;
  teams: { name: string; seasonNumber: number | null }[];
}

const PER_PAGE = 25;

export function PlayersList({ players }: { players: PlayerListRow[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [season, setSeason] = useState("");
  const [position, setPosition] = useState("");
  const [page, setPage] = useState(1);

  const seasons = useMemo(() => {
    const values = new Set<number>();
    players.forEach((player) =>
      player.teams.forEach((team) => {
        if (team.seasonNumber != null) values.add(team.seasonNumber);
      }),
    );
    return [...values].sort((a, b) => a - b);
  }, [players]);

  const positions = useMemo(() => {
    const values = new Set<string>();
    players.forEach((player) => {
      if (player.position && player.position !== "N/A") values.add(player.position);
    });
    return [...values].sort();
  }, [players]);

  const filtered = useMemo(
    () =>
      players.filter((player) => {
        const matchesSearch = player.name.toLowerCase().includes(search.toLowerCase());
        const matchesSeason =
          !season || player.teams.some((team) => String(team.seasonNumber) === season);
        const matchesPosition = !position || player.position === position;
        return matchesSearch && matchesSeason && matchesPosition;
      }),
    [players, search, season, position],
  );

  const totalPages = Math.max(Math.ceil(filtered.length / PER_PAGE), 1);
  const current = Math.min(page, totalPages);
  const visible = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const clearFilters = () => {
    setSearch("");
    setSeason("");
    setPosition("");
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
              id="position-filter"
              label="Position:"
              value={position}
              onChange={(value) => {
                setPosition(value);
                setPage(1);
              }}
            >
              <option value="">All Positions</option>
              {positions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </FilterSelect>

            {search || season || position ? <ClearFiltersButton onClick={clearFilters} /> : null}
          </div>

          <div className="flex flex-row flex-wrap items-center justify-between gap-4 max-md:flex-col max-md:items-stretch max-md:gap-2.5">
            <SearchBar
              value={search}
              placeholder="Search players..."
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

      <div className="flex flex-col gap-2.5 py-2.5">
        {visible.map((player) => {
          const open = expanded === player.id;
          const teamLines = player.teams.reduce<{ name: string; seasonNumber: number | null }[][]>(
            (groups, team, index) => {
              const chunk = Math.floor(index / 5);
              groups[chunk] = groups[chunk] ?? [];
              groups[chunk].push(team);
              return groups;
            },
            [],
          );

          return (
            <div
              key={player.id}
              onClick={() => setExpanded(open ? null : player.id)}
              className={cn(
                "box-border min-h-[80px] cursor-pointer overflow-hidden rounded-[20px] border-2 border-[#CFFFFF] bg-[#e6f2ff] text-black shadow-[0_2px_6px_rgba(0,0,0,0.05)] transition-[background-color,transform] duration-300 hover:scale-[1.02] hover:bg-[#cce0ff]",
              )}
            >
              <div className="flex h-[60px] min-h-[60px] flex-row items-center justify-between whitespace-nowrap px-[30px] max-md:h-auto max-md:min-h-0 max-md:flex-col max-md:items-start max-md:gap-1 max-md:px-5 max-md:py-3">
                <div className="mx-5 shrink-0 whitespace-nowrap text-[22px] font-bold capitalize max-md:mx-0 max-md:text-lg">
                  <strong>{player.name}</strong>
                </div>
                <div className="mx-5 shrink-0 whitespace-nowrap text-[22px] font-bold max-md:mx-0 max-md:text-base">
                  <strong>ID:</strong> {player.id}
                </div>
                <div className="mx-5 shrink-0 whitespace-nowrap text-[22px] font-bold max-md:mx-0 max-md:text-base">
                  <strong>Total Teams:</strong> {player.teams.length}
                </div>
              </div>

              <div
                className={cn(
                  "overflow-hidden bg-[#f3f9ff] px-[30px] text-lg leading-relaxed text-[#333] transition-all duration-300 ease-out max-md:px-5",
                  open ? "max-h-[800px] py-4" : "max-h-0 py-0",
                )}
              >
                <p className="my-2.5">
                  <strong className="inline-block w-[100px] text-[#005999]">Position:</strong>{" "}
                  {player.position || "N/A"}
                </p>
                <p className="my-2.5">
                  <strong className="inline-block w-[100px] text-[#005999]">Teams:</strong>
                </p>
                {player.teams.length > 0 ? (
                  teamLines.map((group, index) => (
                    <div key={index} className="my-[5px]">
                      {group.map((team) => (
                        <Link
                          key={`${team.name}-${team.seasonNumber}`}
                          href={`/teams/${encodeURIComponent(team.name)}`}
                          onClick={(event) => event.stopPropagation()}
                          className="m-0.5 inline-block rounded border border-[#CFFFFF] bg-[#e6f2ff] px-2 py-1 text-[#005999] no-underline hover:bg-[#cce0ff]"
                        >
                          {team.name} (Season {team.seasonNumber ?? "N/A"})
                        </Link>
                      ))}
                    </div>
                  ))
                ) : (
                  <span>No Teams To Show</span>
                )}
                <div className="mt-4 pr-[30px] text-right max-md:pr-0">
                  <Link
                    href={`/players/${player.id}`}
                    onClick={(event) => event.stopPropagation()}
                    className="inline-block rounded-md bg-[#cce0ff] px-5 py-2 text-base font-semibold text-[#005999] no-underline transition-all duration-200 hover:bg-[#CFFFFF]"
                  >
                    See More
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
