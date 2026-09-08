import Link from "next/link";
import { getDb } from "@db";
import { api } from "@server/trpc/server";
import { homeNumbers } from "@server/services";
import { getSiteRegionQuery } from "@server/site-region";
import { HomeBracket } from "@components/site/home-bracket";
import { HomeMatches } from "@components/site/home-matches";
import { HomeSpotlightRail, type SpotlightCard } from "@components/site/home-spotlight-rail";
import { HomeVideo } from "@components/site/home-video";
import { rankStandings } from "@/lib/standings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Volleyball 4-2 - Official Roblox Volleyball League",
  description:
    "Join the official Roblox Volleyball League (RVL). Watch matches, track player stats, view team rankings, and stay updated with the latest volleyball news and events.",
};

const railHeading =
  "m-0 mb-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent";
const railMore =
  "border-b border-rvl-line pb-0.5 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-rvl-ink-2 no-underline transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent";
const label = "font-mono text-[0.62rem] uppercase tracking-[0.2em] text-rvl-dim";

function heroDate(value: string | number | Date) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
}

function cardDate(value: string | number | Date) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
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
  const [trpc, { selected, query }] = await Promise.all([api(), getSiteRegionQuery()]);

  const [seasonRows, articleRows, playerCount] = await Promise.all([
    trpc.seasons.list(query),
    trpc.articles.list(),
    trpc.players.count(query),
  ]);

  const season = seasonRows[0] ?? null;

  const [matchRows, { numbers, avatars }, teamRows] = await Promise.all([
    season ? trpc.games.listSchedule({ seasonId: season.id, ...query }) : Promise.resolve([]),
    homeNumbers.loadHomeNumbers(getDb(), season?.id ?? null, query),
    trpc.teams.list(query),
  ]);

  const sortedArticles = [...articleRows].sort((a, b) => b.id - a.id);
  const featured = sortedArticles[0] ?? null;
  const latest = sortedArticles.slice(1, 8);

  const phase = matchRows.some((match) => match.phase === "playoffs") ? "Playoffs" : "Qualifiers";
  const standings = rankStandings(
    teamRows
      .filter((team) => team.seasonId === season?.id)
      .map((team) => ({
        id: team.id,
        name: team.name,
        logoUrl: team.logoUrl,
        placement: team.placement,
      })),
    matchRows,
  );

  const railCards: SpotlightCard[] = [
    ...latest.map((article, index) => ({
      kind: "article" as const,
      href: `/articles/${article.id}`,
      title: article.title,
      imageUrl: article.imageUrl,
      date: cardDate(article.createdAt),
      fresh: index === 0,
    })),
    ...numbers.slice(0, 3).map((entry) => ({
      kind: "stat" as const,
      href: entry.href,
      title: entry.metric,
      value: entry.value,
      name: entry.name,
    })),
  ];

  return (
    <div className="bg-rvl-ground font-display text-rvl-ink">
      <section className="relative min-h-[min(78svh,820px)] overflow-hidden bg-[#0c0d10]">
        {featured ? (
          <>
            <img
              src={featured.imageUrl}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black via-black/35 to-black/10" />
            <div className="relative flex min-h-[min(78svh,820px)] flex-col justify-end px-5 pt-16 pb-36 sm:px-8 sm:pb-40 xl:px-14">
              <span className="mb-4 inline-block w-fit border border-white/35 px-3 py-1.5 font-mono text-[0.64rem] uppercase tracking-[0.2em] text-white/85">
                {season
                  ? `Season ${season.seasonNumber} · ${phase} · ${selected.toUpperCase()} · ${playerCount.toLocaleString()} players`
                  : `${playerCount.toLocaleString()} players tracked`}
              </span>
              <h1 className="max-w-[22ch] text-balance text-[2.2rem] font-black uppercase leading-[0.92] tracking-[-0.035em] text-white sm:text-[2.8rem] lg:text-[3.4rem]">
                <Link href={`/articles/${featured.id}`} className="text-inherit no-underline">
                  {featured.title}
                </Link>
              </h1>
              <p className="mt-4 max-w-[46ch] text-[1rem] text-white/80">{featured.summary}</p>
              <span className="mt-5 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-white/70">
                {heroDate(featured.createdAt)}
              </span>
            </div>
          </>
        ) : (
          <div className="relative flex min-h-[min(78svh,820px)] flex-col justify-end px-5 pt-16 pb-36 sm:px-8 sm:pb-40 xl:px-14">
            <span className="mb-4 inline-block w-fit border border-white/35 px-3 py-1.5 font-mono text-[0.64rem] uppercase tracking-[0.2em] text-white/85">
              {playerCount.toLocaleString()} players tracked
            </span>
            <h1 className="mt-5 max-w-[18ch] text-[2.4rem] font-black uppercase leading-[0.95] tracking-[-0.035em] text-white">
              No featured story yet
            </h1>
            <p className="mt-4 max-w-[46ch] text-white/70">
              Articles appear here as soon as the desk approves them.
            </p>
          </div>
        )}
      </section>

      <HomeSpotlightRail cards={railCards} />

      {matchRows.length > 0 ? (
        <HomeMatches
          seasonLabel={season ? `Season ${season.seasonNumber}` : "League"}
          phase={phase}
          matches={matchRows.map((match) => ({
            id: match.id,
            date: match.date,
            round: match.round,
            status: match.status,
            matchNumber: match.matchNumber,
            team1Name: match.team1Name,
            team2Name: match.team2Name,
            team1LogoUrl: match.team1LogoUrl,
            team2LogoUrl: match.team2LogoUrl,
            team1Score: match.team1Score,
            team2Score: match.team2Score,
            setLine: setLine(match),
          }))}
        />
      ) : null}

      {numbers.length > 0 ? (
        <section className="grid grid-cols-1 gap-10 border-t border-rvl-line px-5 py-14 sm:px-8 sm:py-20 md:grid-cols-[210px_1fr] md:gap-16 xl:px-14">
          <div>
            <h2 className={railHeading}>Numbers</h2>
            <p className="m-0 mb-4 text-[0.84rem] text-rvl-dim">
              Season leaders across the core counting stats.
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
                <div className="my-4 flex items-end gap-5">
                  <img
                    src={avatars[entry.name] ?? "/images/pfpLogo.png"}
                    alt=""
                    className="size-24 shrink-0 rounded-xs border border-rvl-line object-cover object-center sm:size-28"
                  />
                  <div className="font-mono text-[3.8rem] font-bold leading-none tracking-[-0.05em] tabular-nums text-rvl-accent sm:text-[4.6rem]">
                    {entry.value}
                  </div>
                </div>
                <div className="text-[1.15rem] font-semibold">{entry.name}</div>
                <div className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-rvl-dim">
                  {entry.context}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <HomeVideo videoId="jUYJKjPvPoQ" />

      <HomeBracket phase={phase} standings={standings} />

      <section className="relative h-[500px] min-h-[500px] overflow-hidden max-md:h-[300px] max-md:min-h-0 max-[480px]:h-[250px] min-[1600px]:h-[600px] min-[1600px]:min-h-[600px] min-[2000px]:h-[700px] min-[2000px]:min-h-[700px]">
        <a
          href="https://discord.gg/volleyball"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 block"
          aria-label="Join RVL on Discord"
        >
          <img
            src="/images/new_calltoaction_banner_rvl.png"
            alt="Never miss a moment of RO-VBL. Join RVL now."
            className="size-full object-cover object-center"
          />
        </a>
      </section>
    </div>
  );
}
