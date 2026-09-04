import { api } from "@server/trpc/server";
import { PortalPage } from "@components/portal/portal-page";
import { StatsManager } from "@components/portal/stats-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Stats · Portal" };

export default async function PortalStatsPage() {
  const trpc = await api();
  const [rows, gameList, playerList] = await Promise.all([
    trpc.stats.list(),
    trpc.games.list(),
    trpc.players.list(),
  ]);

  return (
    <PortalPage
      title="Stat lines"
      description="One stat line per player per game. The CSV upload parses in the browser and posts rows."
    >
      <StatsManager
        rows={rows}
        games={gameList.map((game) => ({
          id: game.id,
          label: `${game.name ?? `Game ${game.id}`} · ${game.date}`,
        }))}
        players={playerList.map((player) => player.name)}
      />
    </PortalPage>
  );
}
