import Link from "next/link";
import { portalApi } from "@server/trpc/server";
import { PortalPage } from "@components/portal/portal-page";

export const dynamic = "force-dynamic";

export const metadata = { title: "Portal" };

const RESOURCES = [
  { key: "seasons", label: "Seasons", href: "/portal/seasons" },
  { key: "teams", label: "Teams", href: "/portal/teams" },
  { key: "players", label: "Players", href: "/portal/players" },
  { key: "games", label: "Games", href: "/portal/games" },
  { key: "stats", label: "Stat lines", href: "/portal/stats" },
  { key: "records", label: "Records", href: "/portal/records" },
  { key: "awards", label: "Awards", href: "/portal/awards" },
  { key: "articles", label: "Articles", href: "/portal/articles" },
  { key: "users", label: "Users", href: "/portal/users" },
] as const;

export default async function PortalDashboard() {
  const trpc = await portalApi();
  const [
    seasonCount,
    teamCount,
    playerCount,
    gameCount,
    statCount,
    recordCount,
    awardCount,
    articleCount,
    userCount,
    scheduleRows,
    allArticles,
  ] = await Promise.all([
    trpc.seasons.count(),
    trpc.teams.count(),
    trpc.players.count(),
    trpc.games.count(),
    trpc.stats.count(),
    trpc.records.count(),
    trpc.awards.count(),
    trpc.articles.count(),
    trpc.users.count(),
    trpc.games.listSchedule({}),
    trpc.articles.listAll(),
  ]);

  const counts: Record<(typeof RESOURCES)[number]["key"], number> = {
    seasons: seasonCount,
    teams: teamCount,
    players: playerCount,
    games: gameCount,
    stats: statCount,
    records: recordCount,
    awards: awardCount,
    articles: articleCount,
    users: userCount,
  };

  const infoTiles = [
    {
      key: "completed",
      label: "Finished matches",
      value: Math.max(0, gameCount - scheduleRows.length),
      hint: "Completed",
    },
    {
      key: "scheduled",
      label: "Upcoming matches",
      value: scheduleRows.length,
      hint: "Scheduled",
    },
    {
      key: "pending-articles",
      label: "Pending articles",
      value: allArticles.filter((article) => article.approved !== true).length,
      hint: "Awaiting approval",
    },
  ] as const;

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

        {infoTiles.map((tile) => (
          <div key={tile.key} className="border border-dashed border-rvl-line px-5 py-4">
            <p className="m-0 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-rvl-dim">
              {tile.label}
            </p>
            <p className="m-0 mt-2.5 font-mono text-[1.9rem] font-bold leading-none tracking-[-0.045em] tabular-nums text-rvl-ink">
              {tile.value}
            </p>
            <p className="m-0 mt-3 truncate font-mono text-[0.58rem] uppercase tracking-[0.16em] text-rvl-dim">
              {tile.hint}
            </p>
          </div>
        ))}
      </div>

      <figure className="relative m-0 flex w-fit max-w-full items-center gap-5 overflow-hidden border-l-[3px] border-rvl-accent-bg py-5 pr-5 pl-6 max-md:flex-col max-md:items-start">
        <span
          aria-hidden
          className="pointer-events-none absolute top-1 right-3 select-none font-display text-[5.5rem] leading-none text-rvl-accent-soft/70"
        >
          &ldquo;
        </span>
        <img
          src="/images/LuvLate.png"
          alt="LuvLate"
          className="relative size-16 shrink-0 rounded-full border-2 border-rvl-accent-soft object-cover ring-2 ring-rvl-accent-bg/25 sm:size-[4.5rem]"
        />
        <div className="relative min-w-0">
          <blockquote className="m-0 text-[clamp(1.15rem,2.2vw,1.55rem)] font-semibold italic leading-[1.4] text-rvl-ink">
            Every great season starts with the people behind the scenes.
          </blockquote>
          <figcaption className="mt-2.5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.22em] text-rvl-accent">
            — LuvLate
          </figcaption>
        </div>
      </figure>
    </PortalPage>
  );
}
