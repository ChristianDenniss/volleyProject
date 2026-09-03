import Link from "next/link";
import { api } from "@server/trpc/server";
import { HomeVideo } from "@components/site/home-video";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Volleyball 4-2 - Official Roblox Volleyball League",
  description:
    "Join the official Roblox Volleyball League (RVL). Watch matches, track player stats, view team rankings, and stay updated with the latest volleyball news and events.",
};


const REGIONS = [
  { code: "na", label: "NA" },
  { code: "eu", label: "EU" },
  { code: "as", label: "AS" },
  { code: "sa", label: "SA" },
] as const;

const band = "border-b border-rvl-line px-5 py-14 sm:px-8 sm:py-18 xl:px-14";
const railband =
  "grid grid-cols-1 gap-10 border-b border-rvl-line px-5 py-14 sm:px-8 sm:py-20 md:grid-cols-[210px_1fr] md:gap-16 xl:px-14";
const railHeading =
  "m-0 mb-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent";
const railMore =
  "border-b border-rvl-line pb-0.5 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-rvl-ink-2 no-underline transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent";
const label = "font-mono text-[0.62rem] uppercase tracking-[0.2em] text-rvl-dim";

function shortDate(value: string | number | Date) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function setLine(match: {
  set1Score: string | null;
  set2Score: string | null;
  set3Score: string | null;
  set4Score: string | null;
  set5Score: string | null;
}) {
  return [match.set1Score, match.set2Score, match.set3Score, match.set4Score, match.set5Score]
    .filter(Boolean)
    .join(" · ");
}

export default async function HomePage() {
  const trpc = await api();

  const [seasonRows, articleRows, playerCount] = await Promise.all([
    trpc.seasons.list(),
    trpc.articles.list(),
    trpc.players.count(),
  ]);

  const season = seasonRows[0] ?? null;

  const [matchRows, leaders, killRecords, blockRecords, aceRecords] = await Promise.all([
    season ? trpc.games.listSchedule({ seasonId: season.id }) : Promise.resolve([]),
    season ? trpc.stats.leaderboard({ seasonId: season.id }) : Promise.resolve([]),
    trpc.records.byMetric({ metric: "total kills", type: "game" }),
    trpc.records.byMetric({ metric: "blocks", type: "game" }),
    trpc.records.byMetric({ metric: "aces", type: "game" }),
  ]);

  const sortedArticles = [...articleRows].sort((a, b) => b.id - a.id);
  const featured = sortedArticles[0] ?? null;
  const latest = sortedArticles.slice(1, 4);

  const phase = matchRows.some((match) => match.phase === "playoffs") ? "Playoffs" : "Qualifiers";
  const activeRegions = new Set(matchRows.map((match) => match.region));

  const results = matchRows
    .filter((match) => match.status === "completed")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const upcoming = matchRows
    .filter((match) => match.status === "scheduled")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 2);

  const leaderIn = (key: "totalKills" | "assists" | "digs") =>
    [...leaders].sort((a, b) => Number(b[key] ?? 0) - Number(a[key] ?? 0))[0] ?? null;

  const killLeader = leaderIn("totalKills");
  const assistLeader = leaderIn("assists");
  const digLeader = leaderIn("digs");

  const numbers = [
    killLeader && {
      metric: "Kills · season",
      value: Number(killLeader.totalKills ?? 0),
      name: killLeader.playerName,
      context: `${killLeader.gamesPlayed} games`,
      href: `/players/${killLeader.playerId}`,
    },
    assistLeader && {
      metric: "Assists · season",
      value: Number(assistLeader.assists ?? 0),
      name: assistLeader.playerName,
      context: `${assistLeader.gamesPlayed} games`,
      href: `/players/${assistLeader.playerId}`,
    },
    digLeader && {
      metric: "Digs · season",
      value: Number(digLeader.digs ?? 0),
      name: digLeader.playerName,
      context: `${digLeader.gamesPlayed} games`,
      href: `/players/${digLeader.playerId}`,
    },
    killRecords[0] && {
      metric: "Kills · one game",
      value: killRecords[0].value,
      name: killRecords[0].playerName,
      context: `S${killRecords[0].seasonNumber ?? "-"} · record`,
      href: "/records",
    },
    blockRecords[0] && {
      metric: "Blocks · one game",
      value: blockRecords[0].value,
      name: blockRecords[0].playerName,
      context: `S${blockRecords[0].seasonNumber ?? "-"} · record`,
      href: "/records",
    },
    aceRecords[0] && {
      metric: "Aces · one game",
      value: aceRecords[0].value,
      name: aceRecords[0].playerName,
      context: `S${aceRecords[0].seasonNumber ?? "-"} · record`,
      href: "/records",
    },
  ].flatMap((entry) => (entry ? [entry] : []));

  // ── Standings: derive W/L from completed matches ──────────────────────────
  const teamWins = new Map<string, number>();
  const teamLosses = new Map<string, number>();
  for (const m of matchRows.filter((m) => m.status === "completed")) {
    const t1 = m.team1Name ?? null;
    const t2 = m.team2Name ?? null;
    if (!t1 || !t2) continue;
    const t1Wins = (m.team1Score ?? 0) > (m.team2Score ?? 0);
    teamWins.set(t1, (teamWins.get(t1) ?? 0) + (t1Wins ? 1 : 0));
    teamLosses.set(t1, (teamLosses.get(t1) ?? 0) + (t1Wins ? 0 : 1));
    teamWins.set(t2, (teamWins.get(t2) ?? 0) + (t1Wins ? 0 : 1));
    teamLosses.set(t2, (teamLosses.get(t2) ?? 0) + (t1Wins ? 1 : 0));
  }
  const standingsRows = [...new Set([...teamWins.keys(), ...teamLosses.keys()])]
    .map((name) => ({ name, wins: teamWins.get(name) ?? 0, losses: teamLosses.get(name) ?? 0 }))
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses);

  // ── Spotlight leaders ──────────────────────────────────────────────────────
  const spotlightLeaders = [
    killLeader && {
      stat: "Season Kills",
      value: Number(killLeader.totalKills ?? 0),
      name: killLeader.playerName,
      position: killLeader.position ?? "—",
      href: `/players/${killLeader.playerId}`,
    },
    assistLeader && {
      stat: "Season Assists",
      value: Number(assistLeader.assists ?? 0),
      name: assistLeader.playerName,
      position: assistLeader.position ?? "—",
      href: `/players/${assistLeader.playerId}`,
    },
    digLeader && {
      stat: "Season Digs",
      value: Number(digLeader.digs ?? 0),
      name: digLeader.playerName,
      position: digLeader.position ?? "—",
      href: `/players/${digLeader.playerId}`,
    },
  ].flatMap((e) => (e ? [e] : []));

  return (
    <div className="bg-rvl-ground font-display text-rvl-ink">

      {/* ── League ticker ─────────────────────────────────────────────────── */}
      <section className="flex flex-wrap items-center gap-x-10 gap-y-5 px-5 py-5 font-mono sm:gap-x-13 sm:px-8 xl:px-14">
        <div className="flex flex-col gap-1">
          <span className="text-[0.58rem] uppercase tracking-[0.22em] text-rvl-dim">Season</span>
          <span className="text-[1.05rem] font-medium tabular-nums text-rvl-accent">
            {season?.seasonNumber ?? "-"}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[0.58rem] uppercase tracking-[0.22em] text-rvl-dim">Phase</span>
          <span className="text-[1.05rem] font-medium">{phase}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[0.58rem] uppercase tracking-[0.22em] text-rvl-dim">Teams</span>
          <span className="text-[1.05rem] font-medium tabular-nums">{season?.teamCount ?? 0}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[0.58rem] uppercase tracking-[0.22em] text-rvl-dim">
            Players tracked
          </span>
          <span className="text-[1.05rem] font-medium tabular-nums">
            {playerCount.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[0.58rem] uppercase tracking-[0.22em] text-rvl-dim">Matches</span>
          <span className="text-[1.05rem] font-medium tabular-nums">{matchRows.length}</span>
        </div>

        <div className="flex gap-1.5 md:ml-auto">
          {REGIONS.map((region) => (
            <span
              key={region.code}
              className={
                activeRegions.has(region.code)
                  ? "border border-rvl-accent-soft px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.15em] text-rvl-accent"
                  : "border border-rvl-line px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.15em] text-rvl-dim"
              }
            >
              {region.label}
            </span>
          ))}
        </div>
      </section>


      {/* ── Featured article hero ─────────────────────────────────────────── */}
      <section className="border-b border-rvl-line px-5 pt-6 pb-14 sm:px-8 sm:pt-8 sm:pb-18 xl:px-14">
        {featured ? (
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
            <div>
              <h1 className="mb-4 text-balance text-[2.2rem] font-black uppercase leading-[0.95] tracking-[-0.035em] sm:text-[2.6rem] lg:text-[3.1rem]">
                {featured.title}
              </h1>
              <p className="m-0 mb-6 max-w-[46ch] text-[1.02rem] text-rvl-ink-2">
                {featured.summary}
              </p>
              <div className="flex flex-wrap gap-5 font-mono text-[0.68rem] uppercase tracking-[0.13em] text-rvl-dim">
                <span>{featured.authorName}</span>
                <span className="tabular-nums">{shortDate(featured.createdAt)}</span>
                <span className="tabular-nums text-rvl-accent">♥ {featured.likes}</span>
              </div>
              <Link
                href={`/articles/${featured.id}`}
                className="mt-7 inline-block bg-rvl-accent-bg px-6 py-3.5 text-[0.8rem] font-bold uppercase tracking-[0.11em] text-rvl-on-accent no-underline transition-opacity hover:opacity-85"
              >
                Read the story
              </Link>
            </div>
            <Link href={`/articles/${featured.id}`} className="block">
              <img
                src={featured.imageUrl}
                alt={featured.title}
                className="aspect-4/3 w-full border border-rvl-line object-cover"
              />
            </Link>
          </div>
        ) : (
          <div className="max-w-[52ch]">
            <span className={label}>League desk</span>
            <h1 className="mt-5 text-[2.4rem] font-black uppercase leading-[0.95] tracking-[-0.035em]">
              No featured story yet
            </h1>
            <p className="mt-4 text-rvl-ink-2">
              Articles appear here as soon as the desk approves them.
            </p>
          </div>
        )}
      </section>

      {/* ── Standings table ───────────────────────────────────────────────── */}
      {standingsRows.length > 0 ? (
        <section className={railband}>
          <div>
            <h2 className={railHeading}>Standings</h2>
            <p className="m-0 mb-4 text-[0.84rem] text-rvl-dim">
              {phase} · Season {season?.seasonNumber ?? "—"}
            </p>
            <Link href="/schedules" className={railMore}>
              Full bracket
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-85 border-collapse font-mono text-[0.78rem]">
              <thead>
                <tr className="border-b border-rvl-line">
                  <th className="pb-2 text-left text-[0.6rem] uppercase tracking-[0.18em] text-rvl-dim font-normal w-7">#</th>
                  <th className="pb-2 text-left text-[0.6rem] uppercase tracking-[0.18em] text-rvl-dim font-normal">Team</th>
                  <th className="pb-2 text-center text-[0.6rem] uppercase tracking-[0.18em] text-rvl-dim font-normal w-10">W</th>
                  <th className="pb-2 text-center text-[0.6rem] uppercase tracking-[0.18em] text-rvl-dim font-normal w-10">L</th>
                  <th className="pb-2 text-center text-[0.6rem] uppercase tracking-[0.18em] text-rvl-dim font-normal w-14">Win%</th>
                </tr>
              </thead>
              <tbody>
                {standingsRows.map((row, i) => {
                  const total = row.wins + row.losses;
                  const pct = total === 0 ? "—" : ((row.wins / total) * 100).toFixed(0) + "%";
                  return (
                    <tr
                      key={row.name}
                      className={`border-b border-rvl-line/60 ${i === 0 ? "text-rvl-ink" : "text-rvl-ink-2"}`}
                    >
                      <td className="py-3 text-rvl-dim tabular-nums">{i + 1}</td>
                      <td className="py-3 font-semibold font-display tracking-normal">
                        <Link
                          href={`/teams/${encodeURIComponent(row.name)}`}
                          className="text-inherit no-underline hover:text-rvl-accent"
                        >
                          {row.name}
                        </Link>
                      </td>
                      <td className={`py-3 text-center tabular-nums ${i === 0 ? "font-bold text-rvl-accent" : ""}`}>
                        {row.wins}
                      </td>
                      <td className="py-3 text-center tabular-nums">{row.losses}</td>
                      <td className="py-3 text-center tabular-nums text-rvl-dim">{pct}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* ── Player spotlight ──────────────────────────────────────────────── */}
      {spotlightLeaders.length > 0 ? (
        <section className="border-b border-rvl-line px-5 py-14 sm:px-8 sm:py-18 xl:px-14">
          <div className="mb-8 flex flex-wrap items-baseline gap-4">
            <h2 className="m-0 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
              Season Leaders
            </h2>
            <span className="text-[0.84rem] text-rvl-dim">top performers this season</span>
            <Link
              href="/stats"
              className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-ink-2 no-underline transition-colors hover:text-rvl-accent md:ml-auto"
            >
              Full stats →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {spotlightLeaders.map((leader) => (
              <Link
                key={leader.stat}
                href={leader.href}
                className="group relative flex flex-col gap-5 border border-rvl-line bg-rvl-panel p-7 text-inherit no-underline transition-colors hover:border-rvl-accent-soft"
              >
                {/* Avatar placeholder */}
                <div className="flex items-center gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center border border-rvl-line bg-rvl-ground font-mono text-[1.15rem] font-bold uppercase text-rvl-accent">
                    {leader.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[1.02rem] font-bold leading-tight">{leader.name}</div>
                    <div className="mt-0.5 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-rvl-dim">
                      {leader.position}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[3.4rem] font-bold leading-none tracking-tighter tabular-nums text-rvl-accent">
                    {leader.value}
                  </div>
                  <div className="mt-1.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-rvl-dim">
                    {leader.stat}
                  </div>
                </div>

                <span className="mt-auto font-mono text-[0.62rem] uppercase tracking-[0.14em] text-rvl-ink-2 transition-colors group-hover:text-rvl-accent">
                  View profile →
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Editorial photo band ──────────────────────────────────────────── */}
      <section
        className="relative w-full border-b border-rvl-line"
        style={{
          height: 500,
          backgroundImage: "url('/images/callToAction.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-12 xl:px-16">
          <span className="font-mono text-[0.64rem] uppercase tracking-[0.22em] text-rvl-accent-soft">
            Season {season?.seasonNumber ?? "—"} · {phase}
          </span>
          <h2 className="mt-3 mb-4 max-w-[18ch] text-balance text-[2rem] font-black uppercase leading-[0.94] tracking-[-0.03em] text-white sm:text-[2.6rem]">
            Play volleyball with the world
          </h2>
          <a
            href="https://www.roblox.com/games/3840352284/Volleyball-4-2"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-fit bg-rvl-accent-bg px-6 py-3 text-[0.8rem] font-bold uppercase tracking-[0.11em] text-rvl-on-accent no-underline transition-opacity hover:opacity-85"
          >
            Play Now on Roblox
          </a>
        </div>
      </section>

      {/* ── Recent articles as episode cards ─────────────────────────────── */}
      {latest.length > 0 ? (
        <section className={band}>
          <div className="mb-8 flex flex-wrap items-baseline gap-4">
            <h2 className="m-0 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
              Latest
            </h2>
            <span className="text-[0.84rem] text-rvl-dim">from the league desk</span>
            <Link
              href="/articles"
              className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-ink-2 no-underline transition-colors hover:text-rvl-accent md:ml-auto"
            >
              All articles →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-0 divide-y divide-rvl-line border border-rvl-line sm:grid-cols-1 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {latest.map((article, i) => (
              <Link
                key={article.id}
                href={`/articles/${article.id}`}
                className="group flex flex-col gap-0 text-inherit no-underline"
              >
                {article.imageUrl ? (
                  <div className="overflow-hidden">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-rvl-panel">
                    <span className="font-mono text-[0.64rem] uppercase tracking-[0.2em] text-rvl-dim">
                      Episode {i + 1}
                    </span>
                  </div>
                )}
                <div className="flex grow flex-col p-6">
                  <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-rvl-accent">
                    {article.authorName}
                  </span>
                  <h3 className="mt-3 mb-3 text-[1.15rem] font-bold leading-[1.26]">
                    {article.title}
                  </h3>
                  <p className="m-0 mb-5 text-[0.9rem] leading-relaxed text-rvl-ink-2">
                    {article.summary}
                  </p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-rvl-dim">
                      {shortDate(article.createdAt)}
                    </span>
                    <span className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-rvl-accent">
                      ♥ {article.likes}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Bracket results ───────────────────────────────────────────────── */}
      {results.length > 0 || upcoming.length > 0 ? (
        <section className={railband}>
          <div>
            <h2 className={railHeading}>Bracket</h2>
            <p className="m-0 mb-4 text-[0.84rem] text-rvl-dim">
              {phase} results and what&apos;s next.
            </p>
            <Link href="/schedules" className={railMore}>
              Schedules
            </Link>
          </div>

          <div className="flex flex-col gap-8">
            {results.map((match) => (
              <Link
                key={match.id}
                href="/schedules"
                className="flex flex-wrap items-center gap-x-8 gap-y-2 text-inherit no-underline"
              >
                <span className="w-39.5 shrink-0 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-rvl-dim">
                  {shortDate(match.date)} · {match.round}
                </span>
                <span className="flex items-center gap-4 text-[1.25rem]">
                  <span
                    className={
                      (match.team1Score ?? 0) > (match.team2Score ?? 0)
                        ? "font-bold"
                        : "text-rvl-ink-2"
                    }
                  >
                    {match.team1Name ?? "TBD"}
                  </span>
                  <span className="font-mono text-[1.35rem] font-bold tabular-nums text-rvl-accent">
                    {match.team1Score ?? 0}
                  </span>
                  <span className="text-rvl-dim">–</span>
                  <span className="font-mono text-[1.35rem] font-bold tabular-nums text-rvl-accent">
                    {match.team2Score ?? 0}
                  </span>
                  <span
                    className={
                      (match.team2Score ?? 0) > (match.team1Score ?? 0)
                        ? "font-bold"
                        : "text-rvl-ink-2"
                    }
                  >
                    {match.team2Name ?? "TBD"}
                  </span>
                </span>
                <span className="font-mono text-[0.68rem] tracking-[0.08em] text-rvl-dim md:ml-auto">
                  {setLine(match)}
                </span>
              </Link>
            ))}

            {upcoming.map((match) => (
              <Link
                key={match.id}
                href="/schedules"
                className="flex flex-wrap items-center gap-x-8 gap-y-2 text-inherit no-underline"
              >
                <span className="w-39.5 shrink-0 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-rvl-dim">
                  {shortDate(match.date)} · {match.round}
                </span>
                <span className="flex items-center gap-4 text-[1.25rem] text-rvl-ink-2">
                  <span>{match.team1Name ?? "TBD"}</span>
                  <span className="text-rvl-dim">vs</span>
                  <span>{match.team2Name ?? "TBD"}</span>
                </span>
                <span className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-rvl-mint md:ml-auto">
                  Scheduled · {match.matchNumber}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Numbers / records ─────────────────────────────────────────────── */}
      {numbers.length > 0 ? (
        <section className="grid grid-cols-1 gap-10 px-5 pt-14 pb-8 sm:px-8 sm:pt-20 md:grid-cols-[210px_1fr] md:gap-16 xl:px-14">
          <div>
            <h2 className={railHeading}>Numbers</h2>
            <p className="m-0 mb-4 text-[0.84rem] text-rvl-dim">
              Season leaders and the all-time single-game marks.
            </p>
            <Link href="/stats" className={railMore}>
              Stats
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-3 lg:gap-y-13">
            {numbers.map((entry) => (
              <Link
                key={entry.metric}
                href={entry.href}
                className="block text-inherit no-underline"
              >
                <div className={label}>{entry.metric}</div>
                <div className="my-3 font-mono text-[2.9rem] font-bold leading-none tracking-[-0.045em] tabular-nums text-rvl-accent">
                  {entry.value}
                </div>
                <div className="text-[1.02rem] font-semibold">{entry.name}</div>
                <div className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-rvl-dim">
                  {entry.context}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <HomeVideo videoId="jUYJKjPvPoQ" />

      {/* ── Join CTA ──────────────────────────────────────────────────────── */}
      <section className="border-t border-rvl-line bg-rvl-panel px-5 py-14 sm:px-8 sm:py-18 xl:px-14">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="m-0 text-[1.8rem] font-black uppercase leading-[0.95] tracking-[-0.03em] sm:text-[2.2rem]">
              Join the RVL community
            </h2>
            <p className="mt-3 max-w-[44ch] text-[1rem] text-rvl-ink-2">
              Connect with players, follow match results, and track stats across every season.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:items-end">
            <a
              href="https://www.roblox.com/games/3840352284/Volleyball-4-2"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-rvl-accent-bg px-7 py-3.5 text-[0.84rem] font-bold uppercase tracking-[0.11em] text-rvl-on-accent no-underline transition-opacity hover:opacity-85"
            >
              Play on Roblox
            </a>
            <a
              href="https://discord.gg/volleyball"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border border-rvl-line px-7 py-3.5 text-[0.84rem] font-bold uppercase tracking-[0.11em] text-rvl-ink-2 no-underline transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent"
            >
              Join Discord
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
