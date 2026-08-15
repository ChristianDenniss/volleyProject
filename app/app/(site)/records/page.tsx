import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@db";
import { records } from "@server/services";
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
  title: "Records",
  description: "Top ten league records for every metric, per game and per season.",
};

function familyLabel(metric: string, minAttempts: number | null, type: string) {
  const scope = type === "game" ? "single game" : "season total";
  return minAttempts
    ? `${metric} with ${minAttempts}+ attempts (${scope})`
    : `${metric} (${scope})`;
}

export default async function RecordsPage() {
  const rows = await records.list(getDb());

  const families = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = familyLabel(row.metric, row.minAttempts, row.type);
    families.set(key, [...(families.get(key) ?? []), row]);
  }

  return (
    <>
      <PageHeader
        title="Records"
        description="The top ten in every family, recalculated from the stat table."
      />
      <Section>
        {rows.length === 0 ? (
          <EmptyState>
            No records have been calculated yet. An administrator can trigger a recalculation from
            the portal.
          </EmptyState>
        ) : (
          <div className="space-y-8">
            {[...families.entries()].map(([label, entries]) => (
              <div key={label}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-brand-steel">
                  {label}
                </h2>
                <HorizontalScroll>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead>Season</TableHead>
                        <TableHead>Game</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries
                        .slice()
                        .sort((left, right) => left.rank - right.rank)
                        .map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="tabular-nums">{entry.rank}</TableCell>
                            <TableCell className="capitalize">
                              <Link href={`/players/${entry.playerId}`}>{entry.playerName}</Link>
                            </TableCell>
                            <TableCell>
                              {entry.seasonNumber ? (
                                <Link href={`/seasons/${entry.seasonId}`}>S{entry.seasonNumber}</Link>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell>
                              {entry.gameId ? (
                                <Link href={`/games/${entry.gameId}`}>
                                  {entry.gameName ?? `Game ${entry.gameId}`}
                                </Link>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{entry.value}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </HorizontalScroll>
              </div>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
