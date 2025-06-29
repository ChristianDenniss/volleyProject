// Define Types for Data
interface Game 
{
  id: number;
  name: string;
  season: Season;
  team1Score: number;
  team2Score: number;
  videoUrl: string | null;
  date: Date;
  stage: string;
  teams?: Team[]; 
  stats?: Stats[]; 
}

interface Award
{
  id: number;
  type: string;
  players: Player[];
  description: string;
  season: Season;
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
  season: Season;
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

interface User 
{
  id: number;
  username: string;
  email: string;
  articles?: Article[]; 
  role: "user" | "admin" | "superadmin"; 
}

/** what your AuthContext provides */
 interface AuthContextType 
 {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

export type { Game, Player, Stats, Team, Season, Article, User,Award, AuthContextType };


// When creating a Game, we send primitive fields + foreign IDs.
// We omit nested "season" and "teams" arrays.
export type CreateGameInput = {
  name: string;
  seasonId: number;
  team1Score: number;
  team2Score: number;
  videoUrl?: string | null;
  date: Date;
  stage: string;
  teamNames: string[];
};

// When creating a Player, omit "id" and nested arrays.
export type CreatePlayerInput = {
  name:     string;
  position: string;
  teamIds?: number[];
};

// When creating a Stats record, omit "id" and read-only timestamps & nested player.
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
  playerId?:     number;  // Optional for backward compatibility
  playerName?:   string;  // New field for creating by name
  gameId:        number;  // Added gameId which was missing
};

// When creating a Team, omit "id" and nested arrays; supply seasonId instead of Season object.
export type CreateTeamInput = {
  placement: string;
  name:      string;
  seasonId:  number;
  playerIds?: number[];
};

// When creating a Season, omit "id" and nested arrays.
export type CreateSeasonInput = {
  seasonNumber: number;
  startDate:    string; 
  endDate?:     string; 
  image?:       string;
  theme:        string;
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
