import type { Metadata } from "next";
import { api } from "@server/trpc/server";
import { getSiteRegionQuery } from "@server/site-region";
import { RECORD_TYPES } from "@db/schema";
import { pageParam, stringParam, type SearchParams } from "@/lib/search-params";
import { EmptyState } from "@components/site/empty-state";
import { PageHeader } from "@components/site/page-header";
import { RecordsBoard } from "@components/site/records-board";

export const dynamic = "force-dynamic";

const GROUPS_PER_PAGE = 9;

export const metadata: Metadata = {
  title: "Records",
  description: "Top ten league records for every metric, per game and per season.",
};

function recordType(value: string | undefined): (typeof RECORD_TYPES)[number] | undefined {
  return RECORD_TYPES.find((entry) => entry === value);
}

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [trpc, { query }] = await Promise.all([api(), getSiteRegionQuery(params)]);

  const types = await trpc.records.types(query);
  const selected = recordType(stringParam(params, "type")) ?? recordType(types[0]);

  const page = selected
    ? await trpc.records.groupsPage({
        ...query,
        type: selected,
        page: pageParam(params),
        perPage: GROUPS_PER_PAGE,
      })
    : null;

  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Record book"
        title="Records"
        description="The top ten marks for every metric, split between single-game and full-season performances."
      />

      {page === null || page.total === 0 ? (
        <div className="px-5 py-14 sm:px-8 xl:px-14">
          <EmptyState>
            No records have been calculated yet. An administrator can trigger a recalculation from
            the portal.
          </EmptyState>
        </div>
      ) : (
        <RecordsBoard
          groups={page.rows.map((group) => ({
            metric: group.metric,
            minAttempts: group.minAttempts ?? null,
            rows: group.rows.map((row) => ({
              id: row.id,
              type: row.type,
              metric: row.metric,
              minAttempts: row.minAttempts ?? null,
              rank: row.rank,
              value: row.value,
              playerId: row.playerId,
              playerName: row.playerName,
              seasonId: row.seasonId ?? null,
              seasonNumber: row.seasonNumber ?? null,
              gameId: row.gameId ?? null,
              gameName: row.gameName ?? null,
            })),
          }))}
          types={types}
          type={selected ?? ""}
          totalPages={page.totalPages}
        />
      )}
    </div>
  );
}
