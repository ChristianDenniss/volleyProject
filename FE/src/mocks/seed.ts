import type {
  Article,
  Award,
  Game,
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
  "Storm Surge",
  "Titan Force",
  "Phoenix Rising",
  "Vortex United",
  "Nova Knights",
  "Granite Guard",
  "Riptide FC",
  "Summit Stars",
] as const;

/** Word pools used to synthesize a large, deterministic pool of player handles. */
const HANDLE_ADJECTIVES = [
  "swift", "iron", "shadow", "turbo", "frost", "blaze", "storm", "night", "royal", "cyber",
  "phantom", "atomic", "laser", "hyper", "mega", "ultra", "nova", "prime", "volt", "ghost",
  "rapid", "steel", "crimson", "golden", "silent", "savage", "cosmic", "electric", "toxic", "lunar",
  "solar", "arctic", "venom", "rogue", "vivid", "onyx", "zephyr", "apex", "wild", "grim",
] as const;

const HANDLE_NOUNS = [
  "spiker", "setter", "blocker", "digger", "server", "ace", "hammer", "rocket", "tornado", "striker",
  "smasher", "wall", "libero", "cannon", "bullet", "phoenix", "dragon", "wolf", "hawk", "viper",
  "titan", "ninja", "samurai", "reaper", "sniper", "bomber", "raptor", "panther", "falcon", "cobra",
  "jet", "comet", "blitz", "surge", "fang", "claw", "wave", "pulse", "edge", "rush",
] as const;

/** How many synthetic players to generate on top of the named handles above. */
const GENERATED_PLAYER_COUNT = 180;

/** Players per team roster. */
const ROSTER_SIZE = 8;

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

const SCHEDULE_START_OFFSET_DAYS = -31;
const SCHEDULE_SPAN_DAYS = 62;

/**
 * Matches per day for the latest season schedule (~2 months).
 * Showcases empty days (0), single-match days, and busy days (up to 6).
 */
const SCHEDULE_DAILY_MATCH_COUNTS = [
  0, 0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1, 0,
  0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6,
  0, 0, 0, 1, 2, 3, 4, 5, 6, 4, 2, 1, 0,
  1, 3, 5, 6, 5, 3, 1, 0, 0, 2, 4, 6, 5, 4, 3, 2, 1, 0, 0, 1, 2, 0,
] as const;

const MATCH_TIME_SLOTS = [
  { hour: 12, minute: 0 },
  { hour: 14, minute: 30 },
  { hour: 16, minute: 0 },
  { hour: 17, minute: 30 },
  { hour: 19, minute: 0 },
  { hour: 21, minute: 30 },
] as const;

const MATCH_ROUNDS = [
  "Round 1",
  "Round 2",
  "Round 3",
  "Round of 16",
  "Quarterfinals",
  "Semifinals",
  "Finals",
  "Grand Finals",
] as const;

function buildGameTags(round: string, slotIndex: number, gameId: number): string[] {
  const bracket = (slotIndex + gameId) % 3 === 0
    ? "Losers Bracket"
    : "Winners Bracket";
  const region = pick(["NA", "EU", "AS", "SA"] as const, gameId);
  const division = pick(["Invitational", "D-League", "Showcase"] as const, slotIndex);

  switch (gameId % 6) {
    case 0:
      return ["RVL", "Playoffs", round, bracket, region, division];
    case 1:
      return ["RVL", "Qualifiers", "Round of 16", round, region, "Exhibition"];
    case 2:
      return ["RVL", "Pre-Season", "Exhibition", round, region];
    case 3:
      return ["RVL", "Playoffs", "Round of 16", bracket, division];
    case 4:
      return ["RVL", "Qualifiers", round];
    default:
      return ["RVL", "Playoffs", round, bracket];
  }
}

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

/** Offset days from a base date at a given local hour/minute (for schedule mock data). */
function addDays(base: Date, days: number, hour: number, minute = 0): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
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
  const players: Player[] = [];
  const usedNames = new Set<string>();

  const addPlayer = (name: string) => {
    if (usedNames.has(name)) return;
    usedNames.add(name);
    players.push({
      id: players.length + 1,
      name,
      position: pick(POSITIONS, players.length),
    });
  };

  // Named handles first (kept for recognizable references elsewhere in the app).
  PLAYER_NAMES.forEach((name) => addPlayer(name));

  // Synthesize a large deterministic pool of additional handles.
  const target = PLAYER_NAMES.length + GENERATED_PLAYER_COUNT;
  let i = 0;
  while (players.length < target) {
    const adjective = HANDLE_ADJECTIVES[i % HANDLE_ADJECTIVES.length];
    const noun =
      HANDLE_NOUNS[(i * 3 + Math.floor(i / HANDLE_ADJECTIVES.length)) % HANDLE_NOUNS.length];
    const combos = HANDLE_ADJECTIVES.length * HANDLE_NOUNS.length;
    const suffix = i >= combos ? `_${Math.floor(i / combos) + 1}` : "";
    addPlayer(`${adjective}_${noun}${suffix}`);
    i += 1;
  }

  return players;
}

function buildTeams(seasons: Season[], players: Player[]): Team[] {
  const teams: Team[] = [];
  let teamId = 1;

  seasons.forEach((season, seasonIndex) => {
    const teamCount = season.seasonNumber >= 11 ? 8 : 6;

    for (let i = 0; i < teamCount; i++) {
      const rosterStart = (seasonIndex * 64 + i * ROSTER_SIZE) % players.length;
      const roster = Array.from(
        { length: ROSTER_SIZE },
        (_, j) => players[(rosterStart + j) % players.length]
      );
      const teamName = pick(TEAM_NAMES, seasonIndex * 8 + i);

      teams.push({
        id: teamId++,
        name: teamName,
        placement: pick(PLACEMENTS, i),
        logoUrl: `https://placehold.co/64x64/${(200 + teamId * 7).toString(16).slice(0, 3)}/ffffff?text=${encodeURIComponent(teamName.slice(0, 2))}`,
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
    let matchIndex = 0;

    // Full round-robin: every team plays every other team once.
    for (let a = 0; a < seasonTeams.length; a++) {
      for (let b = a + 1; b < seasonTeams.length; b++) {
        const team1 = seasonTeams[a];
        const team2 = seasonTeams[b];

        const month = 1 + (matchIndex % 4);
        const day = 1 + ((matchIndex * 3) % 27);

        // Realistic best-of-5 result: winner takes 3 sets, loser 0–2.
        const team1Wins = pseudoRandom(gameId, 0, 1) === 1;
        const loserScore = pseudoRandom(gameId + 2, 0, 2);
        const team1Score = team1Wins ? 3 : loserScore;
        const team2Score = team1Wins ? loserScore : 3;
        const winnerTeamId = team1Wins ? team1.id : team2.id;

        games.push({
          id: gameId++,
          name: `${team1.name} vs ${team2.name}`,
          season,
          team1Score,
          team2Score,
          winnerTeamId,
          videoUrl: matchIndex % 3 === 0 ? "https://www.youtube.com/watch?v=jUYJKjPvPoQ" : null,
          date: new Date(isoDate(2025, month, day, 18 + (matchIndex % 3))),
          stage: pick(STAGES, matchIndex + season.id),
          status: 'completed',
          teams: [team1, team2],
        });

        matchIndex += 1;
      }
    }
  });

  return games;
}

function buildStats(games: Game[], _players: Player[]): Stats[] {
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

function attachSeasonRelations(seasons: Season[], teams: Team[], games: Game[]): Season[] {
  return seasons.map((season) => ({
    ...season,
    teams: teams.filter((team) => team.season.id === season.id),
    games: games.filter((game) => game.season.id === season.id),
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

  // Keep at least 6 approved so home can show 1 featured + 5 side articles.
  const MIN_APPROVED = 6;

  return titles.map((title, index) => {
    const approvalStatus: boolean | null =
      index < MIN_APPROVED
        ? true
        : index % 3 === 0
          ? true
          : index % 3 === 1
            ? null
            : false;

    return {
      id: index + 1,
      title,
      content: `${title}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
      summary: title.length > 64 ? `${title.slice(0, 61)}...` : title,
      imageUrl: `https://placehold.co/800x450/${(300 + index * 11).toString(16).slice(0, 3)}/f8fafc?text=Article+${index + 1}`,
      likes: pseudoRandom(index + 20, 3, 120),
      approved: approvalStatus,
      createdAt: isoDate(2025, 1 + (index % 6), 1 + index, 12),
      author: users[index % users.length],
    };
  });
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

function pickTeamPair(
  teams: Team[],
  dayIndex: number,
  slot: number
): [Team, Team] | null {
  if (teams.length < 2) return null;
  const a = teams[(dayIndex * 3 + slot) % teams.length];
  const b = teams[(dayIndex * 3 + slot + 1 + (slot % 2)) % teams.length];
  if (a.id === b.id) {
    const c = teams[(dayIndex * 3 + slot + 2) % teams.length];
    if (c.id === a.id) return null;
    return [a, c];
  }
  return [a, b];
}

function buildScheduleGameEntry(
  gameId: number,
  season: Season,
  team1: Team,
  team2: Team,
  date: Date,
  completed: boolean,
  slotIndex: number
): Game {
  const round = pick(MATCH_ROUNDS, slotIndex + gameId);
  const tags = buildGameTags(round, slotIndex, gameId);
  const isExhibition = tags.includes("Exhibition");
  const phase: Game["phase"] = isExhibition
    ? undefined
    : tags.includes("Qualifiers")
      ? "qualifiers"
      : "playoffs";
  const stage = isExhibition
    ? "Pre-Season; Exhibition"
    : tags.includes("Qualifiers")
      ? `Qualifiers; ${round}`
      : `${tags[tags.length - 1]}; ${round}`;
  const team1Score = completed ? pseudoRandom(gameId, 1, 3) : null;
  const team2Score = completed ? pseudoRandom(gameId + 2, 0, 2) : null;
  const winnerTeamId =
    team1Score != null && team2Score != null && team1Score !== team2Score
      ? (team1Score > team2Score ? team1.id : team2.id)
      : null;

  return {
    id: gameId,
    name: `${team1.name} vs ${team2.name}`,
    matchNumber: `${round} - Match ${(slotIndex % 4) + 1}`,
    status: completed ? "completed" : "scheduled",
    round,
    phase,
    region: 'na',
    stage,
    date,
    team1Score,
    team2Score,
    winnerTeamId,
    set1Score: completed ? "25-20" : null,
    set2Score: completed ? "23-25" : null,
    set3Score: completed ? "25-22" : null,
    set4Score: completed && pseudoRandom(gameId, 0, 1) === 1 ? "25-18" : null,
    set5Score: completed && pseudoRandom(gameId + 1, 0, 1) === 1 ? "15-13" : null,
    season,
    teams: [team1, team2],
    videoUrl: null,
    tags,
  };
}

function buildLatestSeasonSchedule(
  season: Season,
  seasonTeams: Team[],
  startGameId: number
): Game[] {
  const scheduledGames: Game[] = [];
  let gameId = startGameId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let dayIndex = 0; dayIndex < SCHEDULE_SPAN_DAYS; dayIndex++) {
    const dayOffset = SCHEDULE_START_OFFSET_DAYS + dayIndex;
    const matchesToday =
      SCHEDULE_DAILY_MATCH_COUNTS[dayIndex % SCHEDULE_DAILY_MATCH_COUNTS.length];

    for (let slot = 0; slot < matchesToday; slot++) {
      const pair = pickTeamPair(seasonTeams, dayIndex, slot);
      if (!pair) continue;

      const [team1, team2] = pair;
      const time = MATCH_TIME_SLOTS[slot % MATCH_TIME_SLOTS.length];
      const matchDate = addDays(today, dayOffset, time.hour, time.minute);

      const isPast = dayOffset < 0;
      const isFuture = dayOffset > 0;
      const completed = isPast || (!isFuture && slot % 2 === 0);

      scheduledGames.push(
        buildScheduleGameEntry(gameId++, season, team1, team2, matchDate, completed, slot + dayIndex)
      );
    }
  }

  return scheduledGames;
}

function buildScheduledGames(seasons: Season[], teams: Team[], startGameId: number): Game[] {
  const scheduledGames: Game[] = [];
  let gameId = startGameId;

  seasons.forEach((season, seasonIndex) => {
    const seasonTeams = teams.filter((team) => team.season.id === season.id);
    if (seasonTeams.length < 2) return;

    if (seasonIndex === 0) {
      const schedule = buildLatestSeasonSchedule(season, seasonTeams, gameId);
      scheduledGames.push(...schedule);
      gameId += schedule.length;
      return;
    }

    for (let i = 0; i < 8; i++) {
      const pair = pickTeamPair(seasonTeams, seasonIndex * 10 + i, i);
      if (!pair) continue;
      const [team1, team2] = pair;
      const completed = i % 4 !== 3;
      const matchDate = new Date(
        isoDate(2024 + (seasonIndex % 2), 1 + (i % 10), 1 + ((i * 3) % 26), 17 + (i % 4))
      );

      scheduledGames.push(
        buildScheduleGameEntry(gameId++, season, team1, team2, matchDate, completed, i)
      );
    }
  });

  return scheduledGames;
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

import type { ApplicationForm } from "../types/interfaces";

function buildApplicationForms(): ApplicationForm[] {
  return [
    {
      id: 1,
      slug: "staff",
      name: "Staff Application",
      type: "General Staff Position",
      description:
        "Apply to become a staff member of the Roblox Volleyball League. Help manage the community and ensure smooth operations for each season.",
      url: "https://forms.gle/TgpFMdP8zVmyqKjk6",
      status: "closed",
      category: "staff",
      sortOrder: 1,
    },
    {
      id: 2,
      slug: "media",
      name: "Media Team Application",
      type: "Content Creation & Streaming",
      description:
        "Join our media team to create content, stream RVL matches, manage social media, and help promote the league through various platforms.",
      url: "https://forms.gle/L6QFsuztCaJMRQyp8",
      status: "closed" as const,
      category: "media" as const,
      sortOrder: 2,
    },
    {
      id: 3,
      slug: "referee",
      name: "Referee Application",
      type: "Game Officiating",
      description:
        "Apply to become a RVL referee and help officiate volleyball matches. Ensure fair play and maintain game rules.",
      url: null,
      status: "closed" as const,
      category: "game-officials" as const,
      sortOrder: 3,
    },
    {
      id: 4,
      slug: "moderator",
      name: "Server Moderator Application",
      type: "Community Management",
      description:
        "Help moderate our Discords community spaces, enforce rules, and maintain a positive environment for all members.",
      url: null,
      status: "closed" as const,
      category: "management" as const,
      sortOrder: 4,
    },
    {
      id: 5,
      slug: "game-moderator",
      name: "Game Moderator Application",
      type: "Game Officiating",
      description:
        "Help moderate Volleyball 4.2s ranked games, police rule violations, and fair play enforcement for the playerbase.",
      url: null,
      status: "closed" as const,
      category: "game-officials" as const,
      sortOrder: 5,
    },
    {
      id: 6,
      slug: "stats",
      name: "Stats Team Application",
      type: "Data Management",
      description:
        "Join our stats team to help track player statistics, game data, and maintain accurate records for RVLs playoffs.",
      url: null,
      status: "closed" as const,
      category: "management" as const,
      sortOrder: 6,
    },
    {
      id: 7,
      slug: "host",
      name: "Host Application",
      type: "Event Management",
      description:
        "Apply to become a host and help organize events in games outside of 4.2, and keep the community engaged by hosting casual pickup matches.",
      url: null,
      status: "closed" as const,
      category: "management" as const,
      sortOrder: 7,
    },
  ];
}

export function buildMockDataset() {
  const users = buildUsers();
  const seasons = buildSeasons();
  const playersBase = buildPlayers();
  const teams = buildTeams(seasons, playersBase);
  const games = buildGames(seasons, teams);
  const scheduledGames = buildScheduledGames(seasons, teams, games.length + 1);
  const allGames = [...games, ...scheduledGames];
  // Generate stats for every completed game (regular round-robin + completed schedule games)
  // so single-game and team-total views are fully populated.
  const completedGames = allGames.filter((game) => game.status === "completed");
  const stats = buildStats(completedGames, playersBase);
  const players = attachPlayerRelations(playersBase, teams, stats);
  const seasonsWithRelations = attachSeasonRelations(seasons, teams, allGames);
  const articles = buildArticles(users);
  const awards = buildAwards(seasons, playersBase);
  const records = buildRecords(seasons, playersBase, games);
  const applicationForms = buildApplicationForms();

  return {
    users,
    seasons: seasonsWithRelations,
    players,
    teams,
    games: allGames,
    stats,
    articles,
    awards,
    matches: [],
    records,
    applicationForms,
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
export const mockMatches: never[] = [];
export const mockRecords = dataset.records;
export const mockApplicationForms = dataset.applicationForms;
