import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@db";
import { players } from "@server/services";
import { EmptyState, PageHeader, Section } from "@components/site/page-header";
import { HorizontalScroll } from "@components/site/scroll-area";
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
  title: "Players",
  description: "Every player in the Roblox Volleyball League with their teams and games played.",
};

export default async function PlayersPage() {
  const rows = await players.list(getDb());

  return (
    <>
      <PageHeader title="Players" description={`${rows.length} players on record.`} />
      <Section>
        {rows.length === 0 ? (
          <EmptyState>No players have been added yet.</EmptyState>
        ) : (
          <HorizontalScroll>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className="text-right">Teams</TableHead>
                  <TableHead className="text-right">Games</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium capitalize">
                      <Link href={`/players/${player.id}`}>{player.name}</Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{player.position}</TableCell>
                    <TableCell className="text-right tabular-nums">{player.teamCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{player.gamesPlayed}</TableCell>
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
