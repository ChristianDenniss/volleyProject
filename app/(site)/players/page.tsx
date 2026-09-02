import type { Metadata } from "next";
import { api } from "@server/trpc/server";
import { EmptyState } from "@components/site/empty-state";
import { PageHeader, PageMetric } from "@components/site/page-header";
import { PlayersList, type PlayerListRow } from "@components/site/players-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Players",
  description: "Every player in the Roblox Volleyball League with their teams and games played.",
};

export default async function PlayersPage() {
  const trpc = await api();
  const [rows, memberships] = await Promise.all([
    trpc.players.list(),
    trpc.players.memberships(),
  ]);

  const teamsByPlayer = new Map<number, { name: string; seasonNumber: number | null }[]>();
  for (const membership of memberships) {
    const list = teamsByPlayer.get(membership.playerId) ?? [];
    list.push({ name: membership.teamName, seasonNumber: membership.seasonNumber ?? null });
    teamsByPlayer.set(membership.playerId, list);
  }

  const list: PlayerListRow[] = rows.map((player) => ({
    id: player.id,
    name: player.name,
    position: player.position,
    teams: (teamsByPlayer.get(player.id) ?? []).sort(
      (a, b) => (a.seasonNumber ?? 0) - (b.seasonNumber ?? 0),
    ),
  }));

  const rostered = list.filter((player) => player.teams.length > 0).length;
  const positionCount = new Set(
    rows.flatMap((player) =>
      player.position && player.position !== "N/A" ? [player.position] : [],
    ),
  ).size;

  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Registry"
        title="Players"
        description="Everyone tracked by the league. Open a row for positions and the teams they have played for."
        meta={
          <>
            <PageMetric label="Players" value={list.length} />
            <PageMetric label="On a roster" value={rostered} />
            <PageMetric label="Positions" value={positionCount} />
          </>
        }
      />

      {list.length === 0 ? (
        <div className="px-5 py-14 sm:px-8 xl:px-14">
          <EmptyState>No players have been added yet.</EmptyState>
        </div>
      ) : (
        <PlayersList players={list} />
      )}
    </div>
  );
}
