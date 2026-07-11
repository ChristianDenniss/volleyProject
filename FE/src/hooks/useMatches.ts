import type { Match } from '../types/interfaces';
import { usePaginatedFetch, PaginationParams, DEFAULT_PAGINATION } from './usePaginatedFetch';

export interface MatchListParams extends PaginationParams {
  seasonId?: number | string;
  search?: string;
  status?: string;
  round?: string;
}

export const useMatches = (params: MatchListParams = DEFAULT_PAGINATION) => {
  const { seasonId, ...rest } = params;
  const endpoint = seasonId ? `matches/season/${seasonId}` : 'matches';
  return usePaginatedFetch<Match>(endpoint, rest);
};

export const useMatchesByRound = (seasonId: number, round: string, params: PaginationParams = DEFAULT_PAGINATION) => {
  return usePaginatedFetch<Match>(`matches/season/${seasonId}/round/${round}`, params);
};
