import { getDb } from "@db";
import { seasons } from "@server/services";
import { PortalPage } from "@components/portal/portal-page";
import { SeasonsManager } from "@components/portal/seasons-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Seasons — Portal" };

export default async function PortalSeasonsPage() {
  const rows = await seasons.list(getDb());
  return (
    <PortalPage title="Seasons" description="Deleting a season cascades to its teams, games, matches, awards and records.">
      <SeasonsManager rows={rows} />
    </PortalPage>
  );
}
