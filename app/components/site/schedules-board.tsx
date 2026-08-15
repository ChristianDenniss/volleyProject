"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Pagination, SearchBar } from "./controls";

export interface ScheduleMatch {
  id: number;
  matchNumber: string;
  round: string;
  status: string;
  region: string;
  date: string;
  team1Name: string | null;
  team2Name: string | null;
  team1LogoUrl: string | null;
  team2LogoUrl: string | null;
  team1Score: number | null;
  team2Score: number | null;
  setScores: (string | null)[];
}

const PER_PAGE = 40;

const filterSelectClass =
  "min-w-[150px] rounded-md border-2 border-[#e1e5e9] bg-white px-3 py-2 text-[0.9rem] focus:border-brand-navy focus:outline-none";

export function SchedulesBoard({
  matches,
  seasons,
  seasonId,
}: {
  matches: ScheduleMatch[];
  seasons: { id: number; seasonNumber: number }[];
  seasonId?: number;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [status, setStatus] = useState("");
  const [round, setRound] = useState("");
  const [page, setPage] = useState(1);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const regions = useMemo(
    () => [...new Set(matches.map((match) => match.region))].sort(),
    [matches],
  );
  const statuses = useMemo(
    () => [...new Set(matches.map((match) => match.status))].sort(),
    [matches],
  );
  const rounds = useMemo(() => [...new Set(matches.map((match) => match.round))].sort(), [matches]);

  const filtered = useMemo(
    () =>
      matches.filter((match) => {
        const haystack = `${match.team1Name ?? ""} ${match.team2Name ?? ""} ${match.matchNumber}`;
        return (
          haystack.toLowerCase().includes(search.toLowerCase()) &&
          (!region || match.region === region) &&
          (!status || match.status === status) &&
          (!round || match.round === round)
        );
      }),
    [matches, search, region, status, round],
  );

  const totalPages = Math.max(Math.ceil(filtered.length / PER_PAGE), 1);
  const current = Math.min(page, totalPages);
  const visible = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const byDate = useMemo(() => {
    const map = new Map<string, ScheduleMatch[]>();
    visible.forEach((match) => {
      map.set(match.date, [...(map.get(match.date) ?? []), match]);
    });
    return [...map.entries()];
  }, [visible]);

  const clearFilters = () => {
    setSearch("");
    setRegion("");
    setStatus("");
    setRound("");
    setPage(1);
  };

  return (
    <>
      <div className="mb-8 rounded-xl bg-[#f8f9fa] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
        <div className="mb-5 flex flex-wrap items-center gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="schedule-season" className="text-[0.9rem] font-semibold text-[#555]">
              Season
            </label>
            <select
              id="schedule-season"
              value={seasonId ? String(seasonId) : ""}
              onChange={(event) =>
                router.push(event.target.value ? `/schedules?season=${event.target.value}` : "/schedules")
              }
              className={filterSelectClass}
            >
              <option value="">All Seasons</option>
              {seasons.map((season) => (
                <option key={season.id} value={String(season.id)}>
                  Season {season.seasonNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="schedule-region" className="text-[0.9rem] font-semibold text-[#555]">
              Region
            </label>
            <select
              id="schedule-region"
              value={region}
              onChange={(event) => {
                setRegion(event.target.value);
                setPage(1);
              }}
              className={filterSelectClass}
            >
              <option value="">All Regions</option>
              {regions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="schedule-status" className="text-[0.9rem] font-semibold text-[#555]">
              Status
            </label>
            <select
              id="schedule-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className={filterSelectClass}
            >
              <option value="">All Statuses</option>
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="schedule-round" className="text-[0.9rem] font-semibold text-[#555]">
              Round
            </label>
            <select
              id="schedule-round"
              value={round}
              onChange={(event) => {
                setRound(event.target.value);
                setPage(1);
              }}
              className={filterSelectClass}
            >
              <option value="">All Rounds</option>
              {rounds.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          {search || region || status || round ? (
            <button
              type="button"
              onClick={clearFilters}
              className="cursor-pointer self-end rounded-md border-none bg-[#dc3545] px-4 py-2 font-semibold text-white transition-colors duration-200 hover:bg-[#c82333]"
            >
              Clear Filters
            </button>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-5 max-md:flex-col max-md:items-stretch">
          <div className="max-w-[400px] flex-1">
            <SearchBar
              value={search}
              placeholder="Search matches..."
              onSearch={(value) => {
                setSearch(value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex items-center">
            <Pagination
              variant="compact"
              currentPage={current}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 pb-16">
        {byDate.length === 0 ? (
          <p className="px-5 py-16 text-center text-[1.1rem] text-[#666]">
            No matches match those filters.
          </p>
        ) : (
          byDate.map(([date, entries]) => (
            <section
              key={date}
              className="overflow-hidden rounded-xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
            >
              <button
                type="button"
                onClick={() => setCollapsed((state) => ({ ...state, [date]: !state[date] }))}
                className="flex w-full cursor-pointer items-center justify-between bg-[#2c3e50] px-5 py-4 text-white transition-colors duration-200 hover:bg-[#34495e]"
              >
                <h2 className="m-0 text-[1.3rem] font-semibold">{date}</h2>
                <span
                  className={cn(
                    "text-base transition-transform duration-300",
                    collapsed[date] && "-rotate-90",
                  )}
                >
                  ▼
                </span>
              </button>

              <div
                className={cn(
                  "flex flex-col gap-2 overflow-hidden p-2.5 transition-all duration-300",
                  collapsed[date] && "max-h-0 p-0 opacity-0",
                )}
              >
                {entries.map((match) => {
                  const team1Wins = (match.team1Score ?? 0) > (match.team2Score ?? 0);
                  const team2Wins = (match.team2Score ?? 0) > (match.team1Score ?? 0);

                  return (
                    <article
                      key={match.id}
                      className="rounded-md border border-[#e1e5e9] bg-[#f8f9fa] p-1.5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)]"
                    >
                      <div className="mb-1.5 flex items-center justify-between border-b border-[#e1e5e9] pb-1">
                        <div className="flex flex-col gap-1">
                          <span className="text-[0.9rem] font-bold text-[#2c3e50]">
                            {match.matchNumber}
                          </span>
                          <span className="text-[0.9rem] text-[#666]">
                            {match.round} · {match.region}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "rounded-[20px] px-3 py-1 text-[0.8rem] font-semibold uppercase",
                            match.status === "completed"
                              ? "bg-[#d4edda] text-[#155724]"
                              : "bg-[#fff3cd] text-[#856404]",
                          )}
                        >
                          {match.status}
                        </span>
                      </div>

                      <div className="mb-1.5 flex flex-col gap-1">
                        {(
                          [
                            {
                              name: match.team1Name,
                              logo: match.team1LogoUrl,
                              score: match.team1Score,
                              winning: team1Wins,
                            },
                            {
                              name: match.team2Name,
                              logo: match.team2LogoUrl,
                              score: match.team2Score,
                              winning: team2Wins,
                            },
                          ] as const
                        ).map((team, index) => (
                          <div
                            key={index}
                            className={cn(
                              "flex items-center justify-between border-b border-[#e5e7eb] px-6 py-0.5 transition-all duration-200 last:border-b-0",
                              team.winning &&
                                "border-l-4 border-l-[#a1d5b4] bg-linear-to-br from-[#f0fdf4] to-[#dcfce7] shadow-[0_2px_8px_rgba(34,197,94,0.15)]",
                            )}
                          >
                            <div className="flex flex-1 items-center gap-1.5">
                              {team.logo ? (
                                <img
                                  src={team.logo}
                                  alt=""
                                  className={cn(
                                    "size-8 rounded-full border-2 border-[#e5e7eb] object-cover",
                                    team.winning &&
                                      "border-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.3)]",
                                  )}
                                />
                              ) : null}
                              <span
                                className={cn(
                                  "text-base font-semibold capitalize text-[#1f2937]",
                                  team.winning && "font-bold text-[#166534]",
                                )}
                              >
                                {team.name ?? "TBD"}
                              </span>
                            </div>
                            <span
                              className={cn(
                                "pr-6 text-[1.3rem] font-bold text-[#374151]",
                                team.winning && "text-[#166534]",
                              )}
                            >
                              {team.score ?? "–"}
                            </span>
                          </div>
                        ))}
                      </div>

                      {match.setScores.some(Boolean) ? (
                        <div className="flex flex-wrap gap-1 px-6 pb-1">
                          {match.setScores.filter(Boolean).map((set, index) => (
                            <span
                              key={index}
                              className="rounded-sm px-1 py-px text-[0.9rem] font-medium text-[#666]"
                            >
                              {set}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </>
  );
}
