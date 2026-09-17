import { portalApi } from "@server/trpc/server";
import { PortalPage } from "@components/portal/portal-page";
import { GamesManager } from "@components/portal/games-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Games · Portal" };

export default async function PortalGamesPage() {
  const trpc = await portalApi();
  const [rows, seasonList, teamList] = await Promise.all([
    trpc.games.list(),
    trpc.seasons.listMeta(),
    trpc.teams.list(),
  ]);

  return (
    <PortalPage
      title="Games"
      description="Schedule fixtures and record completed games. Team slots can be left as TBD until bracket teams are confirmed. Streamer, referee, and commentator usernames are logged on the game."
    >
      <GamesManager
        rows={rows}
        seasons={seasonList.map((season) => ({
          id: season.id,
          label: `Season ${season.seasonNumber}`,
        }))}
        teams={teamList.map((team) => ({
          id: team.id,
          name: team.name,
          seasonId: team.seasonId,
        }))}
      />
    </PortalPage>
  );
}
