import type { Db } from "@db";
import { insertMany } from "@db/insert";
import {
  articleLikes,
  articles,
  awards,
  awardsPlayers,
  games,
  matches,
  players,
  records,
  seasons,
  stats,
  teams,
  teamsGames,
  teamsPlayers,
  user,
} from "@db/schema";

export const FIXTURES = {
  seasonId: 1,
  otherSeasonId: 2,
  teamId: 1,
  teamName: "Ocean Spikers",
  otherTeamName: "Mountain Blockers",
  playerId: 1,
  playerName: "Ava Nine",
  gameId: 1,
  articleId: 1,
  awardId: 1,
  matchId: 1,
  userId: "fixture-user",
  adminId: "fixture-admin",
  missingId: 999999,
  missingTeamName: "no-such-team",
} as const;

const at = (iso: string) => new Date(iso);

const TEAM_NAMES = [
  FIXTURES.teamName,
  FIXTURES.otherTeamName,
  "Desert Servers",
  "Forest Diggers",
];

const PLAYER_NAMES = [
  FIXTURES.playerName,
  "Bo Reyes",
  "Cass Uduike",
  "Dai Fen",
  "Eli Vance",
  "Fay Oduya",
  "Gus Petrov",
  "Hana Ito",
];

const POSITIONS = ["Setter", "Outside", "Middle", "Libero"];

export async function seed(db: Db): Promise<typeof FIXTURES> {
  await insertMany(db, user, [
    {
      id: FIXTURES.userId,
      name: "fixtureplayer",
      email: "fixtureplayer",
      emailVerified: true,
      role: "user",
      createdAt: at("2026-01-01T00:00:00Z"),
      updatedAt: at("2026-01-01T00:00:00Z"),
    },
    {
      id: FIXTURES.adminId,
      name: "fixtureadmin",
      email: "fixtureadmin",
      emailVerified: true,
      role: "admin",
      createdAt: at("2026-01-01T00:00:00Z"),
      updatedAt: at("2026-01-01T00:00:00Z"),
    },
  ]);

  await insertMany(db, seasons, [
    {
      id: FIXTURES.seasonId,
      seasonNumber: 1,
      startDate: "2026-01-05",
      endDate: "2026-03-30",
      theme: "Inaugural",
      image: "https://images.volleyball4-2.com/seasons/1.png",
    },
    {
      id: FIXTURES.otherSeasonId,
      seasonNumber: 2,
      startDate: "2026-04-06",
      endDate: null,
      theme: "Ascent",
      image: null,
    },
  ]);

  await insertMany(
    db,
    teams,
    TEAM_NAMES.map((name, index) => ({
      id: index + 1,
      name,
      logoUrl: `https://images.volleyball4-2.com/teams/${index + 1}.png`,
      placement: index === 0 ? "Champion" : "Didnt make playoffs",
      seasonId: index < 2 ? FIXTURES.seasonId : FIXTURES.otherSeasonId,
    })),
  );

  await insertMany(
    db,
    players,
    PLAYER_NAMES.map((name, index) => ({
      id: index + 1,
      name,
      position: POSITIONS[index % POSITIONS.length],
    })),
  );

  await insertMany(
    db,
    teamsPlayers,
    PLAYER_NAMES.map((_, index) => ({
      teamId: Math.floor(index / 2) + 1,
      playerId: index + 1,
    })),
  );

  await insertMany(db, games, [
    {
      id: 1,
      name: "Ocean Spikers Vs. Mountain Blockers",
      team1Score: 3,
      team2Score: 1,
      date: "2026-01-12",
      stage: "Winners Bracket; Round of 16",
      videoUrl: "https://www.youtube.com/watch?v=fixture1",
      seasonId: FIXTURES.seasonId,
    },
    {
      id: 2,
      name: "Ocean Spikers Vs. Desert Servers",
      team1Score: 3,
      team2Score: 2,
      date: "2026-01-19",
      stage: "Winners Bracket; Quarter Finals",
      videoUrl: null,
      seasonId: FIXTURES.seasonId,
    },
    {
      id: 3,
      name: "Desert Servers Vs. Forest Diggers",
      team1Score: 0,
      team2Score: 3,
      date: "2026-04-12",
      stage: "Winners Bracket; Round of 16",
      videoUrl: null,
      seasonId: FIXTURES.otherSeasonId,
    },
    {
      id: 4,
      name: "Mountain Blockers Vs. Forest Diggers",
      team1Score: 3,
      team2Score: 0,
      date: "2026-04-19",
      stage: "Finals",
      videoUrl: null,
      seasonId: FIXTURES.otherSeasonId,
    },
  ]);

  await insertMany(db, teamsGames, [
    { teamId: 1, gameId: 1 },
    { teamId: 2, gameId: 1 },
    { teamId: 1, gameId: 2 },
    { teamId: 3, gameId: 2 },
    { teamId: 3, gameId: 3 },
    { teamId: 4, gameId: 3 },
    { teamId: 2, gameId: 4 },
    { teamId: 4, gameId: 4 },
  ]);

  const statRows = [];
  for (let gameId = 1; gameId <= 4; gameId += 1) {
    for (let playerId = 1; playerId <= 4; playerId += 1) {
      const spread = gameId * 3 + playerId;
      statRows.push({
        playerId,
        gameId,
        spikeKills: 10 + spread,
        spikeAttempts: 30 + spread * 2,
        spikingErrors: 2 + (spread % 4),
        apeKills: 4 + (spread % 6),
        apeAttempts: 12 + spread,
        assists: 6 + (spread % 9),
        settingErrors: spread % 3,
        blocks: 3 + (spread % 5),
        blockFollows: 1 + (spread % 4),
        digs: 8 + (spread % 7),
        aces: spread % 6,
        servingErrors: spread % 4,
        miscErrors: spread % 2,
      });
    }
  }
  await insertMany(db, stats, statRows);

  await insertMany(db, awards, [
    {
      id: FIXTURES.awardId,
      type: "MVP",
      description: "Most valuable player of the inaugural season",
      imageUrl: "https://images.volleyball4-2.com/awards/1.png",
      seasonId: FIXTURES.seasonId,
    },
    {
      id: 2,
      type: "Best Blocker",
      description: "Most blocks across the season",
      imageUrl: null,
      seasonId: FIXTURES.otherSeasonId,
    },
  ]);

  await insertMany(db, awardsPlayers, [
    { awardId: 1, playerId: 1 },
    { awardId: 2, playerId: 3 },
  ]);

  await insertMany(db, records, [
    {
      id: 1,
      metric: "spike kills",
      minAttempts: null,
      type: "game",
      rank: 1,
      value: 26,
      date: "2026-01-19",
      seasonId: FIXTURES.seasonId,
      playerId: 4,
      gameId: 2,
    },
    {
      id: 2,
      metric: "spike kills",
      minAttempts: null,
      type: "game",
      rank: 2,
      value: 25,
      date: "2026-01-19",
      seasonId: FIXTURES.seasonId,
      playerId: 3,
      gameId: 2,
    },
    {
      id: 3,
      metric: "spiking percentage",
      minAttempts: 10,
      type: "season",
      rank: 1,
      value: 41.5,
      date: null,
      seasonId: FIXTURES.seasonId,
      playerId: 1,
      gameId: null,
    },
  ]);

  await insertMany(db, matches, [
    {
      id: FIXTURES.matchId,
      matchNumber: "Round 1 - Match 1",
      round: "Round 1",
      status: "completed",
      phase: "qualifiers",
      region: "na",
      date: "2026-01-12",
      team1Name: FIXTURES.teamName,
      team2Name: FIXTURES.otherTeamName,
      team1LogoUrl: "https://images.volleyball4-2.com/teams/1.png",
      team2LogoUrl: "https://images.volleyball4-2.com/teams/2.png",
      team1Score: 3,
      team2Score: 1,
      set1Score: "25-20",
      set2Score: "20-25",
      set3Score: "25-22",
      set4Score: "25-18",
      set5Score: null,
      tags: ["RVL", "Invitational"],
      seasonId: FIXTURES.seasonId,
    },
    {
      id: 2,
      matchNumber: "Semi-Finals - Match 1",
      round: "Semi-Finals",
      status: "scheduled",
      phase: "playoffs",
      region: "eu",
      date: "2026-04-26",
      team1Name: "Desert Servers",
      team2Name: "Forest Diggers",
      team1LogoUrl: null,
      team2LogoUrl: null,
      team1Score: null,
      team2Score: null,
      tags: null,
      seasonId: FIXTURES.otherSeasonId,
    },
  ]);

  await insertMany(db, articles, [
    {
      id: FIXTURES.articleId,
      title: "Ocean Spikers take the opener",
      summary: "A four-set win to start the season.",
      content: "Ocean Spikers opened the inaugural season with a four-set win.",
      imageUrl: "https://images.volleyball4-2.com/articles/1.png",
      approved: true,
      likes: 1,
      authorId: FIXTURES.adminId,
    },
    {
      id: 2,
      title: "Season two preview",
      summary: "What to expect from the Ascent season.",
      content: "Four teams return for a longer schedule.",
      imageUrl: "https://images.volleyball4-2.com/articles/2.png",
      approved: null,
      likes: 0,
      authorId: FIXTURES.userId,
    },
  ]);

  await insertMany(db, articleLikes, [
    { articleId: FIXTURES.articleId, userId: FIXTURES.userId },
  ]);

  return FIXTURES;
}
