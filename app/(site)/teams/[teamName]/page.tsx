import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@server/trpc/server";
import { PageMetric } from "@components/site/page-header";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ teamName: string }>;
}

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { teamName } = await params;
  const team = await (await api()).teams.byName({ name: decode(teamName) });
  if (!team) return { title: "Team not found" };

  const description = `${team.name}: ${team.players.length} players, ${team.games.length} games, ${team.placement}.`;
  return {
    title: team.name,
    description,
    openGraph: { title: team.name, description, images: team.logoUrl ? [team.logoUrl] : undefined },
  };
}

const railClass =
  "grid grid-cols-1 gap-8 border-b border-rvl-line px-5 py-12 sm:px-8 md:grid-cols-[210px_1fr] md:gap-14 xl:px-14";
const railHeadingClass =
  "m-0 mb-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent";

export default async function TeamPage({ params }: Params) {
  const { teamName } = await params;
  const team = await (await api()).teams.byName({ name: decode(teamName) });
  if (!team) notFound();

  return (
    <div className="font-display">
      <header className="flex flex-col gap-6 border-b border-rvl-line px-5 py-12 sm:px-8 sm:py-14 lg:flex-row lg:items-end xl:px-14">
        <div className="flex items-center gap-5">
          {team.logoUrl ? (
            <img
              src={team.logoUrl}
              alt=""
              className="size-16 shrink-0 border border-rvl-line object-cover sm:size-20"
            />
          ) : null}
          <div>
            <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
              Team
            </span>
            <h1 className="mt-3 mb-0 text-[2.2rem] font-black uppercase leading-[0.95] tracking-[-0.035em] sm:text-[2.7rem]">
              {team.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-8 font-mono lg:ml-auto">
          <PageMetric
            label="Season"
            value={team.season ? team.season.seasonNumber : "—"}
          />
          <PageMetric label="Placement" value={team.placement} />
          <PageMetric label="Players" value={team.players.length} />
          <PageMetric label="Games" value={team.games.length} />
        </div>
      </header>

      <section className={railClass}>
        <div>
          <h2 className={railHeadingClass}>Roster</h2>
          <p className="m-0 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-dim">
            {team.players.length} players
          </p>
        </div>

        {team.players.length === 0 ? (
          <p className="m-0 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-rvl-dim">
            No players on this roster.
          </p>
        ) : (
          <ul className="m-0 grid list-none grid-cols-1 border-t border-rvl-line p-0 sm:grid-cols-2 sm:gap-x-10">
            {team.players.map((player) => (
              <li key={player.id} className="border-b border-rvl-line">
                <Link
                  href={`/players/${player.id}`}
                  className="flex items-center gap-4 py-4 text-inherit no-underline transition-colors hover:text-rvl-accent"
                >
                  <span className="text-[1rem] font-semibold capitalize">{player.name}</span>
                  <span className="ml-auto font-mono text-[0.62rem] uppercase tracking-[0.16em] text-rvl-dim">
                    {player.position}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={railClass}>
        <div>
          <h2 className={railHeadingClass}>Games</h2>
          <p className="m-0 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-dim">
            {team.games.length} played
          </p>
        </div>

        {team.games.length === 0 ? (
          <p className="m-0 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-rvl-dim">
            No recorded games.
          </p>
        ) : (
          <div className="border-t border-rvl-line">
            {team.games.map((game) => (
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
