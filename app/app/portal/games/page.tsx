import { getDb } from "@db";
import { games, seasons, teams } from "@server/services";
import { PortalPage } from "@components/portal/portal-page";
import { GamesManager } from "@components/portal/games-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Games — Portal" };

export default async function PortalGamesPage() {
  const db = getDb();
  const [rows, seasonList, teamList] = await Promise.all([
    games.list(db),
    seasons.list(db),
    teams.list(db),
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
