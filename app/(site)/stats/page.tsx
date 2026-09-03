import type { Metadata } from "next";
import { api } from "@server/trpc/server";
import { EmptyState } from "@components/site/empty-state";
import { StatsLeaderboard } from "@components/site/stats-leaderboard";
import { isStageRound } from "@/lib/stats/stage-rounds";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stat leaders",
  description: "Career and per-season statistical leaders across the Roblox Volleyball League.",
};

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; round?: string }>;
}) {
  const { season, round } = await searchParams;
  const trpc = await api();
  const parsed = season ? Number.parseInt(season, 10) : Number.NaN;
  const seasonId = Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  const stageRound = round && isStageRound(round) ? round : undefined;

  const [rows, allSeasons] = await Promise.all([
    trpc.stats.leaderboard({ seasonId, stageRound }),
    trpc.seasons.list(),
  ]);

  return (
    <div className="font-display">
      {rows.length === 0 ? (
        <div className="px-5 py-14 sm:px-8 xl:px-14">
          <EmptyState>No stat lines have been recorded yet.</EmptyState>
        </div>
      ) : (
        <StatsLeaderboard
          rows={rows.map((row) => ({
            playerId: row.playerId,
            playerName: row.playerName,
            position: row.position ?? "N/A",
            teamName: row.teamName,
            teamLogoUrl: row.teamLogoUrl,
            gamesPlayed: row.gamesPlayed,
            totalSets: row.totalSets,
            spikeKills: row.spikeKills,
            spikeAttempts: row.spikeAttempts,
            apeKills: row.apeKills,
            apeAttempts: row.apeAttempts,
            totalKills: row.totalKills,
            totalAttempts: row.totalAttempts,
            spikingPercentage: row.spikingPercentage,
            spikingErrors: row.spikingErrors,
            assists: row.assists,
            settingErrors: row.settingErrors,
            blocks: row.blocks,
            blockFollows: row.blockFollows,
            digs: row.digs,
            aces: row.aces,
            servingErrors: row.servingErrors,
            miscErrors: row.miscErrors,
            totalErrors: row.totalErrors,
          }))}
          seasons={allSeasons.map((entry) => ({
            id: entry.id,
            seasonNumber: entry.seasonNumber,
          }))}
          seasonId={seasonId}
          stageRound={stageRound ?? "all"}
        />
      )}
    </div>
  );
}
