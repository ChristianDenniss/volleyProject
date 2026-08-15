import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@db";
import { players } from "@server/services";
import { EmptyState, PageHeader, Section } from "@components/site/page-header";
import { HorizontalScroll } from "@components/site/scroll-area";
import { StatRow, StatTile } from "@components/site/stat-tile";
import { Badge } from "@components/ui/badge";
import { Card, CardHeader, CardTitle } from "@components/ui/card";
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
  return players.getById(getDb(), parsed);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const player = await load(id);
  if (!player) return { title: "Player not found" };

  const description = `${player.name} — ${player.position}, ${player.stats.length} games across ${player.teams.length} teams.`;
  return { title: player.name, description, openGraph: { title: player.name, description } };
}

export default async function PlayerPage({ params }: Params) {
  const { id } = await params;
  const player = await load(id);
  if (!player) notFound();

  const totals = player.stats.reduce(
    (accumulator, line) => ({
      kills: accumulator.kills + line.spikeKills + line.apeKills,
      attempts: accumulator.attempts + line.spikeAttempts + line.apeAttempts,
      assists: accumulator.assists + line.assists,
      blocks: accumulator.blocks + line.blocks,
      digs: accumulator.digs + line.digs,
      aces: accumulator.aces + line.aces,
    }),
    { kills: 0, attempts: 0, assists: 0, blocks: 0, digs: 0, aces: 0 },
  );

  const percentage = totals.attempts === 0 ? 0 : (100 * totals.kills) / totals.attempts;

  return (
    <>
      <PageHeader
        eyebrow={player.position}
        title={player.name}
        description={
          player.teams.length > 0
            ? `Played for ${player.teams.map((team) => team.name).join(", ")}.`
            : "No team on record."
        }
      />

      <Section>
        <StatRow>
          <StatTile label="Games" value={player.stats.length} />
          <StatTile label="Total kills" value={totals.kills} />
          <StatTile label="Kill percentage" value={`${percentage.toFixed(1)}%`} />
          <StatTile label="Assists" value={totals.assists} />
        </StatRow>
      </Section>

      {player.awards.length > 0 ? (
        <Section title="Awards">
          <div className="flex flex-wrap gap-2">
            {player.awards.map((award) => (
              <Badge key={award.id} variant="secondary" className="text-sm">
                <Link href={`/awards/${award.id}`}>{award.type}</Link>
              </Badge>
            ))}
          </div>
        </Section>
      ) : null}

      <Section title="Teams">
        {player.teams.length === 0 ? (
          <EmptyState>This player is not on any roster.</EmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {player.teams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    <Link href={`/teams/${encodeURIComponent(team.name)}`}>{team.name}</Link>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {team.seasonNumber ? `Season ${team.seasonNumber}` : "No season"} · {team.placement}
                  </p>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Game log">
        {player.stats.length === 0 ? (
          <EmptyState>No stat lines have been recorded for this player.</EmptyState>
        ) : (
          <HorizontalScroll>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Game</TableHead>
                  <TableHead className="text-right">Kills</TableHead>
                  <TableHead className="text-right">Attempts</TableHead>
                  <TableHead className="text-right">Assists</TableHead>
                  <TableHead className="text-right">Blocks</TableHead>
                  <TableHead className="text-right">Digs</TableHead>
                  <TableHead className="text-right">Aces</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {player.stats.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <Link href={`/games/${line.gameId}`}>{line.gameName ?? `Game ${line.gameId}`}</Link>
                      <span className="block text-xs text-muted-foreground">{line.gameDate}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {line.spikeKills + line.apeKills}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {line.spikeAttempts + line.apeAttempts}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{line.assists}</TableCell>
                    <TableCell className="text-right tabular-nums">{line.blocks}</TableCell>
                    <TableCell className="text-right tabular-nums">{line.digs}</TableCell>
                    <TableCell className="text-right tabular-nums">{line.aces}</TableCell>
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
