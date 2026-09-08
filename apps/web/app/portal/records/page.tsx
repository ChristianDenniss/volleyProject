import { portalApi } from "@server/trpc/server";
import { pageParam, stringParam, type SearchParams } from "@/lib/search-params";
import { PortalPage } from "@components/portal/portal-page";
import { RecordsManager } from "@components/portal/records-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Records · Portal" };

export default async function PortalRecordsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const trpc = await portalApi();
  const [page, seasonList, playerList, gameList, job] = await Promise.all([
    trpc.records.listPage({
      page: pageParam(params),
      search: stringParam(params, "q"),
    }),
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
        rows={page.rows}
        paging={{ total: page.total, totalPages: page.totalPages }}
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
