import type { Metadata } from "next";
import { api } from "@server/trpc/server";
import { EmptyState } from "@components/site/empty-state";
import { GamesList } from "@components/site/games-list";
import { PageHeader, PageMetric } from "@components/site/page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Games",
  description: "Every recorded game in the Roblox Volleyball League, newest first.",
};

export default async function GamesPage() {
  const trpc = await api();
  const rows = await trpc.games.list();

  const seasonCount = new Set(
    rows.flatMap((game) => (game.seasonNumber == null ? [] : [game.seasonNumber])),
  ).size;
  const withVideo = rows.filter((game) => Boolean(game.videoUrl)).length;

  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Match log"
        title="Games"
        description="Every game the league has recorded, with the set result and the stage it was played at."
        meta={
          <>
            <PageMetric label="Games" value={rows.length} />
            <PageMetric label="Seasons" value={seasonCount} />
            <PageMetric label="With VOD" value={withVideo} />
          </>
        }
      />

      {rows.length === 0 ? (
        <div className="px-5 py-14 sm:px-8 xl:px-14">
          <EmptyState>No games have been recorded yet.</EmptyState>
        </div>
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
