import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@db";
import { players } from "@server/services";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

async function load(id: string) {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return players.getById(getDb(), parsed);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const player = await load(id);
  if (!player) return { title: "Player not found" };

  const description = `${player.name} — ${player.position}, ${player.stats.length} games across ${player.teams.length} teams.`;
  return { title: player.name, description, openGraph: { title: player.name, description } };
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="box-border min-h-12 truncate border-b border-r border-[#262626] p-4 text-center font-semibold text-white last:border-r-0">
      <span className="mb-1 block truncate text-[0.9rem] font-semibold text-white/60">{label}</span>
      <span className="text-[1.4rem] font-extrabold text-white/60">{value}</span>
    </div>
  );
}

const pillClass =
  "block rounded-md bg-[#202020] px-5 py-2.5 font-medium text-white no-underline transition-all duration-200 hover:scale-105 hover:bg-[#626262]";

export default async function PlayerPage({ params }: Params) {
  const { id } = await params;
  const player = await load(id);
  if (!player) notFound();

  const totals = player.stats.reduce(
    (accumulator, line) => ({
      kills: accumulator.kills + line.spikeKills + line.apeKills,
      attempts: accumulator.attempts + line.spikeAttempts + line.apeAttempts,
      errors: accumulator.errors + line.spikingErrors + line.settingErrors + line.servingErrors + line.miscErrors,
      assists: accumulator.assists + line.assists,
      blocks: accumulator.blocks + line.blocks,
      digs: accumulator.digs + line.digs,
      aces: accumulator.aces + line.aces,
    }),
    { kills: 0, attempts: 0, errors: 0, assists: 0, blocks: 0, digs: 0, aces: 0 },
  );

  const percentage = totals.attempts === 0 ? 0 : (100 * totals.kills) / totals.attempts;

  return (
    <div className="box-border flex min-h-screen w-full flex-col bg-[#0e0e0e] px-8 py-4 text-[#f5f5f5] max-md:px-4">
      <header className="mb-8 flex flex-wrap items-start justify-center gap-8">
        <div className="mx-auto flex w-full max-w-[1200px] flex-nowrap items-center justify-center gap-8 px-4 max-[900px]:flex-col">
          <div className="flex flex-col items-center">
            <img
              src="/images/pfpLogo.png"
              alt={player.name}
              className="size-[580px] rounded-xl object-cover max-[900px]:size-[350px] max-[600px]:size-[250px]"
            />
          </div>

          <div className="flex flex-col justify-start">
            <h1 className="mb-4 text-[2.8rem] font-bold uppercase text-white max-[900px]:text-[2rem] max-[600px]:text-2xl">
              {player.name}
            </h1>
            <div className="flex flex-col gap-2 text-base font-medium text-[#ccc]">
              <span>ID: {player.id}</span>
              <span>Position: {player.position || "N/A"}</span>
              <span>Teams: {player.teams.length}</span>
              <span>Games with stats: {player.stats.length}</span>
              <span>Awards: {player.awards.length}</span>
              <span>Records: {player.records.length}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto mb-8 flex w-full flex-col gap-8">
        <section className="box-border w-full rounded-xl bg-[#1a1a1a] px-8 pb-8 pt-2 shadow-[0_0_12px_rgba(0,0,0,0.3)] max-md:px-4">
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="mb-4 text-xl font-bold text-[#eee]">Career totals</h3>
              <div className="grid w-full overflow-hidden rounded-lg bg-[#262626] [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))] min-[900px]:grid-cols-7">
                <StatItem label="Games" value={player.stats.length} />
                <StatItem label="Kills" value={totals.kills} />
                <StatItem label="Attempts" value={totals.attempts} />
                <StatItem label="Kill %" value={`${percentage.toFixed(1)}%`} />
                <StatItem label="Assists" value={totals.assists} />
                <StatItem label="Blocks" value={totals.blocks} />
                <StatItem label="Digs" value={totals.digs} />
                <StatItem label="Aces" value={totals.aces} />
                <StatItem label="Errors" value={totals.errors} />
              </div>
            </div>

            <div className="w-full">
              <h3 className="mb-4 text-2xl font-bold">Teams</h3>
              {player.teams.length === 0 ? (
                <p className="text-[#ccc]">This player is not on any roster.</p>
              ) : (
                <ul className="flex w-full list-none flex-wrap items-start gap-4 p-0">
                  {player.teams.map((team) => (
                    <li key={team.id} className="flex">
                      <Link href={`/teams/${encodeURIComponent(team.name)}`} className={pillClass}>
                        {team.name}
                        {team.seasonNumber ? ` (Season ${team.seasonNumber})` : ""}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="w-full">
              <h3 className="mb-4 text-2xl font-bold">Games</h3>
              {player.stats.length === 0 ? (
                <p className="text-[#ccc]">No stat lines have been recorded for this player.</p>
              ) : (
                <ul className="flex list-none flex-wrap items-start gap-2 p-0">
                  {player.stats.map((line) => (
                    <li key={line.id} className="flex">
                      <Link href={`/games/${line.gameId}`} className={pillClass}>
                        {line.gameName ?? `Game ${line.gameId}`} · {line.gameDate}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {player.awards.length > 0 ? (
              <div className="w-full">
                <h3 className="mb-4 text-2xl font-bold">Awards</h3>
                <ul className="flex w-full list-none flex-wrap gap-4 p-0">
                  {player.awards.map((award) => (
                    <li key={award.id} className="flex">
                      <Link href={`/awards/${award.id}`} className={pillClass}>
                        {award.type}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
