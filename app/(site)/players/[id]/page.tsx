import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@server/trpc/server";
import { PageMetric } from "@components/site/page-header";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

async function load(id: string) {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return (await api()).players.byId({ id: parsed });
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
    <div className="border border-rvl-line px-4 py-3.5">
      <span className="block font-mono text-[0.56rem] uppercase tracking-[0.2em] text-rvl-dim">
        {label}
      </span>
      <span className="mt-2 block font-mono text-[1.5rem] font-bold leading-none tracking-[-0.045em] tabular-nums text-rvl-accent">
        {value}
      </span>
    </div>
  );
}

const pillClass =
  "block border border-rvl-line px-3.5 py-2 font-mono text-[0.66rem] uppercase tracking-[0.1em] text-rvl-ink-2 no-underline transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent";

const railClass =
  "grid grid-cols-1 gap-8 border-b border-rvl-line px-5 py-12 sm:px-8 md:grid-cols-[210px_1fr] md:gap-14 xl:px-14";
const railHeadingClass =
  "m-0 mb-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent";
const emptyClass = "m-0 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-rvl-dim";

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
    <div className="font-display">
      <header className="flex flex-col gap-6 border-b border-rvl-line px-5 py-12 sm:px-8 sm:py-14 lg:flex-row lg:items-end xl:px-14">
        <div className="flex items-center gap-5">
          <img
            src="/images/pfpLogo.png"
            alt=""
            className="size-16 shrink-0 border border-rvl-line object-cover sm:size-20"
          />
          <div>
            <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
              Player · {player.position || "unlisted"}
            </span>
            <h1 className="mt-3 mb-0 text-[2.2rem] font-black uppercase leading-[0.95] tracking-[-0.035em] sm:text-[2.7rem]">
              {player.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-8 font-mono lg:ml-auto">
          <PageMetric label="Teams" value={player.teams.length} />
          <PageMetric label="Games" value={player.stats.length} />
          <PageMetric label="Awards" value={player.awards.length} />
          <PageMetric label="Records" value={player.records.length} />
        </div>
      </header>

      <section className={railClass}>
        <div>
          <h2 className={railHeadingClass}>Career totals</h2>
          <p className="m-0 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-dim">
            Every recorded stat line
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
      </section>

      <section className={railClass}>
        <div>
          <h2 className={railHeadingClass}>Teams</h2>
          <p className="m-0 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-dim">
            {player.teams.length} rosters
          </p>
        </div>

        {player.teams.length === 0 ? (
          <p className={emptyClass}>Not on any roster.</p>
        ) : (
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {player.teams.map((team) => (
              <li key={team.id} className="flex">
                <Link href={`/teams/${encodeURIComponent(team.name)}`} className={pillClass}>
                  {team.name}
                  {team.seasonNumber ? ` · S${team.seasonNumber}` : ""}
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
            {player.stats.length} stat lines
          </p>
        </div>

        {player.stats.length === 0 ? (
          <p className={emptyClass}>No stat lines recorded.</p>
        ) : (
          <div className="border-t border-rvl-line">
            {player.stats.map((line) => (
              <Link
                key={line.id}
                href={`/games/${line.gameId}`}
                className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-rvl-line py-4 text-inherit no-underline transition-colors hover:bg-rvl-panel"
              >
                <span className="w-[130px] shrink-0 font-mono text-[0.64rem] uppercase tracking-[0.16em] text-rvl-dim">
                  {line.gameDate}
                </span>
                <span className="text-[1rem] font-semibold capitalize">
                  {line.gameName ?? `Game ${line.gameId}`}
                </span>
                <span className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-rvl-dim md:ml-auto">
                  {line.spikeKills + line.apeKills} kills · {line.assists} assists ·{" "}
                  {line.blocks} blocks
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {player.awards.length > 0 ? (
        <section className={railClass}>
          <div>
            <h2 className={railHeadingClass}>Awards</h2>
            <p className="m-0 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-dim">
              {player.awards.length} won
            </p>
          </div>

          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {player.awards.map((award) => (
              <li key={award.id} className="flex">
                <Link href={`/awards/${award.id}`} className={pillClass}>
                  {award.type}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
