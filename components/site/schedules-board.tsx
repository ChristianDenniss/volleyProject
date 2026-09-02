"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ClearFiltersButton, FilterSelect, Pagination, SearchBar } from "./controls";

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

function longDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function SchedulesBoard({
  matches,
  seasons,
  seasonId,
}: {
  matches: ScheduleMatch[];
  seasons: { id: number; seasonNumber: number }[];
  seasonId?: number | undefined;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [status, setStatus] = useState("");
  const [round, setRound] = useState("");
  const [page, setPage] = useState(1);

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
      <div className="flex flex-col gap-6 border-b border-rvl-line px-5 py-7 sm:px-8 xl:px-14">
        <div className="flex flex-wrap items-end gap-5">
          <FilterSelect
            id="schedule-season"
            label="Season"
            value={seasonId ? String(seasonId) : ""}
            onChange={(value) => router.push(value ? `/schedules?season=${value}` : "/schedules")}
            options={[
              { value: "", label: "All seasons" },
              ...seasons.map((season) => ({
                value: String(season.id),
                label: `Season ${season.seasonNumber}`,
              })),
            ]}
          />

          <FilterSelect
            id="schedule-region"
            label="Region"
            value={region}
            onChange={(value) => {
              setRegion(value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All regions" },
              ...regions.map((value) => ({ value, label: value })),
            ]}
          />

          <FilterSelect
            id="schedule-status"
            label="Status"
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All statuses" },
              ...statuses.map((value) => ({ value, label: value })),
            ]}
          />

          <FilterSelect
            id="schedule-round"
            label="Round"
            value={round}
            onChange={(value) => {
              setRound(value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All rounds" },
              ...rounds.map((value) => ({ value, label: value })),
            ]}
          />

          {search || region || status || round ? (
            <ClearFiltersButton onClick={clearFilters} />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <SearchBar
            className="max-w-[380px]"
            value={search}
            placeholder="Search matches, teams, match numbers"
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-dim">
            {filtered.length} matches
          </span>
          <div className="ml-auto">
            <Pagination
              variant="compact"
              currentPage={current}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      {byDate.length === 0 ? (
        <div className="px-5 py-20 text-center font-mono text-[0.78rem] uppercase tracking-[0.14em] text-rvl-dim sm:px-8 xl:px-14">
          No matches match those filters.
        </div>
      ) : (
        byDate.map(([date, entries]) => (
          <section
            key={date}
            className="grid grid-cols-1 gap-8 border-b border-rvl-line px-5 py-12 sm:px-8 md:grid-cols-[210px_1fr] md:gap-14 xl:px-14"
          >
            <div>
              <h2 className="m-0 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
                {longDate(date)}
              </h2>
              <p className="m-0 mt-2 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-dim">
                {entries.length} {entries.length === 1 ? "match" : "matches"}
              </p>
            </div>

            <div className="flex flex-col gap-7">
              {entries.map((match) => {
                const scheduled = match.status !== "completed";
                const team1Wins = (match.team1Score ?? 0) > (match.team2Score ?? 0);
                const team2Wins = (match.team2Score ?? 0) > (match.team1Score ?? 0);
                const sets = match.setScores.filter(Boolean).join(" · ");

                return (
                  <article key={match.id} className="flex flex-wrap items-center gap-x-8 gap-y-3">
                    <span className="w-[170px] shrink-0 font-mono text-[0.66rem] uppercase leading-relaxed tracking-[0.16em] text-rvl-dim">
                      {match.matchNumber}
                      <br />
                      {match.round} · {match.region}
                    </span>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[1.15rem]">
                      <span className="flex items-center gap-2.5">
                        {match.team1LogoUrl ? (
                          <img
                            src={match.team1LogoUrl}
                            alt=""
                            className="size-7 shrink-0 rounded-xs object-cover"
                          />
                        ) : null}
                        <span className={cn(team1Wins ? "font-bold" : "text-rvl-ink-2")}>
                          {match.team1Name ?? "TBD"}
                        </span>
                      </span>

                      {scheduled ? (
                        <span className="font-mono text-[0.8rem] uppercase tracking-[0.16em] text-rvl-dim">
                          vs
                        </span>
                      ) : (
                        <span className="flex items-center gap-3 font-mono text-[1.3rem] font-bold tabular-nums text-rvl-accent">
                          {match.team1Score ?? 0}
                          <span className="text-rvl-dim">–</span>
                          {match.team2Score ?? 0}
                        </span>
                      )}

                      <span className="flex items-center gap-2.5">
                        <span className={cn(team2Wins ? "font-bold" : "text-rvl-ink-2")}>
                          {match.team2Name ?? "TBD"}
                        </span>
                        {match.team2LogoUrl ? (
                          <img
                            src={match.team2LogoUrl}
                            alt=""
                            className="size-7 shrink-0 rounded-xs object-cover"
                          />
                        ) : null}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "font-mono text-[0.68rem] tracking-[0.08em] md:ml-auto",
                        scheduled
                          ? "uppercase tracking-[0.16em] text-rvl-mint"
                          : "text-rvl-dim",
                      )}
                    >
                      {scheduled ? "Scheduled" : sets}
                    </span>
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}
    </>
  );
}
