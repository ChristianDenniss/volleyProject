import type { Metadata } from "next";
import { api } from "@server/trpc/server";
import { AWARD_TYPES } from "@db/schema";
import { numberParam, pageParam, stringParam, type SearchParams } from "@/lib/search-params";
import { AwardsList } from "@components/site/awards-list";
import { EmptyState } from "@components/site/empty-state";
import { PageHeader } from "@components/site/page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Awards",
  description: "Season awards handed out across the Roblox Volleyball League.",
};

function awardType(value: string | undefined): (typeof AWARD_TYPES)[number] | undefined {
  return AWARD_TYPES.find((entry) => entry === value);
}

export default async function AwardsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const trpc = await api();

  const season = numberParam(params, "season");
  const type = awardType(stringParam(params, "type"));

  const [page, filters] = await Promise.all([
    trpc.awards.listPage({
      ...(season === undefined ? {} : { season }),
      ...(type === undefined ? {} : { type }),
      page: pageParam(params),
    }),
    trpc.awards.filters(),
  ]);

  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Honours"
        title="Awards"
        description="Every award the league has handed out, by season and by recipient."
      />

      {filters.types.length === 0 ? (
        <div className="px-5 py-14 sm:px-8 xl:px-14">
          <EmptyState>No awards have been given out yet.</EmptyState>
        </div>
      ) : (
        <AwardsList
          awards={page.rows.map((award) => ({
            id: award.id,
            type: award.type,
            description: award.description ?? null,
            imageUrl: award.imageUrl ?? null,
            seasonId: award.seasonId ?? null,
            seasonNumber: award.seasonNumber ?? null,
            players: award.players.map((player) => ({ id: player.id, name: player.name })),
          }))}
          seasons={filters.seasons}
          types={filters.types}
          total={page.total}
          totalPages={page.totalPages}
        />
      )}
    </div>
  );
}
