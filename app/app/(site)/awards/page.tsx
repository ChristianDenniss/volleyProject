import type { Metadata } from "next";
import { getDb } from "@db";
import { awards } from "@server/services";
import { EmptyState } from "@components/site/empty-state";
import { AwardsList } from "@components/site/awards-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Awards",
  description: "Season awards handed out across the Roblox Volleyball League.",
};

export default async function AwardsPage() {
  const rows = await awards.list(getDb());

  return (
    <div className="box-border flex min-h-screen w-full flex-col gap-8 px-[4vw] py-8">
      <h1 className="m-0 text-center text-[clamp(1.8rem,4vw,2.4rem)] font-semibold">
        League Awards
      </h1>

      {rows.length === 0 ? (
        <EmptyState>No awards have been given out yet.</EmptyState>
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
