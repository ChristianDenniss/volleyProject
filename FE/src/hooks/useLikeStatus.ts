import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/authContext';

interface UseLikeStatusReturn {
  hasLiked: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLikeStatus(articleId: number): UseLikeStatusReturn {
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchLikeStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!token) {
        setHasLiked(false);
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/articles/${articleId}/like-status`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setHasLiked((response.data as { hasLiked: boolean }).hasLiked);
    } catch (err: any) {
      console.error('Error fetching like status:', err);
      setError('Failed to fetch like status');
      setHasLiked(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikeStatus();
  }, [articleId, token]);

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