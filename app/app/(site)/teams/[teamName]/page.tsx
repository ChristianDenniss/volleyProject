import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@db";
import { teams } from "@server/services";

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
  const team = await teams.getByName(getDb(), decode(teamName));
  if (!team) return { title: "Team not found" };

  const description = `${team.name}: ${team.players.length} players, ${team.games.length} games, ${team.placement}.`;
  return {
    title: team.name,
    description,
    openGraph: { title: team.name, description, images: team.logoUrl ? [team.logoUrl] : undefined },
  };
}

const sectionTitleClass =
  "mb-4 mt-8 border-b-[3px] border-brand-sky-pale pb-2 text-[2rem] font-bold tracking-wide text-[#1e3d59]";

export default async function TeamPage({ params }: Params) {
  const { teamName } = await params;
  const team = await teams.getByName(getDb(), decode(teamName));
  if (!team) notFound();

  return (
    <div className="mx-auto my-10 box-border min-h-screen w-[90%] max-w-[1600px] p-5 capitalize text-[#333]">
      <div className="mb-8 flex items-center justify-center gap-4">
        {team.logoUrl ? (
          <img
            src={team.logoUrl}
            alt={`${team.name} logo`}
            className="size-20 object-contain max-md:size-[60px]"
          />
        ) : null}
        <h1 className="text-center text-[3rem] font-extrabold text-[#1a1a1a] [text-shadow:1px_1px_2px_rgba(0,0,0,0.15)] max-md:text-[2rem]">
          {team.name}
        </h1>
        {team.logoUrl ? (
          <img
            src={team.logoUrl}
            alt=""
            aria-hidden="true"
            className="size-20 -scale-x-100 object-contain max-md:size-[60px]"
          />
        ) : null}
      </div>

      <p className="mb-2.5 text-center text-[1.4rem]">
        {team.season ? `Season ${team.season.seasonNumber}` : "No season"} · {team.placement}
      </p>
      <p className="mb-2.5 text-center text-[1.4rem]">
        {team.players.length} players · {team.games.length} games
      </p>

      <section>
        <h2 className={sectionTitleClass}>Players</h2>
        {team.players.length === 0 ? (
          <p className="text-lg">No players are on this roster.</p>
        ) : (
          <ul className="flex list-none flex-wrap gap-4 p-0">
            {team.players.map((player) => (
              <li key={player.id} className="flex">
                <Link
                  href={`/players/${player.id}`}
                  className="block rounded-md bg-brand-sky-pale px-5 py-2.5 font-medium text-[#1e3d59] no-underline transition-colors duration-300 hover:bg-[#c1e0ff]"
                >
                  {player.name}
                  <span className="ml-2 text-sm text-[#1e3d59]/70">{player.position}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className={sectionTitleClass}>Games</h2>
        {team.games.length === 0 ? (
          <p className="text-lg">This team has no recorded games.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto py-3">
            {team.games.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="box-border flex min-h-[250px] w-[270px] shrink-0 flex-col justify-start rounded-2xl bg-brand-sky-pale px-3 py-3.5 text-left text-inherit no-underline shadow-[0_2px_6px_rgba(0,0,0,0.1)] transition-transform duration-200 hover:scale-105"
              >
                <p className="mb-8 text-[1.1em] text-[#1e3d59]">{game.name ?? `Game ${game.id}`}</p>
                <p className="my-1.5 text-lg text-black">Date: {game.date}</p>
                <p className="my-1.5 text-lg text-black">Stage: {game.stage}</p>
                <p className="my-1.5 text-lg text-black">
                  Score: {game.team1Score} - {game.team2Score}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
