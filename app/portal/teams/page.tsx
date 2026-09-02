import { getDb } from "@db";
import { seasons, teams } from "@server/services";
import { PortalPage } from "@components/portal/portal-page";
import { TeamsManager } from "@components/portal/teams-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Teams — Portal" };

export default async function PortalTeamsPage() {
  const db = getDb();
  const [rows, seasonList] = await Promise.all([teams.list(db), seasons.list(db)]);

  return (
    <PortalPage title="Teams" description="A team name has to be unique inside its season.">
      <TeamsManager
        rows={rows}
        seasons={seasonList.map((season) => ({
          id: season.id,
          label: `Season ${season.seasonNumber}`,
        }))}
      />
    </PortalPage>
  );
}
