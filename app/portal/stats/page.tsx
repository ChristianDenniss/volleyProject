import { portalApi } from "@server/trpc/server";
import { pageParam, stringParam, type SearchParams } from "@/lib/search-params";
import { PortalPage } from "@components/portal/portal-page";
import { StatsManager } from "@components/portal/stats-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Stats · Portal" };

export default async function PortalStatsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const trpc = await portalApi();

  const [page, gameList, playerList] = await Promise.all([
    trpc.stats.listPage({
      page: pageParam(params),
      search: stringParam(params, "q"),
    }),
    trpc.games.list(),
    trpc.players.list(),
  ]);

  return (
    <PortalPage
      title="Stat lines"
      description="One stat line per player per game. The CSV upload parses in the browser and posts rows."
    >
      <StatsManager
        rows={page.rows}
        paging={{ total: page.total, totalPages: page.totalPages }}
        games={gameList.map((game) => ({
          id: game.id,
          label: `${game.name ?? `Game ${game.id}`} · ${game.date}`,
        }))}
        players={playerList.map((player) => player.name)}
      />
    </PortalPage>
  );
}
