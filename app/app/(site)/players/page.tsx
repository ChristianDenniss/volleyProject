import type { Metadata } from "next";
import { getDb } from "@db";
import { players } from "@server/services";
import { EmptyState } from "@components/site/empty-state";
import { PlayersList, type PlayerListRow } from "@components/site/players-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Players",
  description: "Every player in the Roblox Volleyball League with their teams and games played.",
};

export default async function PlayersPage() {
  const db = getDb();
  const [rows, memberships] = await Promise.all([
    players.list(db),
    players.listAllMemberships(db),
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

  return (
    <div className="mx-auto box-border min-h-screen w-full max-w-[1200px] p-5">
      <h1 className="m-0 mb-5 border-none p-0 text-[2rem] font-bold text-[#222]">All Players</h1>
      {list.length === 0 ? (
        <EmptyState>No players have been added yet.</EmptyState>
      ) : (
        <PlayersList players={list} />
      )}
    </div>
  );
}
