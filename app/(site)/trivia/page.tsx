import type { Metadata } from "next";
import { api } from "@server/trpc/server";
import { EmptyState } from "@components/site/empty-state";
import { PageHeader, PageMetric } from "@components/site/page-header";
import { TriviaBoard } from "@components/site/trivia-board";
import type { Difficulty, TriviaKind } from "@server/services/trivia";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trivia",
  description: "Guess the player, team or season from their league record.",
};

const KINDS: TriviaKind[] = ["player", "team", "season"];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "impossible"];

function parseKind(value: string | undefined): TriviaKind {
  return KINDS.includes(value as TriviaKind) ? (value as TriviaKind) : "player";
}

function parseDifficulty(value: string | undefined): Difficulty {
  return DIFFICULTIES.includes(value as Difficulty) ? (value as Difficulty) : "easy";
}

export default async function TriviaPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; difficulty?: string; pick?: string }>;
}) {
  const query = await searchParams;
  const kind = parseKind(query.kind);
  const difficulty = parseDifficulty(query.difficulty);
  const pick = Number.parseInt(query.pick ?? "0", 10);
  const offset = Number.isFinite(pick) ? Math.abs(pick) : 0;

  const trpc = await api();
  const seed = (offset % 1_000_000) / 1_000_000;

  let subject:
    | { id: number; hintCount: number; clues: { label: string; value: string }[] }
    | null = null;
  let error: string | null = null;

  try {
    if (kind === "player") {
      const player = await trpc.trivia.randomPlayer({ difficulty, seed });
      subject = {
        id: player.id,
        hintCount: player.hintCount,
        clues: [
          { label: "Position", value: player.position },
          { label: "Teams", value: String(player.teams.length) },
          { label: "Games with stats", value: String(player.stats.length) },
          { label: "Awards", value: String(player.awards.length) },
          { label: "Records", value: String(player.records.length) },
          {
            label: "Placements",
            value: player.teams.map((team) => team.placement).join(", ") || "unknown",
          },
        ],
      };
    } else if (kind === "team") {
      const team = await trpc.trivia.randomTeam({ difficulty, seed });
      subject = {
        id: team.id,
        hintCount: team.hintCount,
        clues: [
          { label: "Placement", value: team.placement },
          { label: "Roster size", value: String(team.players.length) },
          { label: "Games", value: String(team.games.length) },
          {
            label: "Known players",
            value: team.players
              .slice(0, 2)
              .map((player) => player.name)
              .join(", "),
          },
        ],
      };
    } else {
      const season = await trpc.trivia.randomSeason({ difficulty, seed });
      subject = {
        id: season.id,
        hintCount: season.hintCount,
        clues: [
          { label: "Theme", value: season.theme ?? "none" },
          { label: "Started", value: season.startDate },
          { label: "Ended", value: season.endDate ?? "in progress" },
          { label: "Teams", value: String(season.teams.length) },
          { label: "Records", value: String(season.records.length) },
        ],
      };
    }
  } catch {
    error = `There is no ${difficulty} ${kind} in the database yet.`;
  }

  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Guessing game"
        title="Volleyball trivia"
        description="Pick a subject and a difficulty, read the clues one at a time, and name it."
        meta={
          <>
            <PageMetric label="Subject" value={kind} />
            <PageMetric label="Difficulty" value={difficulty} />
            <PageMetric label="Clues" value={subject?.clues.length ?? 0} />
          </>
        }
      />

      {subject === null ? (
        <>
          <TriviaBoard kind={kind} difficulty={difficulty} subject={null} />
          <div className="px-5 py-14 sm:px-8 xl:px-14">
            <EmptyState>{error}</EmptyState>
          </div>
        </>
      ) : (
        <TriviaBoard kind={kind} difficulty={difficulty} subject={subject} />
      )}
    </div>
  );
}
