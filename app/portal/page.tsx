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
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Portal" };

function statusClass(status: string | undefined) {
  if (status === "succeeded") return "text-rvl-mint";
  if (status === "failed") return "text-destructive";
  if (status === "running" || status === "queued") return "text-rvl-accent";
  return "text-rvl-dim";
}

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
      <div className="flex flex-col gap-4">
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

      <section className="grid grid-cols-1 gap-8 border border-rvl-line p-6 md:grid-cols-[210px_1fr] md:gap-12">
        <div>
          <h2 className="m-0 mb-3 font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
            Record job
          </h2>
          <p className="m-0 text-[0.84rem] text-rvl-dim">
            Clears the record table for the chosen scope, then rewrites every family from the stat
            table. Runs on a queue.
          </p>
          <Link
            href="/records"
            className="mt-4 inline-block border-b border-rvl-line pb-0.5 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-ink-2 no-underline transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent"
          >
            Public page →
          </Link>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-rvl-line pb-5 font-mono">
            <div className="flex flex-col gap-1">
              <span className="text-[0.56rem] uppercase tracking-[0.22em] text-rvl-dim">
                Last run
              </span>
              <span className={cn("text-[0.95rem] uppercase", statusClass(job?.status))}>
                {job?.status ?? "never"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[0.56rem] uppercase tracking-[0.22em] text-rvl-dim">
                Rows written
              </span>
              <span className="text-[0.95rem] tabular-nums">{job?.rowsWritten ?? "—"}</span>
            </div>
            {job?.error ? (
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-[0.56rem] uppercase tracking-[0.22em] text-rvl-dim">
                  Error
                </span>
                <span className="truncate text-[0.85rem] text-destructive">{job.error}</span>
              </div>
            ) : null}
          </div>

          <RecalculateRecords
            seasons={seasonList.map((season) => ({
              id: season.id,
              label: `Season ${season.seasonNumber}`,
            }))}
          />
        </div>
      </section>
    </PortalPage>
  );
}
