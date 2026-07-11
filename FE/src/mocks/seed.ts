import type {
  Article,
  Award,
  Game,
  Match,
  Player,
  Records,
  Role,
  Season,
  Stats,
  Team,
  User,
} from "../types/interfaces";

const POSITIONS = ["OH", "OPP", "MB", "S", "L"] as const;

const STAGES = [
  "Regular Season",
  "Winners Bracket; Round of 16",
  "Winners Bracket; Quarterfinals",
  "Winners Bracket; Semifinals",
  "Winners Bracket; Finals",
  "Losers Bracket; Round 1",
  "Losers Bracket; Round 2",
  "Losers Bracket; Round 3",
  "Losers Bracket; Quarterfinals",
  "Losers Bracket; Semifinals",
  "Losers Bracket; Finals",
  "Grand Finals",
  "Grand Finals; Bracket Reset",
  "3rd Place Match",
] as const;

const PLAYER_NAMES = [
  "ace_striker",
  "block_master",
  "set_queen",
  "dig_king",
  "power_spike",
  "serve_bot",
  "net_ghost",
  "floor_general",
  "quick_set",
  "line_shot",
  "cross_court",
  "tip_city",
  "roll_shot",
  "pipe_attack",
  "back_row_bomb",
  "float_serve",
  "jump_serve",
  "tool_master",
  "roof_specialist",
  "passing_ace",
  "clutch_killer",
  "rotation_lock",
  "slide_attack",
  "dumpster_fire",
  "pancake_king",
  "platform_pro",
  "zone_serve",
  "tempo_setter",
  "middle_monster",
  "pin_hitter",
  "serve_receive",
  "transition_king",
  "block_touch",
  "free_ball",
  "overpass_king",
  "joust_winner",
  "cut_shot",
  "tool_off",
  "deep_corner",
  "short_set",
] as const;

const TEAM_NAMES = [
  "Thunder Volley",
  "Skyline Spikers",
  "Coastal Crushers",
  "Legacy Squad",
  "Neon Aces",
  "Midnight Setters",
  "Solar Flare",
  "Iron Net",
  "Crystal Spike",
  "Velocity Vipers",
  "Horizon Hawks",
  "Apex Athletics",
  "Blaze Brigade",
  "Crimson Court",
  "Diamond Diggers",
  "Echo Elite",
] as const;

const PLACEMENTS = [
  "1st Place",
  "2nd Place",
  "3rd Place",
  "4th Place",
  "5th Place",
  "6th Place",
  "7th Place",
  "8th Place",
  "Didn't make playoffs",
  "Group Stage",
] as const;

const AWARD_TYPES = [
  "MVP",
  "Best Spiker",
  "Best Setter",
  "Best Libero",
  "Best Server",
  "Best Blocker",
  "Best Aper",
  "Best Receiver",
  "DPOS",
  "FMVP",
  "MIP",
  "LuvLate Award",
] as const;

const GAME_RECORD_TYPES = [
  "Most Kills in a Game",
  "Most Assists in a Game",
  "Most Digs in a Game",
  "Most Blocks in a Game",
  "Most Aces in a Game",
  "Most Errors in a Game",
] as const;

const SEASON_RECORD_TYPES = [
  "Most Kills in a Season",
  "Most Assists in a Season",
  "Most Digs in a Season",
  "Most Blocks in a Season",
  "Most Aces in a Season",
  "Highest Spike % in a Season",
] as const;

const MATCH_ROUNDS = [
  "Round 1",
  "Round 2",
  "Round 3",
  "Quarterfinals",
  "Semifinals",
  "Finals",
  "Grand Finals",
] as const;

const TAGS = ["RVL", "Playoffs", "Invitational", "D-League", "Showcase"] as const;

const SEASON_THEMES = [
  "Neon Nights",
  "Classic RVL",
  "Solar Eclipse",
  "Midnight Rally",
  "Crystal Crown",
  "Velocity Era",
] as const;

export const MOCK_AUTH_TOKEN = "mock-dev-token";

export const mockAuthUser: User = {
  id: 1,
  username: "mockadmin",
  email: "admin@rvl.mock",
  role: "superadmin",
};

function pick<T>(items: readonly T[], index: number): T {
  return items[index % items.length];
}

function pseudoRandom(seed: number, min: number, max: number): number {
  const value = Math.abs(Math.sin(seed * 12.9898) * 43758.5453);
  return Math.floor(min + (value % 1) * (max - min + 1));
}

function isoDate(year: number, month: number, day: number, hour = 18): string {
  return new Date(Date.UTC(year, month - 1, day, hour, 0, 0)).toISOString();
}

function buildUsers(): User[] {
  const roles: Role[] = ["superadmin", "admin", "admin", "user", "user", "user", "user", "user"];
  const names = [
    "mockadmin",
    "editor",
    "stats_crew",
    "fan123",
    "rvl_writer",
    "coach_mike",
    "analyst_j",
    "viewer_99",
  ];

  return names.map((username, index) => ({
    id: index + 1,
    username,
    email: `${username}@rvl.mock`,
    role: roles[index] ?? "user",
  }));
}

function buildSeasons(): Season[] {
  return Array.from({ length: 6 }, (_, index) => {
    const seasonNumber = 12 - index;
    const startYear = seasonNumber >= 11 ? 2025 : 2024;
    const startMonth = seasonNumber % 2 === 0 ? 1 : 8;

    return {
      id: index + 1,
      seasonNumber,
      theme: pick(SEASON_THEMES, index),
      startDate: new Date(isoDate(startYear, startMonth, 10)),
      endDate: new Date(isoDate(startYear, startMonth + 3, 20)),
      image: `https://placehold.co/600x400/${(100 + index * 20).toString(16).padStart(3, "0")}1e2/e94560?text=Season+${seasonNumber}`,
    };
  });
}

function buildPlayers(): Player[] {
  return PLAYER_NAMES.map((name, index) => ({
    id: index + 1,
    name,
    position: pick(POSITIONS, index),
  }));
}

function buildTeams(seasons: Season[], players: Player[]): Team[] {
  const teams: Team[] = [];
  let teamId = 1;

  seasons.forEach((season, seasonIndex) => {
    const teamCount = season.seasonNumber >= 11 ? 6 : 4;

    for (let i = 0; i < teamCount; i++) {
      const rosterStart = (seasonIndex * 6 + i * 4) % players.length;
      const roster = Array.from({ length: 5 }, (_, j) => players[(rosterStart + j) % players.length]);

      teams.push({
        id: teamId++,
        name: pick(TEAM_NAMES, seasonIndex * 4 + i),
        placement: pick(PLACEMENTS, i),
        logoUrl: `https://placehold.co/64x64/${(200 + teamId * 7).toString(16).slice(0, 3)}/ffffff?text=${encodeURIComponent(pick(TEAM_NAMES, i).slice(0, 2))}`,
        season,
        players: roster,
      });
    }
  });

  return teams;
}

function buildGames(seasons: Season[], teams: Team[]): Game[] {
  const games: Game[] = [];
  let gameId = 1;

  seasons.forEach((season) => {
    const seasonTeams = teams.filter((team) => team.season.id === season.id);
    const gamesPerSeason = season.seasonNumber >= 11 ? 8 : 5;

    for (let i = 0; i < gamesPerSeason; i++) {
      const team1 = seasonTeams[i % seasonTeams.length];
      const team2 = seasonTeams[(i + 1) % seasonTeams.length];
      if (!team1 || !team2) continue;

      const month = 1 + (i % 4);
      const day = 5 + i * 3;

      games.push({
        id: gameId++,
        name: `${team1.name} vs ${team2.name}`,
        season,
        team1Score: pseudoRandom(gameId, 0, 3),
        team2Score: pseudoRandom(gameId + 1, 0, 3),
        videoUrl: i % 3 === 0 ? "https://www.youtube.com/watch?v=jUYJKjPvPoQ" : null,
        date: new Date(isoDate(2025, month, day, 18 + (i % 3))),
        stage: pick(STAGES, i + season.id),
        teams: [team1, team2],
      });
    }
  });

  return games;
}

function buildStats(games: Game[], players: Player[]): Stats[] {
  const stats: Stats[] = [];
  let statId = 1;

  games.forEach((game) => {
    const roster = game.teams?.flatMap((team) => team.players ?? []) ?? [];
    const uniquePlayers = roster.filter(
      (player, index, list) => list.findIndex((p) => p.id === player.id) === index
    );

    uniquePlayers.forEach((player, index) => {
      const seed = statId + player.id + index;
      const spikeAttempts = pseudoRandom(seed, 12, 40);
      const spikeKills = pseudoRandom(seed + 1, 4, Math.max(5, spikeAttempts - 6));
      const assists = player.position === "S" ? pseudoRandom(seed + 2, 12, 38) : pseudoRandom(seed + 2, 0, 4);
      const digs = player.position === "L" ? pseudoRandom(seed + 3, 10, 24) : pseudoRandom(seed + 3, 2, 12);
      const blocks = player.position === "MB" ? pseudoRandom(seed + 4, 3, 10) : pseudoRandom(seed + 4, 0, 4);

      stats.push({
        id: statId++,
        spikingErrors: pseudoRandom(seed + 5, 0, 4),
        apeKills: pseudoRandom(seed + 6, 0, 3),
        apeAttempts: pseudoRandom(seed + 7, 0, 6),
        spikeKills,
        spikeAttempts,
        assists,
        settingErrors: player.position === "S" ? pseudoRandom(seed + 8, 0, 2) : 0,
        blocks,
        digs,
        blockFollows: pseudoRandom(seed + 9, 0, 3),
        aces: pseudoRandom(seed + 10, 0, 5),
        servingErrors: pseudoRandom(seed + 11, 0, 3),
        miscErrors: pseudoRandom(seed + 12, 0, 2),
        createdAt: new Date(game.date).toISOString(),
        updatedAt: new Date(game.date).toISOString(),
        player,
        playerId: player.id,
        game,
      });
    });
  });

  return stats;
}

function attachPlayerRelations(players: Player[], teams: Team[], stats: Stats[]): Player[] {
  return players.map((player) => ({
    ...player,
    teams: teams.filter((team) => team.players?.some((p) => p.id === player.id)),
    stats: stats.filter((stat) => stat.playerId === player.id),
  }));
}

function attachSeasonRelations(seasons: Season[], teams: Team[], games: Game[], matches: Match[]): Season[] {
  return seasons.map((season) => ({
    ...season,
    teams: teams.filter((team) => team.season.id === season.id),
    games: games.filter((game) => game.season.id === season.id),
    matches: matches.filter((match) => match.seasonId === season.id),
  }));
}

function buildArticles(users: User[]): Article[] {
  const titles = [
    "Season 12 Playoffs Begin With a Bang",
    "Rising Star: ace_striker Breaks Records",
    "Draft Preview: Teams to Watch",
    "Grand Finals Preview: Thunder Volley vs Neon Aces",
    "Midseason Power Rankings",
    "Trade Rumors Heat Up Ahead of Deadline",
    "Coach Spotlight: Building a Championship Roster",
    "Stats Deep Dive: Who Owns the Back Row?",
    "Invitational Recap: Upsets Everywhere",
    "Rookie Watch: Five Names to Know",
    "Patch Notes: League Format Changes",
    "Community Vote: Play of the Season",
    "Behind the Scenes: Broadcast Setup",
    "Injury Report: Key Players Returning",
    "Hall of Fame: Legacy Squad Honored",
  ];

  return titles.map((title, index) => ({
    id: index + 1,
    title,
    content: `${title}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
    summary: title.length > 64 ? `${title.slice(0, 61)}...` : title,
    imageUrl: `https://placehold.co/800x450/${(300 + index * 11).toString(16).slice(0, 3)}/f8fafc?text=Article+${index + 1}`,
    likes: pseudoRandom(index + 20, 3, 120),
    approved: index % 4 !== 3,
    createdAt: isoDate(2025, 1 + (index % 6), 1 + index, 12),
    author: users[index % users.length],
  }));
}

function buildAwards(seasons: Season[], players: Player[]): Award[] {
  const awards: Award[] = [];
  let awardId = 1;

  seasons.forEach((season, seasonIndex) => {
    AWARD_TYPES.forEach((type, typeIndex) => {
      const player = players[(seasonIndex * 3 + typeIndex) % players.length];
      awards.push({
        id: awardId++,
        type,
        description: `${type} — Season ${season.seasonNumber}`,
        players: [player],
        season,
        imageUrl: `https://placehold.co/200x200/${(400 + typeIndex * 13).toString(16).slice(0, 3)}/1f2937?text=${encodeURIComponent(type.slice(0, 3))}`,
        createdAt: new Date(season.endDate ?? season.startDate),
        updatedAt: new Date(season.endDate ?? season.startDate),
      });
    });
  });

  return awards;
}

function buildMatches(seasons: Season[], teams: Team[]): Match[] {
  const matches: Match[] = [];
  let matchId = 1;

  seasons.forEach((season) => {
    const seasonTeams = teams.filter((team) => team.season.id === season.id);
    const matchesPerSeason = season.seasonNumber >= 11 ? 14 : 8;

    for (let i = 0; i < matchesPerSeason; i++) {
      const team1 = seasonTeams[i % seasonTeams.length];
      const team2 = seasonTeams[(i + 2) % seasonTeams.length];
      if (!team1 || !team2) continue;

      const completed = i % 3 !== 2;
      const round = pick(MATCH_ROUNDS, i);
      const month = 1 + (i % 5);
      const day = 2 + i * 2;

      matches.push({
        id: matchId++,
        matchNumber: `${round} - Match ${(i % 4) + 1}`,
        status: completed ? "completed" : "scheduled",
        round,
        date: new Date(isoDate(2025, month, day, 17 + (i % 4))),
        team1Score: completed ? pseudoRandom(matchId, 1, 3) : undefined,
        team2Score: completed ? pseudoRandom(matchId + 2, 0, 2) : undefined,
        set1Score: completed ? "25-20" : undefined,
        set2Score: completed ? "23-25" : undefined,
        set3Score: completed ? "25-22" : undefined,
        set4Score: completed && pseudoRandom(matchId, 0, 1) === 1 ? "25-18" : undefined,
        set5Score: completed && pseudoRandom(matchId + 1, 0, 1) === 1 ? "15-13" : undefined,
        seasonId: season.id,
        season,
        team1Name: team1.name,
        team2Name: team2.name,
        team1LogoUrl: team1.logoUrl,
        team2LogoUrl: team2.logoUrl,
        tags: [pick(TAGS, i), pick(TAGS, i + 1)].filter((tag, idx, arr) => arr.indexOf(tag) === idx),
      });
    }
  });

  return matches;
}

function buildRecords(
  seasons: Season[],
  players: Player[],
  games: Game[]
): Records[] {
  const records: Records[] = [];
  let recordId = 1;

  GAME_RECORD_TYPES.forEach((recordType, typeIndex) => {
    for (let rank = 1; rank <= 3; rank++) {
      const player = players[(typeIndex * 2 + rank) % players.length];
      const game = games[(typeIndex + rank) % games.length];
      records.push({
        id: recordId++,
        record: recordType,
        type: "game",
        rank,
        value: pseudoRandom(recordId, 10, 30) + rank,
        date: new Date(game.date).toISOString().slice(0, 10),
        createdAt: isoDate(2025, 2, 1),
        updatedAt: isoDate(2025, 2, 1),
        season: game.season,
        player,
        gameId: game.id,
      });
    }
  });

  SEASON_RECORD_TYPES.forEach((recordType, typeIndex) => {
    for (let rank = 1; rank <= 3; rank++) {
      const season = seasons[typeIndex % seasons.length];
      const player = players[(typeIndex + rank * 3) % players.length];
      records.push({
        id: recordId++,
        record: recordType,
        type: "season",
        rank,
        value: pseudoRandom(recordId, 100, 500) + rank * 10,
        date: new Date(season.endDate ?? season.startDate).toISOString().slice(0, 10),
        createdAt: isoDate(2025, 4, 1),
        updatedAt: isoDate(2025, 4, 1),
        season,
        player,
      });
    }
  });

  return records;
}

export function buildMockDataset() {
  const users = buildUsers();
  const seasons = buildSeasons();
  const playersBase = buildPlayers();
  const teams = buildTeams(seasons, playersBase);
  const games = buildGames(seasons, teams);
  const stats = buildStats(games, playersBase);
  const players = attachPlayerRelations(playersBase, teams, stats);
  const matches = buildMatches(seasons, teams);
  const seasonsWithRelations = attachSeasonRelations(seasons, teams, games, matches);
  const articles = buildArticles(users);
  const awards = buildAwards(seasons, playersBase);
  const records = buildRecords(seasons, playersBase, games);

  return {
    users,
    seasons: seasonsWithRelations,
    players,
    teams,
    games,
    stats,
    articles,
    awards,
    matches,
    records,
  };
}

const dataset = buildMockDataset();

export const mockUsers = dataset.users;
export const mockSeasons = dataset.seasons;
export const mockPlayers = dataset.players;
export const mockTeams = dataset.teams;
export const mockGames = dataset.games;
export const mockStats = dataset.stats;
export const mockArticles = dataset.articles;
export const mockAwards = dataset.awards;
export const mockMatches = dataset.matches;
export const mockRecords = dataset.records;
