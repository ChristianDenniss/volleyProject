import { portalApi } from "@server/trpc/server";
import { PortalPage } from "@components/portal/portal-page";
import { AwardsManager } from "@components/portal/awards-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Awards · Portal" };

export default async function PortalAwardsPage() {
  const trpc = await portalApi();
  const [rows, seasonList] = await Promise.all([trpc.awards.list(), trpc.seasons.list()]);

  return (
    <PortalPage
      title="Awards"
      description="Recipients are matched by player name; an unknown name is rejected rather than created."
    >
      <AwardsManager
        rows={rows}
        seasons={seasonList.map((season) => ({
          id: season.id,
          label: `Season ${season.seasonNumber}`,
        }))}
      />
    </PortalPage>
  );
}
