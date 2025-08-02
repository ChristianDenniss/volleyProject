import { useState, useEffect } from 'react';
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

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = seasonId 
        ? `/api/matches/season/${seasonId}`
        : '/api/matches';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      
      const matches = await response.json();
      setData(matches);
    } catch (err) {
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

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/matches/season/${seasonId}/round/${round}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      
      const matches = await response.json();
      setData(matches);
    } catch (err) {
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