import type { Metadata } from "next";
import { api } from "@server/trpc/server";
import { getSiteRegionQuery } from "@server/site-region";
import { numberParam, pageParam, stringParam, type SearchParams } from "@/lib/search-params";
import { EmptyState } from "@components/site/empty-state";
import { PageHeader } from "@components/site/page-header";
import { PlayersList, type PlayerListRow } from "@components/site/players-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Players",
  description: "Every player in the Roblox Volleyball League with their teams and games played.",
};

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [trpc, { query }] = await Promise.all([api(), getSiteRegionQuery(params)]);

  const [page, positions, seasons] = await Promise.all([
    trpc.players.listPage({
      ...query,
      page: pageParam(params),
      search: stringParam(params, "q"),
      season: numberParam(params, "season"),
      position: stringParam(params, "position"),
    }),
    trpc.players.positions(query),
    trpc.seasons.list(query),
  ]);

  const list: PlayerListRow[] = page.rows.map((player) => ({
    id: player.id,
    name: player.name,
    position: player.position,
    teams: [...player.teams].sort((a, b) => (a.seasonNumber ?? 0) - (b.seasonNumber ?? 0)),
  }));

  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Registry"
        title="Players"
        description="Everyone tracked by the league. Open a row for positions and the teams they have played for."
      />

      {page.total === 0 ? (
        <div className="px-5 py-14 sm:px-8 xl:px-14">
          <EmptyState>No players match those filters.</EmptyState>
        </div>
      ) : (
        <PlayersList
          players={list}
          totalPages={page.totalPages}
          seasons={seasons.map((season) => season.seasonNumber)}
          positions={positions.filter((position) => position !== "N/A")}
        />
      )}
    </div>
  );
}
