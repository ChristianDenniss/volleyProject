import { portalApi } from "@server/trpc/server";
import { pageParam, stringParam, type SearchParams } from "@/lib/search-params";
import { PortalPage } from "@components/portal/portal-page";
import { PlayersManager } from "@components/portal/players-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Players · Portal" };

export default async function PortalPlayersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const trpc = await portalApi();

  const [page, teamRows] = await Promise.all([
    trpc.players.listPage({
      page: pageParam(params),
      search: stringParam(params, "q"),
    }),
    trpc.teams.list(),
  ]);

  return (
    <PortalPage title="Players" description="Names are stored lowercase and must be unique.">
      <PlayersManager
        rows={page.rows}
        teams={teamRows.map((team) => team.name)}
        paging={{ total: page.total, totalPages: page.totalPages }}
      />
    </PortalPage>
  );
}
