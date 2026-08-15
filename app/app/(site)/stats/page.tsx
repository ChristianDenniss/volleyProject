import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@db";
import { seasons, stats } from "@server/services";
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

export const metadata: Metadata = {
  title: "Stat leaders",
  description: "Career and per-season statistical leaders across the Roblox Volleyball League.",
};

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const { season } = await searchParams;
  const db = getDb();
  const parsed = season ? Number.parseInt(season, 10) : Number.NaN;
  const seasonId = Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;

  const [rows, allSeasons] = await Promise.all([stats.leaderboard(db, seasonId), seasons.list(db)]);

  return (
    <>
      <PageHeader
        title="Stat leaders"
        description={seasonId ? `Season ${seasonId} only.` : "Every season combined."}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant={seasonId ? "outline" : "default"}>
              <Link href="/stats">All time</Link>
            </Button>
            {allSeasons.map((entry) => (
              <Button
                key={entry.id}
                asChild
                size="sm"
                variant={seasonId === entry.id ? "default" : "outline"}
              >
                <Link href={`/stats?season=${entry.id}`}>S{entry.seasonNumber}</Link>
              </Button>
            ))}
          </div>
        }
      />
      <Section>
        {rows.length === 0 ? (
          <EmptyState>No stat lines have been recorded yet.</EmptyState>
        ) : (
          <HorizontalScroll>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Games</TableHead>
                  <TableHead className="text-right">Kills</TableHead>
                  <TableHead className="text-right">Kill %</TableHead>
                  <TableHead className="text-right">Assists</TableHead>
                  <TableHead className="text-right">Blocks</TableHead>
                  <TableHead className="text-right">Digs</TableHead>
                  <TableHead className="text-right">Aces</TableHead>
                  <TableHead className="text-right">Errors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.playerId}>
                    <TableCell className="font-medium capitalize">
                      <Link href={`/players/${row.playerId}`}>{row.playerName}</Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.gamesPlayed}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.totalKills}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.spikingPercentage}%</TableCell>
                    <TableCell className="text-right tabular-nums">{row.assists}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.blocks}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.digs}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.aces}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.totalErrors}</TableCell>
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
