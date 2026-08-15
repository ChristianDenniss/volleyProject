import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@db";
import { games } from "@server/services";
import { EmptyState, PageHeader, Section } from "@components/site/page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Games",
  description: "Every recorded game in the Roblox Volleyball League, newest first.",
};

export default async function GamesPage() {
  const rows = await games.list(getDb());

  return (
    <>
      <PageHeader title="Games" description={`${rows.length} games on record.`} />
      <Section>
        {rows.length === 0 ? (
          <EmptyState>No games have been recorded yet.</EmptyState>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {rows.map((game) => (
              <li
                key={game.id}
                className="flex flex-wrap items-center justify-between gap-3 bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <Link href={`/games/${game.id}`} className="text-sm font-medium">
                    {game.name ?? game.teams.map((team) => team.name).join(" Vs. ")}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {game.date}
                    {game.seasonNumber ? ` · Season ${game.seasonNumber}` : ""} · {game.stage}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {game.team1Score} – {game.team2Score}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
