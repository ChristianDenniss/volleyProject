import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@db";
import { seasons } from "@server/services";
import { EmptyState, PageHeader, Section } from "@components/site/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { StatRow, StatTile } from "@components/site/stat-tile";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

async function load(id: string) {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return seasons.getById(getDb(), parsed);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const season = await load(id);
  if (!season) return { title: "Season not found" };

  const title = `Season ${season.seasonNumber}`;
  const description = season.theme
    ? `${title}: ${season.theme}. ${season.teams.length} teams and ${season.games.length} games.`
    : `${title}: ${season.teams.length} teams and ${season.games.length} games.`;

  return {
    title,
    description,
    openGraph: { title, description, images: season.image ? [season.image] : undefined },
  };
}

export default async function SeasonPage({ params }: Params) {
  const { id } = await params;
  const season = await load(id);
  if (!season) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Season"
        title={`Season ${season.seasonNumber}`}
        description={season.theme}
      />

      <Section>
        <StatRow>
          <StatTile label="Teams" value={season.teams.length} />
          <StatTile label="Games" value={season.games.length} />
          <StatTile label="Matches" value={season.matches.length} />
          <StatTile label="Awards" value={season.awards.length} />
        </StatRow>
      </Section>

      <Section title="Teams">
        {season.teams.length === 0 ? (
          <EmptyState>No teams are registered for this season.</EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {season.teams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    <Link href={`/teams/${encodeURIComponent(team.name)}`}>{team.name}</Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{team.placement}</CardContent>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Games">
        {season.games.length === 0 ? (
          <EmptyState>No games have been recorded for this season.</EmptyState>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {season.games.map((game) => (
              <li key={game.id} className="flex items-center justify-between gap-4 bg-card px-4 py-3">
                <div>
                  <Link href={`/games/${game.id}`} className="text-sm font-medium">
                    {game.name ?? `Game ${game.id}`}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {game.date} · {game.stage}
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
