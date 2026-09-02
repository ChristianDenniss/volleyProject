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
  return (await api()).games.byId({ id: parsed });
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
  "whitespace-nowrap border-b border-rvl-line-strong px-4 pb-3 text-right font-mono text-[0.58rem] font-bold uppercase tracking-[0.2em] text-rvl-dim";
const bodyCell =
  "whitespace-nowrap border-b border-rvl-line px-4 py-3.5 text-right font-mono text-[0.88rem] tabular-nums text-rvl-ink-2";

export default async function GamePage({ params }: Params) {
  const { id } = await params;
  const game = await load(id);
  if (!game) notFound();

  const [team1, team2] = game.teams;

  return (
    <div className="font-display">
      <header className="border-b border-rvl-line px-5 py-12 sm:px-8 sm:py-14 xl:px-14">
        <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
          {game.stage ?? "Game"}
        </span>

        <h1 className="mt-4 mb-8 text-balance text-[2rem] font-black uppercase leading-[0.95] tracking-[-0.035em] capitalize sm:text-[2.6rem]">
          {game.name ?? `Game ${game.id}`}
        </h1>

        <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
          {[team1, team2].map((team, index) =>
            team ? (
              <div key={team.id} className="flex items-baseline gap-5">
                <Link
                  href={`/teams/${encodeURIComponent(team.name)}`}
                  className="text-[1.3rem] font-bold capitalize text-inherit no-underline transition-colors hover:text-rvl-accent"
                >
                  {team.name}
                </Link>
                <span className="font-mono text-[2.6rem] font-bold leading-none tracking-[-0.045em] tabular-nums text-rvl-accent">
                  {index === 0 ? game.team1Score : game.team2Score}
                </span>
              </div>
            ) : null,
          )}

          <div className="flex flex-wrap gap-8 font-mono lg:ml-auto">
            <PageMetric label="Date" value={game.date} />
            <PageMetric
              label="Season"
              value={
                game.season ? (
                  <Link href={`/seasons/${game.season.id}`} className="no-underline">
                    {game.season.seasonNumber}
                  </Link>
                ) : (
                  "—"
                )
              }
            />
            {game.videoUrl ? (
              <div className="flex flex-col gap-1">
                <span className="text-[0.58rem] uppercase tracking-[0.22em] text-rvl-dim">VOD</span>
                <a
                  href={game.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.95rem] text-rvl-accent no-underline"
                >
                  Watch →
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-8 px-5 py-12 sm:px-8 md:grid-cols-[210px_1fr] md:gap-14 xl:px-14">
        <div>
          <h2 className="m-0 mb-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
            Box score
          </h2>
          <p className="m-0 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-rvl-dim">
            {game.stats.length} stat lines
          </p>
        </div>

        {game.stats.length === 0 ? (
          <p className="m-0 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-rvl-dim">
            No stats uploaded for this game.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr>
                  <th className={`${headerCell} text-left`}>Player</th>
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
                {game.stats.map((line) => (
                  <tr key={line.id} className="transition-colors hover:bg-rvl-panel">
                    <td
                      className={`${bodyCell} text-left font-display text-[0.98rem] font-semibold capitalize`}
                    >
                      <Link
                        href={`/players/${line.playerId}`}
                        className="text-rvl-ink no-underline transition-colors hover:text-rvl-accent"
                      >
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
