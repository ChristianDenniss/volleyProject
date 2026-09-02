import type { Metadata } from "next";
import { getDb } from "@db";
import { records } from "@server/services";
import { EmptyState } from "@components/site/empty-state";
import { PageHeader, PageMetric } from "@components/site/page-header";
import { RecordsBoard } from "@components/site/records-board";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Records",
  description: "Top ten league records for every metric, per game and per season.",
};

export default async function RecordsPage() {
  const rows = await records.list(getDb());

  const metricCount = new Set(rows.map((row) => row.metric)).size;
  const holders = new Set(rows.map((row) => row.playerId)).size;

  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Record book"
        title="Records"
        description="The top ten marks for every metric, split between single-game and full-season performances."
        meta={
          <>
            <PageMetric label="Entries" value={rows.length} />
            <PageMetric label="Metrics" value={metricCount} />
            <PageMetric label="Holders" value={holders} />
          </>
        }
      />

      {rows.length === 0 ? (
        <div className="px-5 py-14 sm:px-8 xl:px-14">
          <EmptyState>
            No records have been calculated yet. An administrator can trigger a recalculation from
            the portal.
          </EmptyState>
        </div>
      ) : (
        <RecordsBoard
          records={rows.map((row) => ({
            id: row.id,
            type: row.type,
            metric: row.metric,
            minAttempts: row.minAttempts ?? null,
            rank: row.rank,
            value: row.value,
            playerId: row.playerId,
            playerName: row.playerName,
            seasonId: row.seasonId ?? null,
            seasonNumber: row.seasonNumber ?? null,
            gameId: row.gameId ?? null,
            gameName: row.gameName ?? null,
          }))}
        />
      )}
    </div>
  );
}
