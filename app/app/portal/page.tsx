import Link from "next/link";
import { getDb } from "@db";
import { latestJob } from "@server/queue";
import {
  articles,
  awards,
  games,
  matches,
  players,
  records,
  seasons,
  stats,
  teams,
  users,
} from "@server/services";
import { PortalPage } from "@components/portal/portal-page";
import { RecalculateRecords } from "@components/portal/recalculate-records";
import { StatRow, StatTile } from "@components/site/stat-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = { title: "Portal" };

export default async function PortalDashboard() {
  const db = getDb();
  const [
    seasonCount,
    teamCount,
    playerCount,
    gameCount,
    statCount,
    awardCount,
    articleCount,
    matchCount,
    userCount,
    recordCount,
    seasonList,
    job,
  ] = await Promise.all([
    seasons.count(db),
    teams.count(db),
    players.count(db),
    games.count(db),
    stats.count(db),
    awards.count(db),
    articles.count(db),
    matches.count(db),
    users.count(db),
    records.count(db),
    seasons.list(db),
    latestJob(db),
  ]);

  return (
    <PortalPage title="Dashboard" description="What is in the database right now.">
      <StatRow>
        <StatTile label="Seasons" value={seasonCount} />
        <StatTile label="Teams" value={teamCount} />
        <StatTile label="Players" value={playerCount} />
        <StatTile label="Games" value={gameCount} />
      </StatRow>
      <StatRow>
        <StatTile label="Stat lines" value={statCount} />
        <StatTile label="Matches" value={matchCount} />
        <StatTile label="Awards" value={awardCount} />
        <StatTile label="Articles" value={articleCount} />
      </StatRow>
      <StatRow>
        <StatTile label="Users" value={userCount} />
        <StatTile label="Records" value={recordCount} />
      </StatRow>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Records</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Recalculation runs on a queue. It clears the record table for the chosen scope and
            rewrites every family from the stat table.
          </p>
          {job ? (
            <p className="text-sm">
              Last run: <span className="font-medium">{job.status}</span>
              {job.rowsWritten ? ` · ${job.rowsWritten} rows` : ""}
              {job.error ? ` · ${job.error}` : ""}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No recalculation has been run yet.</p>
          )}
          <RecalculateRecords
            seasons={seasonList.map((season) => ({
              id: season.id,
              label: `Season ${season.seasonNumber}`,
            }))}
          />
          <p className="text-xs text-muted-foreground">
            The public page is at <Link href="/records">/records</Link>.
          </p>
        </CardContent>
      </Card>
    </PortalPage>
  );
}
