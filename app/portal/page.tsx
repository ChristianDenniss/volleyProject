import Link from "next/link";
import { api } from "@server/trpc/server";
import { PortalPage } from "@components/portal/portal-page";
import { RecalculateRecords } from "@components/portal/recalculate-records";
import { StatTile } from "@components/site/stat-tile";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Portal" };

const RESOURCES = [
  { key: "seasons", label: "Seasons", href: "/portal/seasons" },
  { key: "teams", label: "Teams", href: "/portal/teams" },
  { key: "players", label: "Players", href: "/portal/players" },
  { key: "games", label: "Games", href: "/portal/games" },
  { key: "stats", label: "Stat lines", href: "/portal/stats" },
  { key: "awards", label: "Awards", href: "/portal/awards" },
  { key: "articles", label: "Articles", href: "/portal/articles" },
  { key: "users", label: "Users", href: "/portal/users" },
] as const;

function statusClass(status: string | undefined) {
  if (status === "succeeded") return "text-rvl-mint";
  if (status === "failed") return "text-destructive";
  if (status === "running" || status === "queued") return "text-rvl-accent";
  return "text-rvl-dim";
}

export default async function PortalDashboard() {
  const trpc = await api();
  const [
    seasonCount,
    teamCount,
    playerCount,
    gameCount,
    statCount,
    awardCount,
    articleCount,
    userCount,
    recordCount,
    seasonList,
    job,
  ] = await Promise.all([
    trpc.seasons.count(),
    trpc.teams.count(),
    trpc.players.count(),
    trpc.games.count(),
    trpc.stats.count(),
    trpc.awards.count(),
    trpc.articles.count(),
    trpc.users.count(),
    trpc.records.count(),
    trpc.seasons.list(),
    trpc.records.latestJob(),
  ]);

  const counts: Record<(typeof RESOURCES)[number]["key"], number> = {
    seasons: seasonCount,
    teams: teamCount,
    players: playerCount,
    games: gameCount,
    stats: statCount,
    awards: awardCount,
    articles: articleCount,
    users: userCount,
  };

  return (
    <PortalPage title="Dashboard" description="What is in the database right now.">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {RESOURCES.map((resource) => (
          <Link
            key={resource.href}
            href={resource.href}
            className="group border border-rvl-line px-5 py-4 text-inherit no-underline transition-colors hover:border-rvl-accent-soft"
          >
            <p className="m-0 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-rvl-dim">
              {resource.label}
            </p>
            <p className="m-0 mt-2.5 font-mono text-[1.9rem] font-bold leading-none tracking-[-0.045em] tabular-nums text-rvl-accent">
              {counts[resource.key]}
            </p>
            <p className="m-0 mt-3 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-rvl-dim transition-colors group-hover:text-rvl-accent">
              Manage →
            </p>
          </Link>
        ))}

        <StatTile label="Records" value={recordCount} hint="rebuilt by the job below" />
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
              <span className="text-[0.95rem] tabular-nums">{job?.rowsWritten ?? "-"}</span>
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
