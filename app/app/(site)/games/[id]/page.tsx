import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@db";
import { games } from "@server/services";
import { EmptyState, PageHeader, Section } from "@components/site/page-header";
import { HorizontalScroll } from "@components/site/scroll-area";
import { Button } from "@components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

async function load(id: string) {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return games.getById(getDb(), parsed);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const game = await load(id);
  if (!game) return { title: "Game not found" };

  const title = game.name ?? `Game ${game.id}`;
  const description = `${title} — ${game.team1Score}–${game.team2Score} on ${game.date}.`;
  return { title, description, openGraph: { title, description } };
}

export default async function GamePage({ params }: Params) {
  const { id } = await params;
  const game = await load(id);
  if (!game) notFound();

  return (
    <>
      <PageHeader
        eyebrow={game.season ? `Season ${game.season.seasonNumber}` : undefined}
        title={game.name ?? `Game ${game.id}`}
        description={`${game.date} · ${game.stage}`}
        actions={
          game.videoUrl ? (
            <Button asChild variant="outline" size="sm">
              <a href={game.videoUrl} target="_blank" rel="noopener noreferrer">
                Watch
              </a>
            </Button>
          ) : undefined
        }
      />

      <Section>
        <div className="flex flex-wrap items-center justify-center gap-6 rounded-lg border border-border bg-card px-6 py-8">
          {game.teams.map((team, index) => (
            <div key={team.id} className="flex items-center gap-4">
              {index === 1 ? (
                <span className="text-sm uppercase tracking-widest text-muted-foreground">vs</span>
              ) : null}
              <div className="text-center">
                <Link href={`/teams/${encodeURIComponent(team.name)}`} className="text-base font-medium">
                  {team.name}
                </Link>
                <p className="text-3xl font-semibold tabular-nums">
                  {index === 0 ? game.team1Score : game.team2Score}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Stat lines">
        {game.stats.length === 0 ? (
          <EmptyState>No stats have been uploaded for this game.</EmptyState>
        ) : (
          <HorizontalScroll>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Spike kills</TableHead>
                  <TableHead className="text-right">Ape kills</TableHead>
                  <TableHead className="text-right">Attempts</TableHead>
                  <TableHead className="text-right">Assists</TableHead>
                  <TableHead className="text-right">Blocks</TableHead>
                  <TableHead className="text-right">Digs</TableHead>
                  <TableHead className="text-right">Aces</TableHead>
                  <TableHead className="text-right">Errors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {game.stats.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="capitalize">
                      <Link href={`/players/${line.playerId}`}>{line.playerName}</Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{line.spikeKills}</TableCell>
                    <TableCell className="text-right tabular-nums">{line.apeKills}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {line.spikeAttempts + line.apeAttempts}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{line.assists}</TableCell>
                    <TableCell className="text-right tabular-nums">{line.blocks}</TableCell>
                    <TableCell className="text-right tabular-nums">{line.digs}</TableCell>
                    <TableCell className="text-right tabular-nums">{line.aces}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {line.spikingErrors + line.settingErrors + line.servingErrors + line.miscErrors}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </HorizontalScroll>
        )}
      </Section>
    </>
  );
}
