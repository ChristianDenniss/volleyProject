import type { Metadata } from "next";
import { getDb } from "@db";
import { seasons, stats } from "@server/services";
import { EmptyState } from "@components/site/empty-state";
import { PageHeader, PageMetric } from "@components/site/page-header";
import { StatsLeaderboard } from "@components/site/stats-leaderboard";

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

  const totalKills = rows.reduce((sum, row) => sum + Number(row.totalKills ?? 0), 0);
  const totalGames = new Set(rows.flatMap((row) => (row.gamesPlayed ? [row.playerId] : []))).size;

  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Leaderboard"
        title="Stat leaders"
        description="Sort any column to rank the league. Season totals come from every recorded stat line."
        meta={
          <>
            <PageMetric label="Players" value={rows.length} />
            <PageMetric label="With games" value={totalGames} />
            <PageMetric label="Kills logged" value={totalKills.toLocaleString()} />
            <PageMetric
              label="Season"
              value={
                seasonId
                  ? (allSeasons.find((entry) => entry.id === seasonId)?.seasonNumber ?? "—")
                  : "All"
              }
            />
          </>
        }
      />

      {rows.length === 0 ? (
        <div className="px-5 py-14 sm:px-8 xl:px-14">
          <EmptyState>No stat lines have been recorded yet.</EmptyState>
        </div>
      ) : (
        <StatsLeaderboard
          rows={rows.map((row) => ({
            playerId: row.playerId,
            playerName: row.playerName,
            gamesPlayed: row.gamesPlayed,
            totalKills: row.totalKills,
            spikingPercentage: row.spikingPercentage,
            assists: row.assists,
            blocks: row.blocks,
            digs: row.digs,
            aces: row.aces,
            totalErrors: row.totalErrors,
          }))}
          seasons={allSeasons.map((entry) => ({
            id: entry.id,
            seasonNumber: entry.seasonNumber,
          }))}
          seasonId={seasonId}
        />
      )}
    </div>
  );
}
