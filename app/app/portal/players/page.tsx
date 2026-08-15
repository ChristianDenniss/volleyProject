import { getDb } from "@db";
import { players, teams } from "@server/services";
import { PortalPage } from "@components/portal/portal-page";
import { PlayersManager } from "@components/portal/players-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Players — Portal" };

export default async function PortalPlayersPage() {
  const db = getDb();
  const [rows, teamRows] = await Promise.all([players.list(db), teams.list(db)]);

  return (
    <PortalPage title="Players" description="Names are stored lowercase and must be unique.">
      <PlayersManager rows={rows} teams={teamRows.map((team) => team.name)} />
    </PortalPage>
  );
}
