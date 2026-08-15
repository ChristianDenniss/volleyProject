import { eq } from "drizzle-orm";
import type { Db } from "@db";
import { correlatedSum } from "@db/sqlx";
import {
  awardsPlayers,
  players,
  records,
  seasons,
  stats,
  teams,
  teamsGames,
  teamsPlayers,
} from "@db/schema";
import { NotFoundError } from "./errors";

export type Difficulty = "easy" | "medium" | "hard" | "impossible";
export type TriviaKind = "player" | "team" | "season";

export const HINT_COUNTS: Record<Difficulty, number> = {
  easy: 6,
  medium: 8,
  hard: 10,
  impossible: 12,
};

export function playerDifficulty(relationCount: number): Difficulty {
  if (relationCount >= 20) return "easy";
  if (relationCount >= 12) return "medium";
  if (relationCount >= 6) return "hard";
  return "impossible";
}

export function missedPlayoffs(placement: string | null | undefined): boolean {
  return /did ?n[o']?t make playoffs/i.test(placement ?? "");
}

export function teamDifficulty(relationCount: number, placement: string | null): Difficulty {
  if (missedPlayoffs(placement)) {
    if (relationCount >= 15) return "easy";
    if (relationCount >= 5) return "hard";
    return "impossible";
  }
  if (relationCount >= 15) return "easy";
  if (relationCount >= 10) return "medium";
  if (relationCount >= 5) return "hard";
  return "impossible";
}

export function seasonDifficulty(seasonNumber: number): Difficulty {
  if (seasonNumber >= 9) return "easy";
  if (seasonNumber >= 5) return "medium";
  return "hard";
}

export function normalizeGuess(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "").trim();
}

function pick<T>(candidates: T[], random: () => number): T {
  return candidates[Math.floor(random() * candidates.length)];
}

export async function randomPlayer(db: Db, difficulty: Difficulty, random: () => number = Math.random) {
  const scored = await db
    .select({
      id: players.id,
      name: players.name,
      position: players.position,
      relationCount: correlatedSum(
        [
          '(select count(*) from "teams_players" where "teams_players"."player_id" = "players"."id")',
          '(select count(*) from "awards_players" where "awards_players"."player_id" = "players"."id")',
          '(select count(*) from "stats" where "stats"."player_id" = "players"."id")',
          '(select count(*) from "records" where "records"."player_id" = "players"."id")',
        ].join(" + "),
      ),
    })
    .from(players);

  const candidates = scored.filter((row) => playerDifficulty(row.relationCount) === difficulty);
  if (candidates.length === 0) throw new NotFoundError(`A ${difficulty} player`);

  const chosen = pick(candidates, random);
  const [playerTeams, playerAwards, playerStats, playerRecords] = await Promise.all([
    db
      .select({ id: teams.id, name: teams.name, placement: teams.placement })
      .from(teamsPlayers)
      .innerJoin(teams, eq(teamsPlayers.teamId, teams.id))
      .where(eq(teamsPlayers.playerId, chosen.id)),
    db.select().from(awardsPlayers).where(eq(awardsPlayers.playerId, chosen.id)),
    db.select().from(stats).where(eq(stats.playerId, chosen.id)),
    db.select().from(records).where(eq(records.playerId, chosen.id)),
  ]);

  return {
    id: chosen.id,
    name: chosen.name,
    position: chosen.position,
    teams: playerTeams,
    awards: playerAwards,
    stats: playerStats,
    records: playerRecords,
    difficulty,
    hintCount: HINT_COUNTS[difficulty],
  };
}

export async function randomTeam(db: Db, difficulty: Difficulty, random: () => number = Math.random) {
  const scored = await db
    .select({
      id: teams.id,
      name: teams.name,
      placement: teams.placement,
      logoUrl: teams.logoUrl,
      seasonId: teams.seasonId,
      relationCount: correlatedSum(
        [
          '(select count(*) from "teams_players" where "teams_players"."team_id" = "teams"."id")',
          '(select count(*) from "teams_games" where "teams_games"."team_id" = "teams"."id")',
        ].join(" + "),
      ),
    })
    .from(teams);

  const candidates = scored.filter(
    (row) => teamDifficulty(row.relationCount, row.placement) === difficulty,
  );
  if (candidates.length === 0) throw new NotFoundError(`A ${difficulty} team`);

  const chosen = pick(candidates, random);
  const [roster, schedule] = await Promise.all([
    db
      .select({ id: players.id, name: players.name, position: players.position })
      .from(teamsPlayers)
      .innerJoin(players, eq(teamsPlayers.playerId, players.id))
      .where(eq(teamsPlayers.teamId, chosen.id)),
    db.select().from(teamsGames).where(eq(teamsGames.teamId, chosen.id)),
  ]);

  return {
    id: chosen.id,
    name: chosen.name,
    placement: chosen.placement,
    logoUrl: chosen.logoUrl,
    seasonId: chosen.seasonId,
    players: roster,
    games: schedule,
    difficulty,
    hintCount: HINT_COUNTS[difficulty],
  };
}

export async function randomSeason(
  db: Db,
  difficulty: Difficulty,
  random: () => number = Math.random,
) {
  const resolved: Difficulty = difficulty === "impossible" ? "hard" : difficulty;
  const all = await db.select().from(seasons);
  const candidates = all.filter((season) => seasonDifficulty(season.seasonNumber) === resolved);
  if (candidates.length === 0) throw new NotFoundError(`A ${resolved} season`);

  const chosen = pick(candidates, random);
  const [seasonTeams, seasonRecords] = await Promise.all([
    db.select().from(teams).where(eq(teams.seasonId, chosen.id)),
    db.select().from(records).where(eq(records.seasonId, chosen.id)),
  ]);

  return {
    ...chosen,
    teams: seasonTeams,
    records: seasonRecords,
    difficulty: resolved,
    hintCount: HINT_COUNTS[resolved],
  };
}

export async function checkGuess(db: Db, kind: TriviaKind, id: number, guess: string) {
  let answer: string | null;

  if (kind === "player") {
    const row = await db.query.players.findFirst({ where: eq(players.id, id) });
    answer = row?.name ?? null;
  } else if (kind === "team") {
    const row = await db.query.teams.findFirst({ where: eq(teams.id, id) });
    answer = row ? row.name.replace(/\s*\(s\d+\)\s*$/i, "") : null;
  } else {
    const row = await db.query.seasons.findFirst({ where: eq(seasons.id, id) });
    answer = row ? `Season ${row.seasonNumber}` : null;
  }

  if (answer === null) throw new NotFoundError(`${kind} ${id}`);

  const correct = normalizeGuess(guess) === normalizeGuess(answer);
  return { correct, answer, message: correct ? "Correct!" : "Try again!" };
}
