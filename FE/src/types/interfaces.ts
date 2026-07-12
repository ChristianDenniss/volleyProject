// Define Types for Data
export type RegionCode = 'na' | 'eu' | 'as';

interface Region {
  id: number;
  code: RegionCode;
  name: string;
  sortOrder?: number;
}

interface Game 
{
  id: number;
  name: string;
  season: Season;
  team1Score: number | null;
  team2Score: number | null;
  videoUrl: string | null;
  date: Date;
  stage: string;
  status: 'scheduled' | 'completed';
  phase?: 'qualifiers' | 'playoffs' | 'pre_season';
  bracket?: 'winners' | 'losers' | null;
  regionId?: number;
  region?: Region;
  set1Score?: string | null;
  set2Score?: string | null;
  set3Score?: string | null;
  set4Score?: string | null;
  set5Score?: string | null;
  challongeMatchId?: string | null;
  challongeTournamentId?: string | null;
  challongeRound?: number | null;
  tags?: string[];
  teams?: Team[];
  winnerTeamId?: number | null;
  winner?: Team | null;
  stats?: Stats[];
}

interface Award
{
  id: number;
  type: string;
  players: Player[];
  description: string;
  season: Season;
  regionId?: number;
  region?: Region;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Player 
{
  id: number;
  name: string;
  position: string;
  teams?: Team[]; 
  stats?: Stats[];
  awards?: Award[];
}
interface Stats
{
    // unique stat ID
    id: number;
    // number of hitting errors
    spikingErrors: number;
    // (you can remove these if unused)
    apeKills: number;
    apeAttempts: number;
    // number of successful spikes
    spikeKills: number;
    // number of spike attempts
    spikeAttempts: number;
    // assists count
    assists: number;
    // setting errors
    settingErrors: number;
    // total blocks
    blocks: number;
    // digs count
    digs: number;
    // block-follow count
    blockFollows: number;
    // aces served
    aces: number;
    // service errors
    servingErrors: number;
    // other misc errors
    miscErrors: number;
    // record timestamps
    createdAt: string;
    updatedAt: string;
    // nested player object
    player: Player;
    playerId: number;
    game: Game;

    // Calculated columns (frontend only)
    totalAttempts?: number;
    totalKills?: number;
    totalSpikingPct?: number;
    totalReceives?: number;
    PRF?: number;
    LRF?: number;
    plusMinus?: number;
}

interface Team 
{
  id: number;
  placement: string;
  name: string;
  logoUrl?: string;
  season: Season;
  regionId?: number;
  region?: Region;
  games?: Game[]; 
  players?: Player[]; 
}

interface Season 
{
  id: number;
  seasonNumber: number;
  games?: Game[]; 
  teams?: Team[]; 
  startDate: Date; 
  endDate?: Date; 
  image?: string;
  theme: string;
  regionId?: number;
  region?: Region;
}

interface Article 
{
  id: number;
  title: string;
  content: string;
  author: User;
  createdAt: string; 
  summary: string;
  imageUrl: string; 
  likes: number;
  approved: boolean | null;
}

type Role = "user" | "admin" | "superadmin"

interface User 
{
  id: number;
  username: string;
  email: string;
  articles?: Article[]; 
  role: Role; 
}

interface Records
{
  id: number;
  record: string;
  type: 'game' | 'season';
  rank: number;
  value: number;
  date: string;
  createdAt: string;
  updatedAt: string;
  season: Season;
  player: Player;
  regionId?: number;
  region?: Region;
  gameId?: number;
}

/** what your AuthContext provides */
 interface AuthContextType 
 {
  user: User | null;
  token: string | null;
  login: (user: User, mockToken?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

interface Application {
  id: number;
  slug: string;
  name: string;
  type: string;
  description: string;
  url: string | null;
  status: "open" | "closed";
  category: "staff" | "media" | "game-officials" | "management";
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export type { Game, Player, Stats, Team, Season, Article, User, Award, Records, AuthContextType, Role, Application, Region };

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}


// When creating a Game, we send primitive fields + foreign IDs.
// We omit nested "season" and "teams" arrays.
export type CreateGameInput = {
  name: string;
  seasonId: number;
  team1Score: number | null;
  team2Score: number | null;
  videoUrl?: string | null;
  date: Date;
  stage: string;
  teamNames: string[];
  status?: 'scheduled' | 'completed';
  phase?: 'qualifiers' | 'playoffs' | 'pre_season';
  bracket?: 'winners' | 'losers' | null;
  region?: RegionCode;
  tags?: string[];
};

export type CreateSeasonInput = {
  seasonNumber: number;
  startDate:    string; 
  endDate?:     string; 
  image?:       string;
  theme:        string;
  regionId?:    number;
  region?:      RegionCode;
};

export type CreateTeamInput = {
  placement: string;
  name:      string;
  seasonNumber: number;
  logoUrl?:  string;
  playerIds?: number[];
  regionId?: number;
  region?: RegionCode;
};

export type CreatePlayerInput = {
  name:     string;
  position: string;
  teamIds?: number[];
};

export type CreateStatsInput = {
  spikingErrors: number;
  apeKills:      number;
  apeAttempts:   number;
  spikeKills:    number;
  spikeAttempts: number;
  assists:       number;
  settingErrors: number;
  blocks:        number;
  digs:          number;
  blockFollows:  number;
  aces:          number;
  servingErrors: number;
  miscErrors:    number;
  playerId?:     number;
  playerName?:   string;
  gameId:        number;
};

// When creating an Article, omit "id" and nested author object; supply userId.
export type CreateArticleInput = {
  title:      string;
  content:    string;
  userId:     number;
  createdAt:  string;
  summary:    string;
  imageUrl:   string;
  likes?:     number;
  approved?:  boolean | null;
};

export type CreateAwardsInput = {
  type:      string;
  playerName: string;
  description: string;
  seasonId:   number;
};

// CSV Upload types
export type CSVGameData = {
  date: string;
  seasonId: number;
  teamNames: string[];
  team1Score: number;
  team2Score: number;
  stage: string;
  videoUrl?: string;
};

export type CSVStatsData = {
  playerName: string;
  spikingErrors?: number;
  apeKills?: number;
  apeAttempts?: number;
  spikeKills?: number;
  spikeAttempts?: number;
  assists?: number;
  settingErrors?: number;
  blocks?: number;
  digs?: number;
  blockFollows?: number;
  aces?: number;
  servingErrors?: number;
  miscErrors?: number;
};

export type CSVUploadPayload = {
  gameData: CSVGameData;
  statsData: CSVStatsData[];
};

export type CSVUploadResult = {
  game: Game;
  stats: Stats[];
};

// Trivia Types
export interface TriviaPlayer {
  id: number;
  name: string;
  position: string;
  teams: Team[];
  awards: Award[];
  stats: Stats[];
  records: Records[];
  difficulty: 'easy' | 'medium' | 'hard' | 'impossible';
  hintCount: number;
}

export interface TriviaTeam {
  id: number;
  name: string;
  placement: string;
  players: Player[];
  games: Game[];
  season: Season;
  difficulty: 'easy' | 'medium' | 'hard' | 'impossible';
  hintCount: number;
}

export interface TriviaSeason {
  id: number;
  seasonNumber: number;
  theme: string;
  startDate: string;
  endDate: string;
  teams: Team[];
  games: Game[];
  awards: Award[];
  records: Records[];
  difficulty: 'easy' | 'medium' | 'hard';
  hintCount: number;
}

export interface Hint {
  text: string;
  level: number;
}

export interface GuessResult {
  correct: boolean;
  answer?: string;
  message: string;
}

export type TriviaData = TriviaPlayer | TriviaTeam | TriviaSeason;

export type ImportChallongeInput = {
  challongeUrl: string;
  seasonId: number;
  round?: string;
  roundStartDate: string;
  roundEndDate: string;
  matchSpacingMinutes?: number;
  phase?: 'qualifiers' | 'playoffs' | 'pre_season';
  region?: RegionCode;
  tags?: string[];
  dryRun?: boolean;
};

export type ChallongeImportResult = {
  success: boolean;
  summary: {
    created: number;
    updated: number;
    skipped: number;
    failed: number;
  };
  details?: {
    created: Array<{ gameId: number; stage: string; team1: string; team2: string }>;
    updated: Array<{ gameId: number; challongeMatchId: string; changedFields: string[] }>;
    skipped: Array<{ challongeMatchId: string; reason: string }>;
  };
  error?: string;
  unmatchedTeams?: Array<{ challongeMatchId: number; participantName: string; reason: string }>;
};
