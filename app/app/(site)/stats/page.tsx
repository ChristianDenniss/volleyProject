import type { Metadata } from "next";
import { getDb } from "@db";
import { seasons, stats } from "@server/services";
import { EmptyState } from "@components/site/empty-state";
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

  return (
    <div className="mx-auto box-border min-h-screen w-full max-w-[1200px] p-5">
      <h1 className="m-0 border-none p-0 text-[2rem] font-bold text-[#222]">Stat Leaders</h1>

      {rows.length === 0 ? (
        <div className="mt-5">
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
