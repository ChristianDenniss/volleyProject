import { portalApi } from "@server/trpc/server";
import { pageParam, stringParam, type SearchParams } from "@/lib/search-params";
import { PortalPage } from "@components/portal/portal-page";
import { TeamsManager } from "@components/portal/teams-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Teams · Portal" };

export default async function PortalTeamsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const trpc = await portalApi();

  const [page, seasonList] = await Promise.all([
    trpc.teams.listPage({
      page: pageParam(params),
      search: stringParam(params, "q"),
    }),
    trpc.seasons.list(),
  ]);

  return (
    <PortalPage title="Teams" description="A team name has to be unique inside its season.">
      <TeamsManager
        rows={page.rows}
        paging={{ total: page.total, totalPages: page.totalPages }}
        seasons={seasonList.map((season) => ({
          id: season.id,
          label: `Season ${season.seasonNumber}`,
        }))}
      />
    </PortalPage>
  );
}
