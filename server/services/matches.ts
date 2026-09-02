import { and, asc, eq } from "drizzle-orm";
import type { Db } from "@db";
import { insertMany } from "@db/insert";
import {
  MATCH_PHASES,
  MATCH_REGIONS,
  MATCH_STATUSES,
  matches,
  seasons,
  teams,
} from "@db/schema";
import { BadRequestError, found, NotFoundError } from "./errors";
import type { PartialInput } from "./input";

export type MatchStatus = (typeof MATCH_STATUSES)[number];
export type MatchPhase = (typeof MATCH_PHASES)[number];
export type MatchRegion = (typeof MATCH_REGIONS)[number];

export interface MatchInput {
  matchNumber: string;
  round: string;
  status?: MatchStatus | undefined;
  phase?: MatchPhase | undefined;
  region?: MatchRegion | undefined;
  date: string;
  seasonId: number;
  team1Name?: string | null | undefined;
  team2Name?: string | null | undefined;
  team1LogoUrl?: string | null | undefined;
  team2LogoUrl?: string | null | undefined;
  team1Score?: number | null | undefined;
  team2Score?: number | null | undefined;
  set1Score?: string | null | undefined;
  set2Score?: string | null | undefined;
  set3Score?: string | null | undefined;
  set4Score?: string | null | undefined;
  set5Score?: string | null | undefined;
  challongeMatchId?: string | null | undefined;
  challongeTournamentId?: string | null | undefined;
  challongeRound?: number | null | undefined;
  tags?: string[] | null | undefined;
}

export async function list(db: Db) {
  return db.select().from(matches).orderBy(asc(matches.date));
}

export async function listBySeason(db: Db, seasonId: number) {
  return db
    .select()
    .from(matches)
    .where(eq(matches.seasonId, seasonId))
    .orderBy(asc(matches.date));
}

export async function listByRound(db: Db, seasonId: number, round: string) {
  return db
    .select()
    .from(matches)
    .where(and(eq(matches.seasonId, seasonId), eq(matches.round, round)))
    .orderBy(asc(matches.date));
}

export async function getById(db: Db, id: number) {
  return (await db.query.matches.findFirst({ where: eq(matches.id, id) })) ?? null;
}

export async function count(db: Db) {
  return db.$count(matches);
}

async function assertSeason(db: Db, seasonId: number) {
  const season = await db.query.seasons.findFirst({ where: eq(seasons.id, seasonId) });
  if (!season) throw new NotFoundError(`Season ${seasonId}`);
}

async function logoFor(db: Db, teamName: string | null | undefined) {
  if (!teamName) return null;
  const team = await db.query.teams.findFirst({ where: eq(teams.name, teamName) });
  return team?.logoUrl ?? null;
}

export async function create(db: Db, input: MatchInput) {
  await assertSeason(db, input.seasonId);
  const [team1LogoUrl, team2LogoUrl] = await Promise.all([
    input.team1LogoUrl ?? logoFor(db, input.team1Name),
    input.team2LogoUrl ?? logoFor(db, input.team2Name),
  ]);
  const [row] = await db
    .insert(matches)
    .values({ ...input, team1LogoUrl, team2LogoUrl })
    .returning();
  return row;
}

export async function update(db: Db, id: number, input: PartialInput<MatchInput>) {
  const [row] = await db.update(matches).set(input).where(eq(matches.id, id)).returning();
  return found(row, `Match ${id}`);
}

export async function remove(db: Db, id: number) {
  const [row] = await db.delete(matches).where(eq(matches.id, id)).returning({ id: matches.id });
  found(row, `Match ${id}`);
  return { id };
}

interface ChallongeMatch {
  id: number | string;
  round: number;
  state: string;
  scores_csv?: string | null | undefined;
  player1_id?: number | null | undefined;
  player2_id?: number | null | undefined;
  suggested_play_order?: number | null | undefined;
  updated_at?: string | null | undefined;
  started_at?: string | null | undefined;
  scheduled_time?: string | null | undefined;
}

interface ChallongeParticipant {
  id: number | string;
  name: string;
}

export interface ChallongeImportInput {
  tournamentId: string;
  seasonId: number;
  apiKey: string;
  phase?: MatchPhase | undefined;
  region?: MatchRegion | undefined;
  tags?: string[] | null | undefined;
  fetchImpl?: typeof fetch | undefined;
}

function setScores(scoresCsv: string | null | undefined) {
  const sets = (scoresCsv ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  let team1Score = 0;
  let team2Score = 0;
  for (const set of sets) {
    const [left, right] = set.split("-").map((value) => Number.parseInt(value, 10));
    if (left === undefined || right === undefined) continue;
    if (Number.isNaN(left) || Number.isNaN(right)) continue;
    if (left > right) team1Score += 1;
    else if (right > left) team2Score += 1;
  }
  return {
    team1Score: sets.length > 0 ? team1Score : null,
    team2Score: sets.length > 0 ? team2Score : null,
    set1Score: sets[0] ?? null,
    set2Score: sets[1] ?? null,
    set3Score: sets[2] ?? null,
    set4Score: sets[3] ?? null,
    set5Score: sets[4] ?? null,
  };
}

export async function importFromChallonge(db: Db, input: ChallongeImportInput) {
  await assertSeason(db, input.seasonId);
  if (!input.apiKey) throw new BadRequestError("A Challonge API key is required");

  const call = input.fetchImpl ?? fetch;
  const base = `https://api.challonge.com/v1/tournaments/${input.tournamentId}`;
  const query = `api_key=${encodeURIComponent(input.apiKey)}`;

  const [matchResponse, participantResponse] = await Promise.all([
    call(`${base}/matches.json?${query}`),
    call(`${base}/participants.json?${query}`),
  ]);

  if (!matchResponse.ok || !participantResponse.ok) {
    throw new BadRequestError(
      `Challonge rejected the request (${matchResponse.status}/${participantResponse.status})`,
    );
  }

  const rawMatches = (await matchResponse.json()) as { match: ChallongeMatch }[];
  const rawParticipants = (await participantResponse.json()) as {
    participant: ChallongeParticipant;
  }[];

  const nameById = new Map(
    rawParticipants.map((entry) => [String(entry.participant.id), entry.participant.name]),
  );

  const roster = await db.select({ name: teams.name, logoUrl: teams.logoUrl }).from(teams);
  const logoByName = new Map(roster.map((team) => [team.name.toLowerCase(), team.logoUrl]));

  const existing = await db
    .select({ challongeMatchId: matches.challongeMatchId })
    .from(matches)
    .where(eq(matches.challongeTournamentId, input.tournamentId));
  const known = new Set(existing.map((row) => row.challongeMatchId));

  const rows = rawMatches
    .map((entry) => entry.match)
    .filter((match) => !known.has(String(match.id)))
    .map((match) => {
      const team1Name = match.player1_id ? (nameById.get(String(match.player1_id)) ?? null) : null;
      const team2Name = match.player2_id ? (nameById.get(String(match.player2_id)) ?? null) : null;
      const date = match.scheduled_time ?? match.started_at ?? match.updated_at ?? null;

      return {
        matchNumber: `Round ${match.round} - Match ${match.suggested_play_order ?? match.id}`,
        round: `Round ${match.round}`,
        status: (match.state === "complete" ? "completed" : "scheduled") as MatchStatus,
        phase: input.phase ?? ("qualifiers" as MatchPhase),
        region: input.region ?? ("na" as MatchRegion),
        date: (date ?? new Date().toISOString()).slice(0, 10),
        seasonId: input.seasonId,
        team1Name,
        team2Name,
        team1LogoUrl: team1Name ? (logoByName.get(team1Name.toLowerCase()) ?? null) : null,
        team2LogoUrl: team2Name ? (logoByName.get(team2Name.toLowerCase()) ?? null) : null,
        challongeMatchId: String(match.id),
        challongeTournamentId: input.tournamentId,
        challongeRound: match.round,
        tags: input.tags ?? null,
        ...setScores(match.scores_csv),
      };
    });

  await insertMany(db, matches, rows);
  return { imported: rows.length, skipped: rawMatches.length - rows.length };
}
