import { useState, useEffect } from 'react';
import { authFetch } from './authFetch';
import type { Match } from '../types/interfaces';

interface UseMatchesReturn {
  data: Match[] | null;
  error: string | null;
  loading: boolean;
  refetch: () => void;
}

export const useMatches = (seasonId?: number): UseMatchesReturn => {
  const [data, setData] = useState<Match[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Base URL (from env or fallback)
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = seasonId 
        ? `matches/season/${seasonId}`
        : 'matches';
      
      // Use authFetch so the bearer token is injected automatically
      const response = await authFetch(`${backendUrl}/api/${endpoint}`, {
        method: "GET"
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      
      const matches = await response.json();
      setData(matches);
    } catch (err) {
      console.error('Fetch error [matches]:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [seasonId]);

  return { data, error, loading, refetch: fetchMatches };
};

export const useMatchesByRound = (seasonId: number, round: string): UseMatchesReturn => {
  const [data, setData] = useState<Match[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Base URL (from env or fallback)
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use authFetch so the bearer token is injected automatically
      const response = await authFetch(`${backendUrl}/api/matches/season/${seasonId}/round/${round}`, {
        method: "GET"
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      
      const matches = await response.json();
      setData(matches);
    } catch (err) {
      console.error('Fetch error [matches by round]:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (seasonId && round) {
      fetchMatches();
    }
  }, [seasonId, round]);

  return { data, error, loading, refetch: fetchMatches };
}; 