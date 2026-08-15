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
      <div className="mb-6 space-y-6">
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
      </div>

      <section className="mt-8 rounded-lg bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
        <h2 className="mb-4 text-[1.3rem] font-semibold text-[#1e3d59]">Records</h2>
        <p className="mb-4 text-base text-[#666]">
          Recalculation runs on a queue. It clears the record table for the chosen scope and
          rewrites every family from the stat table.
        </p>
        {job ? (
          <p className="mb-4 text-base text-[#333]">
            Last run: <span className="font-semibold">{job.status}</span>
            {job.rowsWritten ? ` · ${job.rowsWritten} rows` : ""}
            {job.error ? ` · ${job.error}` : ""}
          </p>
        ) : (
          <p className="mb-4 text-base text-[#666]">No recalculation has been run yet.</p>
        )}
        <RecalculateRecords
          seasons={seasonList.map((season) => ({
            id: season.id,
            label: `Season ${season.seasonNumber}`,
          }))}
        />
        <p className="mt-4 text-sm text-[#666]">
          The public page is at{" "}
          <Link href="/records" className="text-[#1e3d59] underline">
            /records
          </Link>
          .
        </p>
      </section>

    </PortalPage>
  );
}
