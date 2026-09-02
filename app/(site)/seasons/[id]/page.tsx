import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@server/trpc/server";
import { PageHeader, PageMetric } from "@components/site/page-header";

export const dynamic = "force-dynamic";

const railClass =
  "grid grid-cols-1 gap-8 border-b border-rvl-line px-5 py-12 sm:px-8 md:grid-cols-[210px_1fr] md:gap-14 xl:px-14";
const railHeadingClass =
  "m-0 mb-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent";
const emptyClass = "m-0 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-rvl-dim";

interface Params {
  params: Promise<{ id: string }>;
}

// Cached so generateMetadata and the page share one fetch per request.
const load = cache(async (id: string) => {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return (await api()).seasons.byId({ id: parsed });
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const season = await load(id);
  if (!season) return { title: "Season not found" };

  const title = `Season ${season.seasonNumber}`;
  const description = season.theme
    ? `${title}: ${season.theme}. ${season.teams.length} teams and ${season.games.length} games.`
    : `${title}: ${season.teams.length} teams and ${season.games.length} games.`;

  return {
    title,
    description,
    openGraph: { title, description, images: season.image ? [season.image] : undefined },
  };
}

export default async function SeasonPage({ params }: Params) {
  const { id } = await params;
  const season = await load(id);
  if (!season) notFound();

  const roster = await (await api()).teams.playersBySeason({ seasonId: season.id });
  const byTeam = new Map<number, { id: number; name: string }[]>();
  for (const row of roster) {
    byTeam.set(row.teamId, [...(byTeam.get(row.teamId) ?? []), { id: row.id, name: row.name }]);
  }

  return (
    <div className="font-display">
      <PageHeader
        eyebrow={season.theme ? `Theme · ${season.theme}` : "Season"}
        title={`Season ${season.seasonNumber}`}
        description={`${season.startDate} → ${season.endDate ?? "present"}`}
        actions={
          <Link
            href="/awards"
            className="border border-rvl-line px-5 py-3 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-rvl-ink-2 no-underline transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent"
          >
            Season awards ({season.awards.length})
          </Link>
        }
        meta={
          <>
            <PageMetric label="Teams" value={season.teams.length} />
            <PageMetric label="Games" value={season.games.length} />
            <PageMetric label="Matches" value={season.matches.length} />
          </>
        }
      />

      <section className={railClass}>
        <div>
          <h2 className={railHeadingClass}>Field</h2>
          <p className="m-0 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-dim">
            {season.teams.length} teams
          </p>
        </div>

        {season.teams.length === 0 ? (
          <p className={emptyClass}>No teams registered.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {season.teams.map((team) => (
              <Link
                key={team.id}
                href={`/teams/${encodeURIComponent(team.name)}`}
                className="flex flex-col border border-rvl-line p-5 text-inherit no-underline transition-colors hover:border-rvl-accent-soft"
              >
                <span className="text-[1.1rem] font-bold capitalize leading-tight">
                  {team.name}
                </span>
                <span className="mt-2 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-rvl-dim">
                  {team.placement}
                </span>

                <ul className="m-0 mt-4 list-none border-t border-rvl-line p-0">
                  {(byTeam.get(team.id) ?? []).map((player) => (
                    <li
                      key={player.id}
                      className="border-b border-rvl-line py-2 text-[0.88rem] capitalize text-rvl-ink-2"
                    >
                      {player.name}
                    </li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className={railClass}>
        <div>
          <h2 className={railHeadingClass}>Games</h2>
          <p className="m-0 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-dim">
            {season.games.length} recorded
          </p>
        </div>

        {season.games.length === 0 ? (
          <p className={emptyClass}>No games recorded.</p>
        ) : (
          <div className="border-t border-rvl-line">
            {season.games.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-rvl-line py-4 text-inherit no-underline transition-colors hover:bg-rvl-panel"
              >
                <span className="w-[130px] shrink-0 font-mono text-[0.64rem] uppercase tracking-[0.16em] text-rvl-dim">
                  {game.date}
                </span>
                <span className="text-[1rem] font-semibold capitalize">
                  {game.name ?? `Game ${game.id}`}
                </span>
                <span className="font-mono text-[1.05rem] font-bold tabular-nums text-rvl-accent">
                  {game.team1Score}
                  <span className="px-1.5 text-rvl-dim">–</span>
                  {game.team2Score}
                </span>
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-rvl-dim md:ml-auto">
                  {game.stage}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
