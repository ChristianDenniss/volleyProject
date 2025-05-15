// Define Types for Data

interface Game 
{
  id: number;
  name: string;
  title: string;
  season: Season;
  team1Score: number;
  team2Score: number;
  date: Date;
  teams?: Team[]; // IDs of teams
  stats?: Stats[]; // Optional stats
}

interface Player 
{
  id: number;
  name: string;
  position: string;
  teams?: Team[]; // Optional list of team names
  stats?: Stats[]; // Optional stats
}

interface Stats 
{
  id: number;
  gameId: Game; // ID of the game
  playerBelongingTo: Player; // ID of the player
  spikingErrors: number;
  apeKills: number;
  apeAttempts: number;
  spikeKills: number;
  spikeAttempts: number;
  assists: number;
  blocks: number;
  digs: number;
  blockFollows: number;
  aces: number;
  miscErrors: number;
  serveErrors: number;
}

interface Team 
{
  id: number;
  name: string;
  season: Season;
  games?: Game[]; // Optional games played by this team
  players?: Player[]; // Optional players in this team
}

interface Season 
{
  id: number;
  seasonNumber: number;
  games?: Game[]; // Optional games in this season
  teams?: Team[]; // Optional teams in this season
  startDate: Date; // Date when the season starts
  endDate?: Date; // Optional end date
}

interface Article 
{
  id: number;
  title: string;
  content: string;
  author: User;
  date: string; // Date the article was published
  summary: string;
  imageUrl: string; // URL to the article image
  likes: number; // Number of likes
}

interface User 
{
  id: number;
  username: string;
  email: string;
  password: string;
  articles?: Article[]; // Optional articles written by this user
  role: string; // Role of the user (e.g., admin, writer)
}

export type { Game, Player, Stats, Team, Season, Article, User };
