import type { Metadata } from "next";
import { getDb } from "@db";
import { trivia } from "@server/services";
import { PageHeader, Section } from "@components/site/page-header";
import { EmptyState } from "@components/site/page-header";
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

  const db = getDb();
  const choose = () => (offset % 1_000_000) / 1_000_000;

  let subject:
    | { id: number; hintCount: number; clues: { label: string; value: string }[] }
    | null = null;
  let error: string | null = null;

  try {
    if (kind === "player") {
      const player = await trivia.randomPlayer(db, difficulty, choose);
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
      const team = await trivia.randomTeam(db, difficulty, choose);
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
      const season = await trivia.randomSeason(db, difficulty, choose);
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
    <>
      <PageHeader
        title="Trivia"
        description="Pick a subject and a difficulty, read the clues, and name it."
      />
      <Section>
        {subject === null ? (
          <>
            <TriviaBoard kind={kind} difficulty={difficulty} subject={null} />
            <div className="mt-4">
              <EmptyState>{error}</EmptyState>
            </div>
          </>
        ) : (
          <TriviaBoard kind={kind} difficulty={difficulty} subject={subject} />
        )}
      </Section>
    </>
  );
}
