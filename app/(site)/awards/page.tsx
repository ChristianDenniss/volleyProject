import type { Metadata } from "next";
import { api } from "@server/trpc/server";
import { AwardsList } from "@components/site/awards-list";
import { EmptyState } from "@components/site/empty-state";
import { PageHeader, PageMetric } from "@components/site/page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Awards",
  description: "Season awards handed out across the Roblox Volleyball League.",
};

export default async function AwardsPage() {
  const trpc = await api();
  const rows = await trpc.awards.list();

  const seasonCount = new Set(
    rows.flatMap((award) => (award.seasonNumber == null ? [] : [award.seasonNumber])),
  ).size;
  const recipients = new Set(rows.flatMap((award) => award.players.map((player) => player.id))).size;

  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Honours"
        title="Awards"
        description="Every award the league has handed out, by season and by recipient."
        meta={
          <>
            <PageMetric label="Awards" value={rows.length} />
            <PageMetric label="Seasons" value={seasonCount} />
            <PageMetric label="Recipients" value={recipients} />
          </>
        }
      />

      {rows.length === 0 ? (
        <div className="px-5 py-14 sm:px-8 xl:px-14">
          <EmptyState>No awards have been given out yet.</EmptyState>
        </div>
      ) : (
        <AwardsList
          awards={rows.map((award) => ({
            id: award.id,
            type: award.type,
            description: award.description ?? null,
            imageUrl: award.imageUrl ?? null,
            seasonId: award.seasonId ?? null,
            seasonNumber: award.seasonNumber ?? null,
            players: award.players.map((player) => ({ id: player.id, name: player.name })),
          }))}
        />
      )}
    </div>
  );
}
