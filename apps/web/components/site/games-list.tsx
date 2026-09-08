"use client";

import Link from "next/link";
import { UrlClearFilters, UrlFilterSelect, UrlPagination, UrlSearchBar } from "./url-controls";

export interface GameListRow {
  id: number;
  name: string;
  date: string;
  stage: string | null;
  seasonNumber: number | null;
  team1Score: number;
  team2Score: number;
}

const FILTER_KEYS = ["q", "season", "stage"];

// A game date is a plain YYYY-MM-DD string, which Date parses as UTC midnight.
// Formatting it in the viewer's zone would shift it a day west of UTC and disagree
// with the server render, so pin the calendar to UTC.
function shortDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });
}

export function GamesList({
  games,
  totalPages,
  seasons,
  stages,
}: {
  games: GameListRow[];
  totalPages: number;
  seasons: number[];
  stages: string[];
}) {
  return (
    <>
      <div className="flex flex-col gap-6 border-b border-rvl-line px-5 py-7 sm:px-8 xl:px-14">
        <div className="flex flex-wrap items-end gap-5">
          <UrlFilterSelect
            id="season-filter"
            label="Season"
            paramKey="season"
            options={[
              { value: "", label: "All seasons" },
              ...[...seasons]
                .sort((a, b) => b - a)
                .map((value) => ({ value: String(value), label: `Season ${value}` })),
            ]}
          />

          <UrlFilterSelect
            id="stage-filter"
            label="Stage"
            paramKey="stage"
            options={[
              { value: "", label: "All stages" },
              ...stages.map((value) => ({ value, label: value })),
            ]}
          />

          <UrlSearchBar className="max-w-[340px]" placeholder="Search games" />

          <UrlClearFilters keys={FILTER_KEYS} />

          <div className="ml-auto self-end">
            <UrlPagination variant="compact" totalPages={totalPages} />
          </div>
        </div>
      </div>

      <div className="px-5 py-12 sm:px-8 xl:px-14">
        <div className="border-t border-rvl-line">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-rvl-line py-5 text-inherit no-underline transition-colors hover:bg-rvl-panel"
            >
              <span className="w-[150px] shrink-0 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-rvl-dim">
                {shortDate(game.date)}
              </span>
              <span className="text-[1.02rem] font-semibold capitalize">{game.name}</span>
              <span className="font-mono text-[1.15rem] font-bold tabular-nums text-rvl-accent">
                {game.team1Score}
                <span className="px-1.5 text-rvl-dim">–</span>
                {game.team2Score}
              </span>
              <span className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-dim md:ml-auto">
                S{game.seasonNumber ?? "-"}
                {game.stage ? ` · ${game.stage}` : ""}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
