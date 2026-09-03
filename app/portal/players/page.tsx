import { api } from "@server/trpc/server";
import { PortalPage } from "@components/portal/portal-page";
import { PlayersManager } from "@components/portal/players-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Players · Portal" };

export default async function PortalPlayersPage() {
  const trpc = await api();
  const [rows, teamRows] = await Promise.all([trpc.players.list(), trpc.teams.list()]);

  return (
    <PortalPage title="Players" description="Names are stored lowercase and must be unique.">
      <PlayersManager rows={rows} teams={teamRows.map((team) => team.name)} />
    </PortalPage>
  );
}
