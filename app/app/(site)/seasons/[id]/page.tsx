import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@db";
import { seasons, teams } from "@server/services";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

async function load(id: string) {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return seasons.getById(getDb(), parsed);
}

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

  const roster = await teams.listPlayersBySeason(getDb(), season.id);
  const byTeam = new Map<number, { id: number; name: string }[]>();
  for (const row of roster) {
    byTeam.set(row.teamId, [...(byTeam.get(row.teamId) ?? []), { id: row.id, name: row.name }]);
  }

  return (
    <div className="box-border min-h-screen bg-white text-[#1a1a1a]">
      <h1 className="relative mx-auto my-8 min-h-20 max-w-fit text-center text-[4rem] font-black uppercase leading-tight max-md:text-[2.5rem]">
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 -z-1 h-[0.4em] w-[120%] -translate-x-1/2 -translate-y-1/2 -skew-x-[25deg] bg-[#a9d6f5]"
        />
        Season {season.seasonNumber}
      </h1>

      <div className="mb-4 flex flex-wrap items-center justify-center gap-6">
        {[
          { label: season.theme ?? "No theme" },
          { label: `${season.teams.length} teams` },
          { label: `${season.games.length} games` },
          { label: `${season.matches.length} matches` },
          { label: `${season.startDate} → ${season.endDate ?? "present"}` },
        ].map((meta) => (
          <span
            key={meta.label}
            className="min-w-32 rounded border border-[#333] bg-[#1a1a1a] px-4 py-2 text-center text-base text-white"
          >
            {meta.label}
          </span>
        ))}
      </div>

      <div className="mb-8 flex justify-center">
        <Link
          href="/awards"
          className="rounded bg-[#1a1a1a] px-4 py-2 text-base text-white no-underline transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#333] hover:shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
        >
          Season awards ({season.awards.length})
        </Link>
      </div>

      {season.teams.length === 0 ? (
        <p className="pb-16 text-center text-lg">No teams are registered for this season.</p>
      ) : (
        <div className="mb-8 box-border grid grid-cols-4 gap-8 p-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {season.teams.map((team, index) => (
            <Link
              key={team.id}
              href={`/teams/${encodeURIComponent(team.name)}`}
              className="group relative box-border flex h-[425px] w-full flex-col overflow-hidden border-2 border-[#a9d6f5] bg-[#1a1a1a] no-underline transition-[transform,box-shadow] duration-200 hover:scale-[1.03] hover:shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
            >
              <span className="absolute left-2 top-2 flex size-6 items-center justify-center rounded-full bg-[#a9d6f5] font-bold text-black">
                {index + 1}
              </span>

              <div className="flex h-12 w-full flex-col items-center justify-center bg-inherit text-[1.1rem] font-bold text-white transition-colors duration-200">
                <span className="m-0 capitalize leading-none group-hover:text-[#a9d6f5]">
                  {team.name}
                </span>
                <span className="text-[0.8rem] leading-none opacity-80 group-hover:text-[#a9d6f5]">
                  ID: {team.id}
                </span>
              </div>

              <div className="border-t border-[#222] bg-black py-1 text-center text-[0.85rem] text-[#ccc]">
                {team.placement}
              </div>

              <ul className="m-0 box-border flex-1 list-none overflow-y-auto p-2 text-left">
                {(byTeam.get(team.id) ?? []).map((player, playerIndex) => (
                  <li
                    key={player.id}
                    className="flex items-center gap-2 border-b border-[#333] py-0.5 text-[#ddd]"
                  >
                    <span className="w-5 text-right opacity-70">{playerIndex + 1}</span>
                    <span className="flex-1 truncate capitalize">{player.name}</span>
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      )}

      <section className="mx-auto w-[90%] max-w-[1600px] pb-16">
        <h2 className="mb-4 border-b-[3px] border-brand-sky-pale pb-2 text-[2rem] font-bold tracking-wide text-[#1e3d59]">
          Games
        </h2>
        {season.games.length === 0 ? (
          <p className="text-lg">No games have been recorded for this season.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto py-3">
            {season.games.map((game) => (
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
