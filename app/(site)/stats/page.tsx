import type { Metadata } from "next";
import { api } from "@server/trpc/server";
import { EmptyState } from "@components/site/empty-state";
import { PageHeader } from "@components/site/page-header";
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
  const trpc = await api();
  const parsed = season ? Number.parseInt(season, 10) : Number.NaN;
  const seasonId = Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;

  const [rows, allSeasons] = await Promise.all([
    trpc.stats.leaderboard({ seasonId }),
    trpc.seasons.list(),
  ]);

  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Leaderboard"
        title="Stat leaders"
        description="Sort any column to rank the league. Season totals come from every recorded stat line."
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
