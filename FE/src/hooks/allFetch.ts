import { useFetchTeamByName, useFetchGameById, useFetchSeasonById, useFetchArticleById, useFetchPlayerById, useObjectFetch, useTriviaPlayer, useTriviaTeam, useTriviaSeason, useSubmitTriviaGuess, useFetch } from "./useFetch";
import { usePaginatedFetch, PaginationParams, DEFAULT_PAGINATION } from "./usePaginatedFetch";
import { Player, Team, Season, Game, Article, Stats, Award, Records, Application, RegionCode } from "../types/interfaces";
import { useState } from "react";

interface RegionListParams {
  region?: RegionCode;
  regionId?: number;
}

interface PlayerListParams extends Partial<PaginationParams>, RegionListParams { search?: string; }
interface TeamListParams extends Partial<PaginationParams>, RegionListParams { search?: string; seasonId?: number | string; }
interface GameListParams extends Partial<PaginationParams>, RegionListParams { search?: string; seasonId?: number | string; stage?: string; status?: string; phase?: string; bracket?: string; }
interface StatListParams extends Partial<PaginationParams>, RegionListParams { search?: string; }
interface AwardListParams extends Partial<PaginationParams>, RegionListParams { search?: string; seasonNumber?: number | string; type?: string; }
interface SeasonListParams extends Partial<PaginationParams>, RegionListParams {}
interface RecordListParams extends Partial<PaginationParams>, RegionListParams {}

export const usePlayers = (params: PlayerListParams = DEFAULT_PAGINATION) => usePaginatedFetch<Player>("players", params);
export const useTeams = (params: TeamListParams = DEFAULT_PAGINATION) => usePaginatedFetch<Team>("teams", params);
export const useSeasons = (params: SeasonListParams = DEFAULT_PAGINATION) => usePaginatedFetch<Season>("seasons", params);
export const useGames = (params: GameListParams = DEFAULT_PAGINATION) => usePaginatedFetch<Game>("games", params);
export const useStats = (params: StatListParams = DEFAULT_PAGINATION) => usePaginatedFetch<Stats>("stats", params);
export const useArticles = (params: PaginationParams = DEFAULT_PAGINATION) => usePaginatedFetch<Article>("articles", params);
export const useAwards = (params: AwardListParams = DEFAULT_PAGINATION) => usePaginatedFetch<Award>("awards", params);

export const useRecords = (params: RecordListParams = DEFAULT_PAGINATION) => {
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
    const result = usePaginatedFetch<Records>("records", { ...params, refresh: refreshTrigger });
    const refetch = () => setRefreshTrigger((prev: number) => prev + 1);
    return { ...result, refetch };
};

export const useApplications = () => useFetch<Application>("applications");

export const useSkinnyTeams = (params: TeamListParams = DEFAULT_PAGINATION) => usePaginatedFetch<Team>("teams/skinny", params);
export const useMediumTeams = (params: TeamListParams = DEFAULT_PAGINATION) => usePaginatedFetch<Team>("teams/medium", params);
export const useSkinnySeasons = (params: SeasonListParams = DEFAULT_PAGINATION) => usePaginatedFetch<Season>("seasons/skinny", params);
export const useMediumSeasons = (params: SeasonListParams = DEFAULT_PAGINATION) => usePaginatedFetch<Season>("seasons/medium", params);
export const useSkinnyGames = (params: GameListParams = DEFAULT_PAGINATION) => usePaginatedFetch<Game>("games/skinny", params);
export const useSkinnyAwards = (params: AwardListParams = DEFAULT_PAGINATION) => usePaginatedFetch<Award>("awards/skinny", params);
export const useMediumPlayers = (params: PlayerListParams = DEFAULT_PAGINATION) => usePaginatedFetch<Player>("players/medium", params);

export const useSingleArticles = (articleId: string) => useFetchArticleById<Article>(`${articleId}`);
export const useSingleTeam = (teamName: string) => useFetchTeamByName<Team>(`${teamName}`);
export const useSingleGames = (gameId: string) => useFetchGameById<Game>(`${gameId}`);
export const useSingleSeason = (seasonId: string) => useFetchSeasonById<Season>(`${seasonId}`);
export const useSinglePlayer = (playedId: string, region?: RegionCode) => useFetchPlayerById<Player>(`${playedId}`, region);
export const useSingleAward = (awardId: string) => useObjectFetch<Award>(`awards/${awardId}`);

export const useAwardsByPlayerID = (playerId: string, region?: RegionCode) =>
    usePaginatedFetch<Award>(`awards/player/${playerId}`, { page: 1, limit: 100, region });

export { useTriviaPlayer, useTriviaTeam, useTriviaSeason, useSubmitTriviaGuess };
