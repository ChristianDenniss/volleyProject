import type { Metadata } from "next";
import { api } from "@server/trpc/server";
import { getSiteRegionQuery } from "@server/site-region";
import { numberParam, pageParam, stringParam, type SearchParams } from "@/lib/search-params";
import { EmptyState } from "@components/site/empty-state";
import { GamesList } from "@components/site/games-list";
import { PageHeader } from "@components/site/page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Games",
  description: "Every recorded game in the Roblox Volleyball League, newest first.",
};

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [trpc, { query }] = await Promise.all([api(), getSiteRegionQuery(params)]);

  const [page, stages, seasons] = await Promise.all([
    trpc.games.listPlayedPage({
      ...query,
      page: pageParam(params),
      search: stringParam(params, "q"),
      season: numberParam(params, "season"),
      stage: stringParam(params, "stage"),
    }),
    trpc.games.stages(query),
    trpc.seasons.list(query),
  ]);

  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Match log"
        title="Games"
        description="Every game the league has recorded, with the set result and the stage it was played at."
      />

      {page.total === 0 ? (
        <div className="px-5 py-14 sm:px-8 xl:px-14">
          <EmptyState>No games match those filters.</EmptyState>
        </div>
      ) : (
        <GamesList
          totalPages={page.totalPages}
          stages={stages}
          seasons={seasons.map((season) => season.seasonNumber)}
          games={page.rows.map((game) => ({
            id: game.id,
            name: game.name ?? game.teams.map((team) => team.name).join(" Vs. "),
            date: game.date,
            stage: game.stage ?? null,
            seasonNumber: game.seasonNumber ?? null,
            team1Score: game.team1Score ?? 0,
            team2Score: game.team2Score ?? 0,
          }))}
        />
      )}
    </div>
  );
}
