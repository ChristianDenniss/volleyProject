import { useFetch, useFetchTeamByName, useFetchGameById, useFetchSeasonById, useFetchArticleById, useFetchPlayerById, useObjectFetch } from "./useFetch";
import { Player, Team, Season, Game, Article, Stats, User, Award } from "../types/interfaces";

// Hook to fetch players
export const usePlayers = () => useFetch<Player>("players");

// Hook to fetch teams
export const useTeams = () => useFetch<Team>("teams");

// Hook to fetch seasons
export const useSeasons = () => useFetch<Season>("seasons");

// Hook to fetch users
export const useUsers = () => useFetch<User>("users");

// Hook to fetch games
export const useGames = () => useFetch<Game>("games");

// Hook to fetch stats
export const useStats = () => useFetch<Stats>("stats");

// Hook to fetch articles
export const useArticles = () => useFetch<Article>("articles");

export const useAwards = () => useFetch<Award>("awards");

// Skinny hooks for faster loading without relations
export const useSkinnyTeams = () => useFetch<Team>("teams/skinny");
export const useMediumTeams = () => useFetch<Team>("teams/medium");
export const useSkinnySeasons = () => useFetch<Season>("seasons/skinny");
export const useMediumSeasons = () => useFetch<Season>("seasons/medium");
export const useSkinnyGames = () => useFetch<Game>("games/skinny");
export const useSkinnyAwards = () => useFetch<Award>("awards/skinny");
export const useMediumPlayers = () => useFetch<Player>("players/medium");

export const useSingleArticles = (articleId: string) => useFetchArticleById<Article>(`${articleId}`);

export const useSingleTeam = (teamName: string) => useFetchTeamByName<Team>(`${teamName}`);

export const useSingleGames = (gameId: string) => useFetchGameById<Game>(`${gameId}`);

export const useSingleSeason = (seasonId: string) => useFetchSeasonById<Season>(`${seasonId}`);

export const useSinglePlayer = (playedId: string) => useFetchPlayerById<Player>(`${playedId}`);

export const useSingleAward = (awardId: string) => useObjectFetch<Award>(`awards/${awardId}`);

export const useAwardsByPlayerID = (playerId: string) => useFetch<Award>(`awards/player/${playerId}`);


