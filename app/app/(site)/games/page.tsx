import type { Metadata } from "next";
import { getDb } from "@db";
import { games } from "@server/services";
import { EmptyState } from "@components/site/empty-state";
import { GamesList } from "@components/site/games-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Games",
  description: "Every recorded game in the Roblox Volleyball League, newest first.",
};

export default async function GamesPage() {
  const rows = await games.list(getDb());

  return (
    <div className="mx-auto box-border min-h-screen w-full max-w-[1200px] p-5">
      <h1 className="m-0 mb-5 border-none p-0 text-[2rem] font-bold text-[#222]">All Games</h1>
      {rows.length === 0 ? (
        <EmptyState>No games have been recorded yet.</EmptyState>
      ) : (
        <GamesList
          games={rows.map((game) => ({
            id: game.id,
            name: game.name ?? game.teams.map((team) => team.name).join(" Vs. "),
            date: game.date,
            stage: game.stage ?? null,
            seasonNumber: game.seasonNumber ?? null,
            team1Score: game.team1Score,
            team2Score: game.team2Score,
          }))}
        />
      )}
    </div>
  );
}
