import { api } from "@server/trpc/server";
import { PortalPage } from "@components/portal/portal-page";
import { RecordsManager } from "@components/portal/records-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Records · Portal" };

export default async function PortalRecordsPage() {
  const trpc = await api();
  const [rows, seasonList, playerList, gameList, job] = await Promise.all([
    trpc.records.list(),
    trpc.seasons.list(),
    trpc.players.list(),
    trpc.games.list(),
    trpc.records.latestJob(),
  ]);

  return (
    <PortalPage
      title="Records"
      description="Rebuild leaderboard rows from stats, or edit a mark by hand when the queue is wrong."
    >
      <RecordsManager
        rows={rows}
        seasons={seasonList.map((season) => ({
          id: season.id,
          label: `Season ${season.seasonNumber}`,
        }))}
        players={playerList.map((player) => ({ id: player.id, name: player.name }))}
        games={gameList.map((game) => ({
          id: game.id,
          label: `${game.name ?? `Game ${game.id}`} · ${game.date}`,
        }))}
        job={
          job
            ? {
                status: job.status,
                rowsWritten: job.rowsWritten,
                error: job.error,
              }
            : null
        }
      />
    </PortalPage>
  );
}
