import { portalApi } from "@server/trpc/server";
import { PortalPage } from "@components/portal/portal-page";
import { ApplicationsManager } from "@components/portal/applications-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Applications · Portal" };

export default async function PortalApplicationsPage() {
  const rows = await (await portalApi()).applications.list();

  return (
    <PortalPage
      title="Applications"
      description="Open or close each position and set the form URL shown on the public applications page."
    >
      <ApplicationsManager rows={rows} />
    </PortalPage>
  );
}
