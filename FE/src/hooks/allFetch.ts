import { useFetchTeamByName, useFetchGameById, useFetchSeasonById, useFetchArticleById, useFetchPlayerById, useObjectFetch, useTriviaPlayer, useTriviaTeam, useTriviaSeason, useSubmitTriviaGuess } from "./useFetch";
import { usePaginatedFetch, PaginationParams } from "./usePaginatedFetch";
import { Player, Team, Season, Game, Article, Stats, Award, Records } from "../types/interfaces";
import { useState } from "react";

interface PlayerListParams extends PaginationParams { search?: string; }
interface TeamListParams extends PaginationParams { search?: string; seasonId?: number | string; }
interface GameListParams extends PaginationParams { search?: string; seasonId?: number | string; stage?: string; }
interface StatListParams extends PaginationParams { search?: string; }
interface AwardListParams extends PaginationParams { search?: string; seasonNumber?: number | string; type?: string; }

// Hook to fetch players
export const usePlayers = (params: PlayerListParams) => usePaginatedFetch<Player>("players", params);

// Hook to fetch teams
export const useTeams = (params: TeamListParams) => usePaginatedFetch<Team>("teams", params);

// Hook to fetch seasons
export const useSeasons = (params: PaginationParams) => usePaginatedFetch<Season>("seasons", params);

// Hook to fetch games
export const useGames = (params: GameListParams) => usePaginatedFetch<Game>("games", params);

// Hook to fetch stats
export const useStats = (params: StatListParams) => usePaginatedFetch<Stats>("stats", params);

// Hook to fetch articles
export const useArticles = (params: PaginationParams) => usePaginatedFetch<Article>("articles", params);

export const useAwards = (params: AwardListParams) => usePaginatedFetch<Award>("awards", params);

// Hook to fetch records
export const useRecords = (params: PaginationParams) => {
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
    const result = usePaginatedFetch<Records>("records", { ...params, refresh: refreshTrigger });

    const refetch = () => setRefreshTrigger((prev: number) => prev + 1);

    return { ...result, refetch };
};

import { useMatches } from "./useMatches";

// Hook to fetch matches
export { useMatches };

// Skinny hooks for faster loading without relations
export const useSkinnyTeams = (params: TeamListParams) => usePaginatedFetch<Team>("teams/skinny", params);
export const useMediumTeams = (params: TeamListParams) => usePaginatedFetch<Team>("teams/medium", params);
export const useSkinnySeasons = (params: PaginationParams) => usePaginatedFetch<Season>("seasons/skinny", params);
export const useMediumSeasons = (params: PaginationParams) => usePaginatedFetch<Season>("seasons/medium", params);
export const useSkinnyGames = (params: GameListParams) => usePaginatedFetch<Game>("games/skinny", params);
export const useSkinnyAwards = (params: AwardListParams) => usePaginatedFetch<Award>("awards/skinny", params);
export const useMediumPlayers = (params: PlayerListParams) => usePaginatedFetch<Player>("players/medium", params);

export const useSingleArticles = (articleId: string) => useFetchArticleById<Article>(`${articleId}`);

export const useSingleTeam = (teamName: string) => useFetchTeamByName<Team>(`${teamName}`);

export const useSingleGames = (gameId: string) => useFetchGameById<Game>(`${gameId}`);

export const useSingleSeason = (seasonId: string) => useFetchSeasonById<Season>(`${seasonId}`);

export const useSinglePlayer = (playedId: string) => useFetchPlayerById<Player>(`${playedId}`);

export const useSingleAward = (awardId: string) => useObjectFetch<Award>(`awards/${awardId}`);

// Not paginated in the UI - fetch a generous single page since a player's awards are always a short list
export const useAwardsByPlayerID = (playerId: string) =>
    usePaginatedFetch<Award>(`awards/player/${playerId}`, { page: 1, limit: 100 });

// Trivia hooks
export { useTriviaPlayer, useTriviaTeam, useTriviaSeason, useSubmitTriviaGuess };
