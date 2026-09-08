import { portalApi } from "@server/trpc/server";
import { PortalPage } from "@components/portal/portal-page";
import { SeasonsManager } from "@components/portal/seasons-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Seasons · Portal" };

export default async function PortalSeasonsPage() {
  const rows = await (await portalApi()).seasons.list();
  return (
    <PortalPage title="Seasons" description="Deleting a season cascades to its teams, games, awards and records.">
      <SeasonsManager rows={rows} />
    </PortalPage>
  );
}
