import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@db";
import { matches, seasons } from "@server/services";
import { EmptyState, PageHeader, Section } from "@components/site/page-header";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Schedules",
  description: "Upcoming and completed matches across every region and phase.",
};

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const { season } = await searchParams;
  const db = getDb();
  const parsed = season ? Number.parseInt(season, 10) : Number.NaN;
  const seasonId = Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;

  const [rows, allSeasons] = await Promise.all([
    seasonId === undefined ? matches.list(db) : matches.listBySeason(db, seasonId),
    seasons.list(db),
  ]);

  const rounds = new Map<string, typeof rows>();
  for (const match of rows) {
    rounds.set(match.round, [...(rounds.get(match.round) ?? []), match]);
  }

  return (
    <>
      <PageHeader
        title="Schedules"
        description={seasonId ? `Season ${seasonId} only.` : "Every season."}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant={seasonId ? "outline" : "default"}>
              <Link href="/schedules">All</Link>
            </Button>
            {allSeasons.map((entry) => (
              <Button
                key={entry.id}
                asChild
                size="sm"
                variant={seasonId === entry.id ? "default" : "outline"}
              >
                <Link href={`/schedules?season=${entry.id}`}>S{entry.seasonNumber}</Link>
              </Button>
            ))}
          </div>
        }
      />
      <Section>
        {rows.length === 0 ? (
          <EmptyState>No matches have been scheduled.</EmptyState>
        ) : (
          <div className="space-y-8">
            {[...rounds.entries()].map(([round, entries]) => (
              <div key={round}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-brand-steel">
                  {round}
                </h2>
                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                  {entries.map((match) => (
                    <li
                      key={match.id}
                      className="flex flex-wrap items-center justify-between gap-3 bg-card px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {match.team1Name ?? "TBD"} vs {match.team2Name ?? "TBD"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {match.date} · {match.matchNumber}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="uppercase">
                          {match.region}
                        </Badge>
                        <Badge variant={match.status === "completed" ? "secondary" : "default"}>
                          {match.status}
                        </Badge>
                        <span className="text-sm font-semibold tabular-nums">
                          {match.team1Score ?? "–"} – {match.team2Score ?? "–"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
