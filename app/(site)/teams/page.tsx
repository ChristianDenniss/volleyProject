import type { Metadata } from "next";
import { api } from "@server/trpc/server";
import { EmptyState } from "@components/site/empty-state";
import { PageHeader } from "@components/site/page-header";
import { TeamsList } from "@components/site/teams-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Teams",
  description: "Every team that has played in the Roblox Volleyball League.",
};

export default async function TeamsPage() {
  const trpc = await api();
  const rows = await trpc.teams.list();

  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Rosters"
        title="Teams"
        description="Every roster the league has fielded, with the season it played and where it finished."
      />

      {rows.length === 0 ? (
        <div className="px-5 py-14 sm:px-8 xl:px-14">
          <EmptyState>No teams have been created yet.</EmptyState>
        </div>
      ) : (
        <TeamsList
          teams={rows.map((team) => ({
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
