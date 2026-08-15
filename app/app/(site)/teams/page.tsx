import type { Metadata } from "next";
import { getDb } from "@db";
import { teams } from "@server/services";
import { EmptyState } from "@components/site/empty-state";
import { TeamsList } from "@components/site/teams-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Teams",
  description: "Every team that has played in the Roblox Volleyball League.",
};

export default async function TeamsPage() {
  const rows = await teams.list(getDb());

  return (
    <div className="mx-auto box-border min-h-screen w-full max-w-[1200px] p-5">
      <h1 className="m-0 mb-5 border-none p-0 text-[2rem] font-bold text-[#222]">Teams Info</h1>
      {rows.length === 0 ? (
        <EmptyState>No teams have been created yet.</EmptyState>
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
