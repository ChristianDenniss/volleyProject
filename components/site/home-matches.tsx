"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HomeMatch {
  id: number;
  date: string;
  round: string;
  status: string;
  matchNumber: string;
  team1Name: string | null;
  team2Name: string | null;
  team1LogoUrl: string | null;
  team2LogoUrl: string | null;
  team1Score: number | null;
  team2Score: number | null;
  setLine: string;
}

function dayKey(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function utcParts(value: string) {
  const parsed = new Date(`${dayKey(value)}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return { weekday: "", day: value, month: "" };
  }
  return {
    weekday: parsed.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
    day: parsed.toLocaleDateString("en-US", { day: "2-digit", timeZone: "UTC" }),
    month: parsed.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
  };
}

function eachUtcDay(start: string, end: string) {
  const days: string[] = [];
  const cursor = new Date(`${start}T00:00:00.000Z`);
  const last = new Date(`${end}T00:00:00.000Z`);
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(last.getTime())) return days;

  while (cursor <= last) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

function rangeLabel(dates: string[]) {
  if (dates.length === 0) return null;
  const first = new Date(`${dates[0]}T00:00:00.000Z`);
  const last = new Date(`${dates[dates.length - 1]}T00:00:00.000Z`);
  const opts = { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" } as const;
  if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime())) return null;
  return `${first.toLocaleDateString("en-GB", opts)} – ${last.toLocaleDateString("en-GB", opts)}`.toUpperCase();
}

export function HomeMatches({
  matches,
  seasonLabel,
  phase,
}: {
  matches: HomeMatch[];
  seasonLabel: string;
  phase: string;
}) {
  const matchDays = useMemo(() => {
    const counts = new Map<string, number>();
    for (const match of matches) {
      const key = dayKey(match.date);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [matches]);

  const dates = useMemo(() => {
    const keys = [...matchDays.keys()].sort();
    if (keys.length === 0) return [];
    return eachUtcDay(keys[0], keys[keys.length - 1]);
  }, [matchDays]);

  const defaultDate = useMemo(() => {
    const upcoming = matches.find((match) => match.status === "scheduled");
    if (upcoming) return dayKey(upcoming.date);
    return [...matchDays.keys()].sort().at(-1) ?? "";
  }, [matchDays, matches]);

  const [selected, setSelected] = useState(defaultDate);

  const visible = matches.filter((match) => dayKey(match.date) === selected);
  const selectedIndex = Math.max(dates.indexOf(selected), 0);
  const hasMatches = (date: string) => (matchDays.get(date) ?? 0) > 0;

  const shift = (delta: number) => {
    const next = dates[selectedIndex + delta];
    if (next) setSelected(next);
  };

  return (
    <section className="border-t border-rvl-line px-5 py-12 sm:px-8 sm:py-16 xl:px-14">
      <div className="mb-8 flex flex-wrap items-end gap-4">
        <h2 className="m-0 text-[2rem] font-black uppercase tracking-[-0.04em] sm:text-[2.4rem]">
          Matches
        </h2>
        <Link
          href="/schedules"
          className="border border-rvl-line px-4 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-ink-2 no-underline transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent"
        >
          Full Schedule
        </Link>
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-rvl-dim md:ml-auto">
          {seasonLabel} · {phase}
        </span>
      </div>

      {dates.length > 1 ? (
        <div className="mb-8">
          {rangeLabel(dates) ? (
            <p className="mb-4 text-center font-mono text-[0.68rem] uppercase tracking-[0.18em] text-rvl-dim">
              {rangeLabel(dates)}
            </p>
          ) : null}
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Previous day"
              disabled={selectedIndex === 0}
              onClick={() => shift(-1)}
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center border border-rvl-line bg-rvl-ground text-rvl-ink disabled:cursor-default disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
              {dates.map((date) => {
                const parts = utcParts(date);
                const active = date === selected;
                const empty = !hasMatches(date);
                return (
                  <button
                    key={date}
                    type="button"
                    aria-label={`${parts.weekday} ${parts.day} ${parts.month}${empty ? ", no matches" : ""}`}
                    onClick={() => setSelected(date)}
                    className={cn(
                      "flex h-[4.6rem] min-w-[4.5rem] flex-1 cursor-pointer flex-col items-center justify-center border text-center",
                      active
                        ? "border-rvl-accent-bg bg-rvl-accent-bg text-rvl-on-accent"
                        : empty
                          ? "border-rvl-line bg-rvl-ground text-rvl-dim hover:border-rvl-line-strong"
                          : "border-rvl-line bg-rvl-ground text-rvl-ink-2 hover:border-rvl-accent-soft",
                    )}
                  >
                    <span className="font-mono text-[0.58rem] uppercase tracking-[0.12em]">
                      {parts.weekday}
                    </span>
                    <span className="text-[1.15rem] font-bold leading-none">{parts.day}</span>
                    <span className="font-mono text-[0.58rem] uppercase tracking-[0.12em]">
                      {parts.month}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              aria-label="Next day"
              disabled={selectedIndex === dates.length - 1}
              onClick={() => shift(1)}
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center border border-rvl-line bg-rvl-ground text-rvl-ink disabled:cursor-default disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      ) : null}

      {visible.length > 0 ? (
        <div className="flex flex-col gap-4">
          {visible.map((match) => {
            const team1Wins = (match.team1Score ?? 0) > (match.team2Score ?? 0);
            const team2Wins = (match.team2Score ?? 0) > (match.team1Score ?? 0);
            const scheduled = match.status !== "completed";

            return (
              <Link
                key={match.id}
                href="/schedules"
                className="flex flex-wrap items-center gap-x-6 gap-y-3 border border-rvl-line px-4 py-4 text-inherit no-underline transition-colors hover:border-rvl-accent-soft sm:px-6"
              >
                <span className="w-[140px] shrink-0 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-rvl-dim">
                  {match.round}
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-4 text-[1.15rem]">
                  {match.team1LogoUrl ? (
                    <img src={match.team1LogoUrl} alt="" className="size-8 object-contain" />
                  ) : null}
                  <span className={team1Wins ? "font-bold" : "text-rvl-ink-2"}>
                    {match.team1Name ?? "TBD"}
                  </span>
                  {scheduled ? (
                    <span className="text-rvl-dim">vs</span>
                  ) : (
                    <span className="flex items-center gap-2 font-mono text-[1.25rem] font-bold tabular-nums text-rvl-accent">
                      <span>{match.team1Score ?? 0}</span>
                      <span className="text-rvl-dim">–</span>
                      <span>{match.team2Score ?? 0}</span>
                    </span>
                  )}
                  <span className={team2Wins ? "font-bold" : "text-rvl-ink-2"}>
                    {match.team2Name ?? "TBD"}
                  </span>
                  {match.team2LogoUrl ? (
                    <img src={match.team2LogoUrl} alt="" className="size-8 object-contain" />
                  ) : null}
                </span>
                <span
                  className={cn(
                    "font-mono text-[0.68rem] uppercase tracking-[0.14em] md:ml-auto",
                    scheduled ? "text-rvl-mint" : "text-rvl-dim",
                  )}
                >
                  {scheduled ? `Scheduled · ${match.matchNumber}` : match.setLine || match.status}
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="m-0 border border-rvl-line px-6 py-16 text-center font-mono text-[0.78rem] uppercase tracking-[0.14em] text-rvl-dim">
          No matches on this day
        </p>
      )}
    </section>
  );
}
