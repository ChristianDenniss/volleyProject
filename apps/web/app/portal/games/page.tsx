import { portalApi } from "@server/trpc/server";
import { pageParam, stringParam, type SearchParams } from "@/lib/search-params";
import { PortalPage } from "@components/portal/portal-page";
import { GamesManager } from "@components/portal/games-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Games · Portal" };

export default async function PortalGamesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const trpc = await portalApi();

  const [page, seasonList, teamList] = await Promise.all([
    trpc.games.listPage({
      page: pageParam(params),
      search: stringParam(params, "q"),
    }),
    trpc.seasons.list(),
    trpc.teams.list(),
  ]);

  return (
    <PortalPage
      title="Games"
      description="Schedule fixtures and record completed games. Team slots can be left as TBD until bracket teams are confirmed. Streamer, referee, and commentator usernames are logged on the game."
    >
      <GamesManager
        rows={page.rows}
        paging={{ total: page.total, totalPages: page.totalPages }}
        seasons={seasonList.map((season) => ({
          id: season.id,
          label: `Season ${season.seasonNumber}`,
        }))}
        teams={teamList.map((team) => ({
          id: team.id,
          name: team.name,
          seasonId: team.seasonId,
        }))}
      />
    </PortalPage>
  );
}
