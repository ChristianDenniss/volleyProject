import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@db";
import { teams } from "@server/services";
import { EmptyState, PageHeader, Section } from "@components/site/page-header";
import { Card, CardHeader, CardTitle } from "@components/ui/card";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ teamName: string }>;
}

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { teamName } = await params;
  const team = await teams.getByName(getDb(), decode(teamName));
  if (!team) return { title: "Team not found" };

  const description = `${team.name}: ${team.players.length} players, ${team.games.length} games, ${team.placement}.`;
  return {
    title: team.name,
    description,
    openGraph: { title: team.name, description, images: team.logoUrl ? [team.logoUrl] : undefined },
  };
}

export default async function TeamPage({ params }: Params) {
  const { teamName } = await params;
  const team = await teams.getByName(getDb(), decode(teamName));
  if (!team) notFound();

  return (
    <>
      <PageHeader
        eyebrow={team.season ? `Season ${team.season.seasonNumber}` : undefined}
        title={team.name}
        description={team.placement}
      />

      <Section title="Roster">
        {team.players.length === 0 ? (
          <EmptyState>No players are on this roster.</EmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {team.players.map((player) => (
              <Card key={player.id}>
                <CardHeader>
                  <CardTitle className="text-base capitalize">
                    <Link href={`/players/${player.id}`}>{player.name}</Link>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{player.position}</p>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Games">
        {team.games.length === 0 ? (
          <EmptyState>This team has no recorded games.</EmptyState>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {team.games.map((game) => (
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
