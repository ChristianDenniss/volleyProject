"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
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

function utcToday() {
  return new Date().toISOString().slice(0, 10);
}

function shiftUtcDay(day: string, delta: number) {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

const RANGE_DAYS = 15;

function datesAroundToday(today: string) {
  return eachUtcDay(shiftUtcDay(today, -RANGE_DAYS), shiftUtcDay(today, RANGE_DAYS));
}

function nearestDate(dates: string[], target: string) {
  const first = dates[0];
  const last = dates[dates.length - 1];
  if (first === undefined || last === undefined) return "";
  if (dates.includes(target)) return target;
  return target < first ? first : last;
}

function centerDateInStrip(scroller: HTMLElement, date: string, behavior: ScrollBehavior) {
  const item = scroller.querySelector<HTMLElement>(`[data-date="${date}"]`);
  if (!item) return;

  if (typeof scroller.scrollTo !== "function") return;

  const strip = scroller.getBoundingClientRect();
  const chip = item.getBoundingClientRect();
  const left = scroller.scrollLeft + (chip.left - strip.left) - (strip.width - chip.width) / 2;
  scroller.scrollTo({ left, behavior });
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

  const dates = useMemo(() => datesAroundToday(utcToday()), []);

  const defaultDate = useMemo(() => nearestDate(dates, utcToday()), [dates]);
  const [selected, setSelected] = useState(defaultDate);
  const stripRef = useRef<HTMLDivElement>(null);
  const hasCentered = useRef(false);

  useLayoutEffect(() => {
    const strip = stripRef.current;
    if (!strip || !selected) return;
    centerDateInStrip(strip, selected, hasCentered.current ? "smooth" : "auto");
    hasCentered.current = true;
  }, [selected]);

  const visible = matches.filter((match) => dayKey(match.date) === selected);
  const selectedIndex = Math.max(dates.indexOf(selected), 0);
  const hasMatches = (date: string) => (matchDays.get(date) ?? 0) > 0;
  const slots = Math.max(2, visible.length);

  const shift = (delta: number) => {
    const next = dates[selectedIndex + delta];
    if (next) setSelected(next);
  };

  return (
    <section className="px-5 py-12 sm:px-8 sm:py-16 xl:px-14">
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
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center border border-rvl-line bg-rvl-ground text-rvl-ink disabled:cursor-default disabled:opacity-40"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div
              ref={stripRef}
              aria-label="Match dates"
              className="no-scrollbar flex min-w-0 flex-1 snap-x snap-mandatory gap-2.5 overflow-x-auto px-[calc(50%-3.25rem)]"
            >
              {dates.map((date) => {
                const parts = utcParts(date);
                const active = date === selected;
                const empty = !hasMatches(date);
                return (
                  <button
                    key={date}
                    type="button"
                    data-date={date}
                    aria-pressed={active}
                    aria-label={`${parts.weekday} ${parts.day} ${parts.month}${empty ? ", no matches" : ""}`}
                    onClick={() => setSelected(date)}
                    className={cn(
                      "flex h-[5.75rem] w-[6.5rem] shrink-0 cursor-pointer snap-center flex-col items-center justify-center gap-1 border text-center",
                      active
                        ? "border-rvl-accent-bg bg-rvl-accent-bg text-rvl-on-accent"
                        : empty
                          ? "border-rvl-line bg-rvl-ground text-rvl-dim hover:border-rvl-line-strong"
                          : "border-rvl-line bg-rvl-ground text-rvl-ink-2 hover:border-rvl-accent-soft",
                    )}
                  >
                    <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em]">
                      {parts.weekday}
                    </span>
                    <span className="text-[1.4rem] font-bold leading-none">{parts.day}</span>
                    <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em]">
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
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center border border-rvl-line bg-rvl-ground text-rvl-ink disabled:cursor-default disabled:opacity-40"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      ) : null}

      <div
        aria-label="Matches for selected day"
        className="flex min-h-[calc(var(--match-slots)*4.5rem+(var(--match-slots)-1)*1rem)] flex-col gap-4"
        style={{ "--match-slots": slots } as React.CSSProperties}
      >
        {visible.length > 0 ? (
          visible.map((match) => {
            const team1Wins = (match.team1Score ?? 0) > (match.team2Score ?? 0);
            const team2Wins = (match.team2Score ?? 0) > (match.team1Score ?? 0);
            const scheduled = match.status !== "completed";

            return (
              <Link
                key={match.id}
                href="/schedules"
                className="grid min-h-[4.5rem] grid-cols-1 items-center gap-x-6 gap-y-2 border border-rvl-line px-4 py-3 text-inherit no-underline transition-colors hover:border-rvl-accent-soft sm:grid-cols-[8.75rem_minmax(0,1fr)_auto] sm:px-6"
              >
                <span className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-rvl-dim">
                  {match.round}
                </span>
                <span className="flex min-w-0 items-center gap-4 text-[1.15rem]">
                  {match.team1LogoUrl ? (
                    <img src={match.team1LogoUrl} alt="" className="size-8 shrink-0 object-contain" />
                  ) : null}
                  <span className={cn("min-w-0 truncate", team1Wins ? "font-bold" : "text-rvl-ink-2")}>
                    {match.team1Name ?? "TBD"}
                  </span>
                  {scheduled ? (
                    <span className="shrink-0 text-rvl-dim">vs</span>
                  ) : (
                    <span className="flex shrink-0 items-center gap-2 font-mono text-[1.25rem] font-bold tabular-nums text-rvl-accent">
                      <span>{match.team1Score ?? 0}</span>
                      <span className="text-rvl-dim">–</span>
                      <span>{match.team2Score ?? 0}</span>
                    </span>
                  )}
                  <span className={cn("min-w-0 truncate", team2Wins ? "font-bold" : "text-rvl-ink-2")}>
                    {match.team2Name ?? "TBD"}
                  </span>
                  {match.team2LogoUrl ? (
                    <img src={match.team2LogoUrl} alt="" className="size-8 shrink-0 object-contain" />
                  ) : null}
                </span>
                <span
                  className={cn(
                    "font-mono text-[0.68rem] uppercase tracking-[0.14em]",
                    scheduled ? "text-rvl-mint" : "text-rvl-dim",
                  )}
                >
                  {scheduled ? `Scheduled · ${match.matchNumber}` : match.setLine || match.status}
                </span>
              </Link>
            );
          })
        ) : (
          <p className="m-0 flex flex-1 flex-col items-center justify-center gap-2 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-rvl-dim">
            <span>No matches on this day</span>
            <span aria-hidden="true">:(</span>
          </p>
        )}
      </div>
    </section>
  );
}
