import { useState } from 'react';
import { useAuth } from '../context/authContext';
import { authFetch } from './authFetch';
import { BACKEND_URL } from '../constants/api';

interface UseLikeArticleReturn {
  likeArticle: (articleId: number) => Promise<boolean>;
  unlikeArticle: (articleId: number) => Promise<boolean>;
  toggleLike: (articleId: number, isCurrentlyLiked: boolean) => Promise<boolean>;
  isLiking: boolean;
  error: string | null;
}

const backendUrl = BACKEND_URL;

export function useLikeArticle(): UseLikeArticleReturn {
  const [isLiking, setIsLiking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, isAuthenticated } = useAuth();

  const likeArticle = async (articleId: number): Promise<boolean> => {
    setIsLiking(true);
    setError(null);

    try {
      if (!isAuthenticated) {
        setError('You must be logged in to like articles');
        return false;
      }

      const response = await authFetch(
        `${backendUrl}/api/articles/${articleId}/like`,
        { method: 'POST', body: JSON.stringify({}) },
        token
      );

      if (!response.ok) {
        if (response.status === 409) {
          setError('You have already liked this article');
        } else if (response.status === 401) {
          setError('You must be logged in to like articles');
        } else {
          const data = await response.json().catch(() => ({}));
          setError(data.message || 'Failed to like article');
        }
        return false;
      }

      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to like article';
      setError(errorMessage);
      console.error('Error liking article:', err);
      return false;
    } finally {
      setIsLiking(false);
    }
  };

  const unlikeArticle = async (articleId: number): Promise<boolean> => {
    setIsLiking(true);
    setError(null);

    try {
      if (!isAuthenticated) {
        setError('You must be logged in to unlike articles');
        return false;
      }

      const response = await authFetch(
        `${backendUrl}/api/articles/${articleId}/like`,
        { method: 'DELETE' },
        token
      );

      if (!response.ok) {
        if (response.status === 409) {
          setError('You have not liked this article');
        } else if (response.status === 401) {
          setError('You must be logged in to unlike articles');
        } else {
          const data = await response.json().catch(() => ({}));
          setError(data.message || 'Failed to unlike article');
        }
        return false;
      }

      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unlike article';
      setError(errorMessage);
      console.error('Error unliking article:', err);
      return false;
    } finally {
      setIsLiking(false);
    }
  };

  const toggleLike = async (articleId: number, isCurrentlyLiked: boolean): Promise<boolean> => {
    if (isCurrentlyLiked) {
      return await unlikeArticle(articleId);
    } else {
      return await likeArticle(articleId);
    }
  };

  return {
    likeArticle,
    unlikeArticle,
    toggleLike,
    isLiking,
    error
  };
}
