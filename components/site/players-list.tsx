"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
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
            id="position-filter"
            label="Position"
            value={position}
            onChange={(value) => {
              setPosition(value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All positions" },
              ...positions.map((value) => ({ value, label: value })),
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

          {search || season || position ? <ClearFiltersButton onClick={clearFilters} /> : null}

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
          {visible.map((player) => {
            const open = expanded === player.id;

            return (
              <div key={player.id} className="border-b border-rvl-line">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setExpanded(open ? null : player.id)}
                  className="flex w-full cursor-pointer items-center gap-5 border-none bg-transparent px-0 py-5 text-left transition-colors hover:text-rvl-accent sm:gap-8"
                >
                  <span className="w-12 shrink-0 font-mono text-[0.72rem] tabular-nums text-rvl-dim">
                    {player.id}
                  </span>
                  <span className="text-[1.05rem] font-semibold capitalize">{player.name}</span>
                  {player.position && player.position !== "N/A" ? (
                    <span className="hidden border border-rvl-line px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-rvl-dim sm:inline-block">
                      {player.position}
                    </span>
                  ) : null}
                  <span className="ml-auto font-mono text-[0.66rem] uppercase tracking-[0.14em] text-rvl-dim">
                    {player.teams.length} {player.teams.length === 1 ? "team" : "teams"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-rvl-dim transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </button>

                {open ? (
                  <div className="flex flex-col gap-5 border-t border-rvl-line bg-rvl-panel px-5 py-6 sm:px-8">
                    <div className="flex flex-col gap-2">
                      <span className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-rvl-dim">
                        Position
                      </span>
                      <span className="text-[0.95rem]">{player.position || "Unlisted"}</span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <span className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-rvl-dim">
                        Teams
                      </span>
                      {player.teams.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {player.teams.map((team) => (
                            <Link
                              key={`${team.name}-${team.seasonNumber}`}
                              href={`/teams/${encodeURIComponent(team.name)}`}
                              className="border border-rvl-line px-3 py-1.5 font-mono text-[0.66rem] uppercase tracking-[0.1em] text-rvl-ink-2 no-underline transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent"
                            >
                              {team.name} · S{team.seasonNumber ?? "-"}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <span className="font-mono text-[0.72rem] uppercase tracking-[0.12em] text-rvl-dim">
                          No teams yet
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/players/${player.id}`}
                      className="self-start border-b border-rvl-line pb-0.5 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-rvl-ink-2 no-underline transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent"
                    >
                      Full profile →
                    </Link>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
