import { useFetchTeamByName, useFetchGameById, useFetchSeasonById, useFetchArticleById, useFetchPlayerById, useObjectFetch, useTriviaPlayer, useTriviaTeam, useTriviaSeason, useSubmitTriviaGuess, useFetch } from "./useFetch";
import { usePaginatedFetch, PaginationParams, DEFAULT_PAGINATION } from "./usePaginatedFetch";
import { authFetch } from "./authFetch";
import { useAuth } from "../context/authContext";
import { Player, Team, Season, Game, Article, Stats, Award, Records, Application, RegionCode } from "../types/interfaces";
import { useCallback, useEffect, useState } from "react";

interface RegionListParams {
  region?: RegionCode;
  regionId?: number;
}

interface SortableListParams { sortBy?: string; sortDir?: string; }
interface PlayerListParams extends Partial<PaginationParams>, RegionListParams, SortableListParams { search?: string; seasonId?: number | string; position?: string; }
interface TeamListParams extends Partial<PaginationParams>, RegionListParams, SortableListParams { search?: string; seasonId?: number | string; placement?: string; }
interface GameListParams extends Partial<PaginationParams>, RegionListParams, SortableListParams { search?: string; seasonId?: number | string; stage?: string; status?: string; phase?: string; bracket?: string; }
interface StatListParams extends Partial<PaginationParams>, RegionListParams, SortableListParams { search?: string; }
interface AwardListParams extends Partial<PaginationParams>, RegionListParams, SortableListParams { search?: string; seasonNumber?: number | string; type?: string; }
interface SeasonListParams extends Partial<PaginationParams>, RegionListParams {}
interface RecordListParams extends Partial<PaginationParams>, RegionListParams { type?: string; recordCategory?: string; }
interface LeaderboardListParams extends Partial<PaginationParams>, RegionListParams, SortableListParams {
  search?: string;
  season?: number | string;
  seasonNumber?: number | string;
  stageRound?: string;
  statType?: string;
  view?: string;
  filters?: string;
}
interface ArticleListParams extends Partial<PaginationParams> { status?: 'pending' | 'approved' | 'rejected'; }

export const usePlayers = (params: PlayerListParams = DEFAULT_PAGINATION) => usePaginatedFetch<Player>("players", params);
export const useSeasons = (params: SeasonListParams = DEFAULT_PAGINATION) => usePaginatedFetch<Season>("seasons", params);
export const useGames = (params: GameListParams = DEFAULT_PAGINATION) => usePaginatedFetch<Game>("games", params);
export const useStats = (params: StatListParams = DEFAULT_PAGINATION) => usePaginatedFetch<Stats>("stats", params);
export const useLeaderboard = (params: LeaderboardListParams = DEFAULT_PAGINATION) =>
    usePaginatedFetch<Record<string, unknown>>("stats/leaderboard", params);
export const useArticles = (params: ArticleListParams = DEFAULT_PAGINATION) => usePaginatedFetch<Article>("articles", params);

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

interface GameStagesParams extends RegionListParams { seasonId?: number | string; }

/** Distinct game stage labels for the given filters - backs the stage filter dropdown without fetching a page of games. */
export const useGameStages = (params: GameStagesParams = {}) => {
    const [data, setData] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { token } = useAuth();
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
    const paramsKey = JSON.stringify(params);

    const fetchStages = useCallback(async () => {
        try {
            setLoading(true);
            const query = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "") {
                    query.set(key, String(value));
                }
            });
            const response = await authFetch(`${backendUrl}/api/games/stages?${query.toString()}`, { method: "GET" }, token);
            if (!response.ok) throw new Error("Network response was not ok");
            setData(await response.json());
        } catch (err: any) {
            console.error("Fetch error [games/stages]:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paramsKey, token]);

    useEffect(() => { fetchStages(); }, [fetchStages]);

    return { data, loading, error };
};

export { useTriviaPlayer, useTriviaTeam, useTriviaSeason, useSubmitTriviaGuess };
