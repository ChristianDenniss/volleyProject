import type { Metadata } from "next";
import { api } from "@server/trpc/server";
import { getSiteRegionQuery } from "@server/site-region";
import { numberParam, pageParam, stringParam, type SearchParams } from "@/lib/search-params";
import { EmptyState } from "@components/site/empty-state";
import { PageHeader } from "@components/site/page-header";
import { TeamsList } from "@components/site/teams-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Teams",
  description: "Every team that has played in the Roblox Volleyball League.",
};

const TEAMS_PER_PAGE = 24;

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [trpc, { query }] = await Promise.all([api(), getSiteRegionQuery(params)]);

  const [page, placements, seasons] = await Promise.all([
    trpc.teams.listPage({
      ...query,
      page: pageParam(params),
      perPage: TEAMS_PER_PAGE,
      search: stringParam(params, "q"),
      season: numberParam(params, "season"),
      placement: stringParam(params, "placement"),
    }),
    trpc.teams.placements(query),
    trpc.seasons.list(query),
  ]);

  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Rosters"
        title="Teams"
        description="Every roster the league has fielded, with the season it played and where it finished."
      />

      {page.total === 0 ? (
        <div className="px-5 py-14 sm:px-8 xl:px-14">
          <EmptyState>No teams match those filters.</EmptyState>
        </div>
      ) : (
        <TeamsList
          totalPages={page.totalPages}
          placements={placements}
          seasons={seasons.map((season) => season.seasonNumber)}
          teams={page.rows.map((team) => ({
            id: team.id,
            name: team.name,
            logoUrl: team.logoUrl ?? null,
            placement: team.placement ?? null,
            seasonNumber: team.seasonNumber ?? null,
            playerCount: team.playerCount,
          }))}
        />
      )}
    </div>
  );
}
