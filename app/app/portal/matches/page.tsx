import { getDb } from "@db";
import { matches, seasons } from "@server/services";
import { PortalPage } from "@components/portal/portal-page";
import { MatchesManager } from "@components/portal/matches-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Matches — Portal" };

export default async function PortalMatchesPage() {
  const db = getDb();
  const [rows, seasonList] = await Promise.all([matches.list(db), seasons.list(db)]);

  return (
    <PortalPage
      title="Matches"
      description="Bracket matches shown on /schedules. Logos are filled from the team of the same name."
    >
      <MatchesManager
        rows={rows}
        seasons={seasonList.map((season) => ({
          id: season.id,
          label: `Season ${season.seasonNumber}`,
        }))}
      />
    </PortalPage>
  );
}
