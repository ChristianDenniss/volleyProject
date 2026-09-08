import { cache, Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Layers, Video, Volleyball } from "lucide-react";
import { api } from "@server/trpc/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

type GameDetail = NonNullable<Awaited<ReturnType<typeof load>>>;
type StatLine = GameDetail["stats"][number];

// Cached so generateMetadata and the page share one fetch per request.
const load = cache(async (id: string) => {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return (await api()).games.byId({ id: parsed });
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const game = await load(id);
  if (!game) return { title: "Game not found" };

  const title = game.name ?? `Game ${game.id}`;
  const [team1, team2] = game.teams;
  const stage = game.stage ?? "Game";
  const isUpcoming = game.status === "scheduled";

  const description = isUpcoming
    ? `${team1?.name ?? "TBD"} vs ${team2?.name ?? "TBD"} — upcoming ${stage} match on ${game.date}.`
    : `${title}: ${game.team1Score}-${game.team2Score} on ${game.date}.`;

  return { title, description, openGraph: { title, description } };
}

function formatGameDate(value: string) {
  const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatGameTime(value: string) {
  if (!value.includes("T")) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function winningTeamIndex(game: GameDetail): 0 | 1 | null {
  if (game.status !== "completed") return null;
  if (game.team1Score == null || game.team2Score == null) return null;
  if (game.team1Score === game.team2Score) return null;
  return game.team1Score > game.team2Score ? 0 : 1;
}

function teamTone(index: 0 | 1, winner: 0 | 1 | null) {
  if (winner === null) return "text-rvl-ink";
  return winner === index ? "text-rvl-accent" : "text-rvl-dim";
}

const STAT_COLUMNS: { key: string; header: string; value: (line: StatLine) => number }[] = [
  { key: "spikeKills", header: "Spike kills", value: (line) => line.spikeKills },
  { key: "spikeAttempts", header: "Spike att.", value: (line) => line.spikeAttempts },
  { key: "apeKills", header: "Ape kills", value: (line) => line.apeKills },
  { key: "apeAttempts", header: "Ape att.", value: (line) => line.apeAttempts },
  { key: "spikingErrors", header: "Spike err.", value: (line) => line.spikingErrors },
  { key: "digs", header: "Digs", value: (line) => line.digs },
  { key: "blockFollows", header: "Block follows", value: (line) => line.blockFollows },
  { key: "blocks", header: "Blocks", value: (line) => line.blocks },
  { key: "assists", header: "Assists", value: (line) => line.assists },
  { key: "settingErrors", header: "Set err.", value: (line) => line.settingErrors },
  { key: "aces", header: "Aces", value: (line) => line.aces },
  { key: "servingErrors", header: "Serve err.", value: (line) => line.servingErrors },
  { key: "miscErrors", header: "Misc err.", value: (line) => line.miscErrors },
];

const headerCell =
  "sticky top-0 z-1 whitespace-nowrap border-b border-rvl-line-strong bg-rvl-panel px-3 py-3 text-center font-mono text-[0.58rem] font-bold uppercase tracking-[0.16em] text-rvl-dim";
const bodyCell =
  "whitespace-nowrap border-b border-rvl-line px-3 py-3 text-center font-mono text-[0.88rem] tabular-nums text-rvl-ink-2";

function ScoreColumn({
  team,
  score,
  upcoming,
  tone,
}: {
  team: GameDetail["teams"][number] | null;
  score: number | null;
  upcoming: boolean;
  tone: string;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-2 text-center">
      <p
        className={cn(
          "m-0 font-mono text-[3.6rem] font-bold leading-none tracking-[-0.045em] tabular-nums sm:text-[4.2rem]",
          tone,
        )}
      >
        {upcoming ? "—" : (score ?? "—")}
      </p>
      {team ? (
        <Link
          href={`/teams/${encodeURIComponent(team.name)}`}
          className={cn(
            "max-w-full text-[1.35rem] font-bold capitalize leading-tight no-underline transition-colors hover:text-rvl-accent",
            tone,
          )}
        >
          {team.name}
        </Link>
      ) : (
        <span className={cn("text-[1.35rem] font-bold capitalize", tone)}>TBD</span>
      )}
    </div>
  );
}

export default async function GamePage({ params }: Params) {
  const { id } = await params;
  const game = await load(id);
  if (!game) notFound();

  const team1 = game.teams[0] ?? null;
  const team2 = game.teams[1] ?? null;
  const isUpcoming = game.status === "scheduled";
  const winner = winningTeamIndex(game);
  const totalSets = (game.team1Score ?? 0) + (game.team2Score ?? 0);
  const formattedDate = formatGameDate(game.date);
  const formattedTime = formatGameTime(game.date);

  const team1Stats = team1
    ? game.stats.filter((line) => team1.playerIds.includes(line.playerId))
    : [];
  const team2Stats = team2
    ? game.stats.filter((line) => team2.playerIds.includes(line.playerId))
    : [];
  const unassignedStats = game.stats.filter(
    (line) =>
      !team1Stats.some((row) => row.id === line.id) &&
      !team2Stats.some((row) => row.id === line.id),
  );
  const allStats = [...team1Stats, ...team2Stats, ...unassignedStats];
  const hasStats = allStats.length > 0;

  type StaffPerson = NonNullable<GameDetail["staff"]["streamed"]>;
  const staffEntries: { label: string; person: StaffPerson }[] = [];
  if (game.staff.streamed) staffEntries.push({ label: "Streamed", person: game.staff.streamed });
  if (game.staff.reffed) staffEntries.push({ label: "Reffed", person: game.staff.reffed });
  if (game.staff.commentated) {
    staffEntries.push({ label: "Commentated", person: game.staff.commentated });
  }

  const setScores = [
    game.set1Score,
    game.set2Score,
    game.set3Score,
    game.set4Score,
    game.set5Score,
  ].filter((score): score is string => Boolean(score));

  return (
    <div className="mx-auto box-border min-h-screen max-w-[1100px] px-5 pb-20 pt-2 font-display text-rvl-ink sm:px-8">
      <h1 className="mt-12 mb-4 min-h-20 text-balance text-center text-[2.4rem] font-black uppercase leading-[0.95] tracking-[-0.035em] text-rvl-ink sm:text-[3.2rem]">
        {game.name ?? `Game ${game.id}`}
      </h1>

      <p className="m-0 mb-8 text-center font-mono text-[0.84rem] font-bold uppercase tracking-[0.22em] text-rvl-accent">
        {game.stage ?? "Game"}
      </p>

      <div className="mb-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-[0.92rem] text-rvl-ink-2">
        {game.season ? (
          <Link
            href={`/seasons/${game.season.id}`}
            className="inline-flex items-center gap-2 font-semibold text-inherit no-underline transition-colors hover:text-rvl-accent"
          >
            <Layers aria-hidden="true" className="size-3.5 shrink-0 text-rvl-accent" />
            Season {game.season.seasonNumber}
          </Link>
        ) : null}
        {!isUpcoming ? (
          <span className="inline-flex items-center gap-2 font-semibold tabular-nums">
            <Volleyball aria-hidden="true" className="size-3.5 shrink-0 text-rvl-accent" />
            {totalSets} sets
          </span>
        ) : null}
        {game.videoUrl ? (
          <a
            href={game.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-rvl-accent no-underline transition-opacity hover:opacity-80"
          >
            <Video aria-hidden="true" className="size-3.5 shrink-0" />
            Watch
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 font-semibold text-rvl-dim">
            <Video aria-hidden="true" className="size-3.5 shrink-0" />
            N/A
          </span>
        )}
        <span className="inline-flex items-center gap-2 font-semibold tabular-nums">
          <Calendar aria-hidden="true" className="size-3.5 shrink-0 text-rvl-accent" />
          {formattedDate}
          {isUpcoming && formattedTime ? ` at ${formattedTime}` : null}
        </span>
      </div>

      {staffEntries.length > 0 ? (
        <div className="mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-rvl-dim">
          {staffEntries.map(({ label, person }) => (
            <p key={label} className="m-0">
              <span className="text-rvl-accent">{label}:</span>{" "}
              <span className="normal-case tracking-normal text-rvl-ink-2">{person.name}</span>
            </p>
          ))}
        </div>
      ) : null}

      <hr className="mx-auto mb-12 h-px w-full max-w-[400px] border-none bg-rvl-accent-soft" />

      <div className="mx-auto mb-12 grid max-w-[760px] grid-cols-1 items-center justify-items-center gap-5 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-x-12">
        <ScoreColumn
          team={team1}
          score={game.team1Score}
          upcoming={isUpcoming}
          tone={teamTone(0, winner)}
        />
        <span className="hidden rounded-full border border-rvl-line bg-rvl-panel px-3.5 py-1.5 font-mono text-[0.72rem] font-bold uppercase tracking-[0.2em] text-rvl-accent sm:inline-flex">
          vs
        </span>
        <ScoreColumn
          team={team2}
          score={game.team2Score}
          upcoming={isUpcoming}
          tone={teamTone(1, winner)}
        />
      </div>

      {setScores.length > 0 && !isUpcoming ? (
        <p className="m-0 -mt-6 mb-12 text-center font-mono text-[0.78rem] uppercase tracking-[0.16em] text-rvl-dim">
          {setScores.join(" · ")}
        </p>
      ) : null}

      {isUpcoming ? (
        <section className="mx-auto max-w-[640px] border border-rvl-accent-soft bg-linear-to-b from-rvl-accent-soft/40 to-rvl-panel px-6 py-10 text-center">
          <p className="m-0 mb-2 font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
            Upcoming
          </p>
          <h2 className="m-0 mb-3 text-[1.6rem] font-black uppercase tracking-[-0.03em] text-rvl-ink">
            Match not yet played
          </h2>
          <p className="m-0 text-[1.02rem] leading-relaxed text-rvl-ink-2">
            This game is scheduled for {formattedDate}
            {formattedTime ? ` at ${formattedTime}` : ""}. Player statistics will show up here after
            the match is completed.
          </p>
        </section>
      ) : hasStats ? (
        <section className="mt-4">
          <h2 className="mb-8 text-center text-[1.8rem] font-black uppercase tracking-[-0.03em] text-rvl-ink sm:text-[2.1rem]">
            Player statistics
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse">
              <thead>
                <tr>
                  <th className={`${headerCell} text-left`}>Player</th>
                  {STAT_COLUMNS.map((column) => (
                    <th key={column.key} className={headerCell}>
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allStats.map((line, index) => {
                  const onTeam2 = team2Stats.some((row) => row.id === line.id);
                  const showSeparator =
                    team1Stats.length > 0 && index === team1Stats.length - 1 && team2Stats.length > 0;

                  return (
                    <Fragment key={line.id}>
                      <tr
                        className={cn(
                          "transition-colors hover:bg-rvl-panel",
                          onTeam2 ? "bg-rvl-panel/55" : index % 2 === 1 && "bg-rvl-panel/30",
                        )}
                      >
                        <td
                          className={`${bodyCell} text-left font-display text-[0.98rem] font-semibold capitalize text-rvl-ink`}
                        >
                          <Link
                            href={`/players/${line.playerId}`}
                            className="text-inherit no-underline transition-colors hover:text-rvl-accent"
                          >
                            {line.playerName}
                          </Link>
                        </td>
                        {STAT_COLUMNS.map((column) => (
                          <td key={column.key} className={bodyCell}>
                            {column.value(line)}
                          </td>
                        ))}
                      </tr>
                      {showSeparator ? (
                        <tr className="h-3 bg-rvl-accent-soft/70">
                          <td colSpan={STAT_COLUMNS.length + 1} className="border-none p-0" />
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <p className="mt-6 text-center font-mono text-[0.9rem] uppercase tracking-[0.14em] text-rvl-dim">
          No statistics have been recorded for this game.
        </p>
      )}
    </div>
  );
}
