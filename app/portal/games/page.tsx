import { api } from "@server/trpc/server";
import { PortalPage } from "@components/portal/portal-page";
import { GamesManager } from "@components/portal/games-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Games — Portal" };

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
      description="A new game is created from two team names; the game name is derived from them."
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
