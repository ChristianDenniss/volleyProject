import { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { authFetch } from './authFetch';
import { BACKEND_URL } from '../constants/api';

interface UseLikeStatusReturn {
  hasLiked: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const backendUrl = BACKEND_URL;

export function useLikeStatus(articleId: number): UseLikeStatusReturn {
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, isAuthenticated } = useAuth();

  const fetchLikeStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isAuthenticated) {
        setHasLiked(false);
        setLoading(false);
        return;
      }

      const response = await authFetch(
        `${backendUrl}/api/articles/${articleId}/like-status`,
        { method: 'GET' },
        token
      );

      if (!response.ok) {
        throw new Error('Failed to fetch like status');
      }

      const data = await response.json() as { hasLiked: boolean };
      setHasLiked(data.hasLiked);
    } catch (err: unknown) {
      console.error('Error fetching like status:', err);
      setError('Failed to fetch like status');
      setHasLiked(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikeStatus();
  }, [articleId, isAuthenticated]);

  const refetch = () => {
    fetchLikeStatus();
  };

  return {
    hasLiked,
    loading,
    error,
    refetch
  };
}
