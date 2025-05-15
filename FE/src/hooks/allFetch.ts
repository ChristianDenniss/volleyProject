import { useFetch, useFetchTeamByName, useFetchGameById } from "./useFetch";
import { Player, Team, Season, Game, Article } from "../types/interfaces";

// Hook to fetch players
export const usePlayers = () => useFetch<Player>("players");

// Hook to fetch teams
export const useTeams = () => useFetch<Team>("teams");

// Hook to fetch seasons
export const useSeasons = () => useFetch<Season>("seasons");

// Hook to fetch games
export const useGames = () => useFetch<Game>("games");

// Hook to fetch articles
export const useArticles = () => useFetch<Article>("articles");

export const useSingleTeam = (teamName: string) => useFetchTeamByName<Team>(`${teamName}`);

export const useSingleGame = (gameId: string) => useFetchGameById<Game>(`${gameId}`);
