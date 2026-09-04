"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
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

const DAYS_PER_PAGE = 12;

// The match date is a plain YYYY-MM-DD string, which Date parses as UTC midnight.
// Formatting it in the viewer's zone would shift it a day west of UTC and disagree
// with the server render, so pin the calendar to UTC.
function longDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });
}

function MatchCard({ match }: { match: ScheduleMatch }) {
  const scheduled = match.status !== "completed";
  const team1Wins = (match.team1Score ?? 0) > (match.team2Score ?? 0);
  const team2Wins = (match.team2Score ?? 0) > (match.team1Score ?? 0);
  const sets = match.setScores.filter(Boolean);
  const teams = [
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
  ] as const;

  return (
    <article className="overflow-hidden rounded-xs border border-rvl-line bg-rvl-ground">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rvl-line px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-1">
          <span className="text-[0.95rem] font-semibold">{match.matchNumber}</span>
          <span className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-dim">
            {match.round} · {match.region}
          </span>
        </div>
        <span
          className={cn(
            "rounded-xs border px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.16em]",
            scheduled
              ? "border-rvl-line text-rvl-mint"
              : "border-rvl-line text-rvl-dim",
          )}
        >
          {match.status}
        </span>
      </div>

      <div>
        {teams.map((team, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center justify-between gap-4 border-b border-rvl-line px-4 py-2.5 last:border-b-0 sm:px-5",
              team.winning && "bg-rvl-panel",
            )}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              {team.logo ? (
                <img
                  src={team.logo}
                  alt=""
                  className="size-8 shrink-0 rounded-xs border border-rvl-line object-cover"
                />
              ) : null}
              <span
                className={cn(
                  "truncate text-[1.02rem]",
                  team.winning ? "font-bold" : "text-rvl-ink-2",
                )}
              >
                {team.name ?? "TBD"}
              </span>
            </div>
            <span
              className={cn(
                "font-mono text-[1.25rem] font-bold tabular-nums",
                team.winning ? "text-rvl-accent" : "text-rvl-dim",
              )}
            >
              {scheduled ? "–" : (team.score ?? 0)}
            </span>
          </div>
        ))}
      </div>

      {sets.length > 0 ? (
        <div className="border-t border-rvl-line px-4 py-2.5 font-mono text-[0.68rem] tracking-[0.08em] text-rvl-dim sm:px-5">
          {sets.join(" · ")}
        </div>
      ) : null}
    </article>
  );
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
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());

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

  const byDate = useMemo(() => {
    const map = new Map<string, ScheduleMatch[]>();
    filtered.forEach((match) => {
      map.set(match.date, [...(map.get(match.date) ?? []), match]);
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const totalPages = Math.max(Math.ceil(byDate.length / DAYS_PER_PAGE), 1);
  const current = Math.min(page, totalPages);
  const visibleDays = byDate.slice((current - 1) * DAYS_PER_PAGE, current * DAYS_PER_PAGE);

  const toggleDay = (date: string) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

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

      {visibleDays.length === 0 ? (
        <div className="px-5 py-20 text-center font-mono text-[0.78rem] uppercase tracking-[0.14em] text-rvl-dim sm:px-8 xl:px-14">
          No matches match those filters.
        </div>
      ) : (
        <div className="flex flex-col gap-6 px-5 py-12 sm:px-8 xl:px-14">
          {visibleDays.map(([date, entries]) => {
            const collapsed = collapsedDays.has(date);

            return (
              <section
                key={date}
                className="overflow-hidden rounded-xs border border-rvl-line"
              >
                <button
                  type="button"
                  aria-expanded={!collapsed}
                  onClick={() => toggleDay(date)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 border-none bg-transparent px-5 py-4 text-left text-rvl-ink transition-colors hover:bg-rvl-panel"
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-[1.15rem] font-semibold">{longDate(date)}</span>
                    <span className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-rvl-dim">
                      {entries.length} {entries.length === 1 ? "match" : "matches"}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-rvl-dim transition-transform duration-300",
                      collapsed && "-rotate-90",
                    )}
                  />
                </button>

                {collapsed ? null : (
                  <div className="flex flex-col gap-2 bg-rvl-panel p-2.5">
                    {entries.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
