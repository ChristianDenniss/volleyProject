// Define Types for Data

import { Url } from "url";

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
}

interface Team 
{
  id: number;
  placement: string;
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
  image?: Url;
  theme: string;
}

interface Article 
{
  id: number;
  title: string;
  content: string;
  author: User;
  createdAt: string; // Date the article was published
  summary: string;
  imageUrl: string; // URL to the article image
  likes: number; // Number of likes
}

interface User 
{
  id: number;
  username: string;
  email: string;
  articles?: Article[]; // Optional articles written by this user
  role: string; // Role of the user (e.g., admin, writer)
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

export type { Game, Player, Stats, Team, Season, Article, User, AuthContextType };
