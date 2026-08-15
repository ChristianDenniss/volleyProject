import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@db";
import { games } from "@server/services";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

async function load(id: string) {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return games.getById(getDb(), parsed);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const game = await load(id);
  if (!game) return { title: "Game not found" };

  const title = game.name ?? `Game ${game.id}`;
  const description = `${title} — ${game.team1Score}–${game.team2Score} on ${game.date}.`;
  return { title, description, openGraph: { title, description } };
}

const headerCell =
  "sticky top-0 z-1 whitespace-nowrap bg-brand-navy-deep px-4 py-3.5 text-center font-semibold text-white";
const bodyCell = "whitespace-nowrap border-b border-[#eef3f8] px-4 py-3 text-center";

export default async function GamePage({ params }: Params) {
  const { id } = await params;
  const game = await load(id);
  if (!game) notFound();

  const [team1, team2] = game.teams;

  return (
    <div className="mx-auto box-border min-h-screen max-w-[1100px] px-6 pb-20 pt-2 text-[#222]">
      <h1 className="mb-6 mt-12 min-h-20 text-center text-[3.5rem] font-extrabold capitalize leading-tight tracking-wide max-md:text-[2rem]">
        {game.name ?? `Game ${game.id}`}
      </h1>

      <div className="mb-9 flex flex-wrap justify-center gap-5 max-[700px]:flex-col max-[700px]:gap-1">
        <p className="m-0 text-[0.975rem] font-semibold text-[#5d6673]">{game.date}</p>
        {game.season ? (
          <Link
            href={`/seasons/${game.season.id}`}
            className="m-0 text-[0.975rem] font-semibold text-[#5d6673] no-underline hover:underline"
          >
            Season {game.season.seasonNumber}
          </Link>
        ) : null}
        {game.videoUrl ? (
          <a
            href={game.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="m-0 text-[0.975rem] font-semibold text-[#5d6673] no-underline hover:underline"
          >
            Watch the game
          </a>
        ) : null}
      </div>

      <div className="-mt-5 mb-6 flex justify-center">
        <p className="mt-8 text-center text-2xl font-semibold text-[#5d6673]">{game.stage}</p>
      </div>

      <hr className="mx-auto mb-12 h-[3px] w-[400px] max-w-full border-none bg-brand-sky-pale" />

      <div className="mb-12 flex flex-wrap items-center justify-center gap-16 max-[700px]:gap-4">
        {[team1, team2].map((team, index) =>
          team ? (
            <div key={team.id} className="flex items-center gap-16 max-[700px]:gap-4">
              {index === 1 ? (
                <span className="rounded-full bg-brand-sky-pale px-4 py-1.5 text-[1.2rem] font-bold text-[#5d6673] shadow-[0_0_0_3px_#fff,0_0_0_6px_var(--brand-sky-pale)] max-[700px]:hidden">
                  VS
                </span>
              ) : null}
              <div className="min-w-[120px] max-w-[220px] flex-1 text-center">
                <Link
                  href={`/teams/${encodeURIComponent(team.name)}`}
                  className="mb-1.5 block text-2xl font-bold capitalize text-inherit no-underline hover:underline"
                >
                  {team.name}
                </Link>
                <p className="mb-1 text-[4.2rem] font-extrabold leading-none text-brand-navy-deep max-[700px]:text-[3.3rem]">
                  {index === 0 ? game.team1Score : game.team2Score}
                </p>
              </div>
            </div>
          ) : null,
        )}
      </div>

      <section className="mt-18">
        <h2 className="mb-6 text-center text-[2.25rem] font-bold text-brand-navy-deep">
          Player stats
        </h2>

        {game.stats.length === 0 ? (
          <p className="mt-6 text-center text-[1.3rem] text-[#5d6673]">
            No stats have been uploaded for this game.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-[0.93rem]">
              <thead>
                <tr>
                  <th className={headerCell}>Player</th>
                  <th className={headerCell}>Spike kills</th>
                  <th className={headerCell}>Ape kills</th>
                  <th className={headerCell}>Attempts</th>
                  <th className={headerCell}>Assists</th>
                  <th className={headerCell}>Blocks</th>
                  <th className={headerCell}>Digs</th>
                  <th className={headerCell}>Aces</th>
                  <th className={headerCell}>Errors</th>
                </tr>
              </thead>
              <tbody>
                {game.stats.map((line, index) => (
                  <tr
                    key={line.id}
                    className={cn(
                      "transition-colors duration-150 hover:bg-brand-sky-pale/45",
                      index % 2 === 1 && "bg-[#f7fbff]",
                    )}
                  >
                    <td className={`${bodyCell} capitalize`}>
                      <Link href={`/players/${line.playerId}`} className="hover:underline">
                        {line.playerName}
                      </Link>
                    </td>
                    <td className={bodyCell}>{line.spikeKills}</td>
                    <td className={bodyCell}>{line.apeKills}</td>
                    <td className={bodyCell}>{line.spikeAttempts + line.apeAttempts}</td>
                    <td className={bodyCell}>{line.assists}</td>
                    <td className={bodyCell}>{line.blocks}</td>
                    <td className={bodyCell}>{line.digs}</td>
                    <td className={bodyCell}>{line.aces}</td>
                    <td className={bodyCell}>
                      {line.spikingErrors +
                        line.settingErrors +
                        line.servingErrors +
                        line.miscErrors}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
