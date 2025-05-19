import { useFetch, useFetchTeamByName, useFetchGameById, useFetchSeasonById } from "./useFetch";
import { Player, Team, Season, Game, Article } from "../types/interfaces";

// Hook to fetch players
export const usePlayers = () => useFetch<Player>("players");

// Hook to fetch teams
export const useTeams = () => useFetch<Team>("teams");

// Hook to fetch seasons
export const useSeasons = () => useFetch<Season>("seasons");

// Hook to fetch games
export const useGames = () => useFetch<Game>("games");

//export const useSingleGames = () => useFetch<Game>("games");

// Hook to fetch articles
export const useArticles = () => useFetch<Article>("articles");

export const useSingleTeam = (teamName: string) => useFetchTeamByName<Team>(`${teamName}`);

export const useSingleGames = (gameId: string) => useFetchGameById<Game>(`${gameId}`);

export const useSingleSeason = (seasonId: string) => useFetchSeasonById<Season>(`${seasonId}`);
