import { api } from "@server/trpc/server";
import { PortalPage } from "@components/portal/portal-page";
import { GamesManager } from "@components/portal/games-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Games · Portal" };

export default async function PortalGamesPage() {
  const trpc = await api();
  const [rows, seasonList, teamList] = await Promise.all([
    trpc.games.list(),
    trpc.seasons.list(),
    trpc.teams.list(),
  ]);

  return (
    <PortalPage
      title="Games"
      description="A new game is created from two team names. Streamer, referee, and commentator usernames are logged on the game and show up on that user's profile."
    >
      <GamesManager
        rows={rows}
        seasons={seasonList.map((season) => ({
          id: season.id,
          label: `Season ${season.seasonNumber}`,
        }))}
        teams={teamList.map((team) => team.name)}
      />
    </PortalPage>
  );
}
