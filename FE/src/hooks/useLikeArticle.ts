import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/authContext';

interface UseLikeArticleReturn {
  likeArticle: (articleId: number) => Promise<boolean>;
  unlikeArticle: (articleId: number) => Promise<boolean>;
  toggleLike: (articleId: number, isCurrentlyLiked: boolean) => Promise<boolean>;
  isLiking: boolean;
  error: string | null;
}

export function useLikeArticle(): UseLikeArticleReturn {
  const [isLiking, setIsLiking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const likeArticle = async (articleId: number): Promise<boolean> => {
    setIsLiking(true);
    setError(null);

    try {
      if (!token) {
        setError('You must be logged in to like articles');
        return false;
      }

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/articles/${articleId}/like`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return true;
    } catch (err: any) {
      let errorMessage = 'Failed to like article';
      
      if (err.response) {
        if (err.response.status === 409) {
          errorMessage = 'You have already liked this article';
        } else if (err.response.status === 401) {
          errorMessage = 'You must be logged in to like articles';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
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
      if (!token) {
        setError('You must be logged in to unlike articles');
        return false;
      }

      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/articles/${articleId}/like`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return true;
    } catch (err: any) {
      let errorMessage = 'Failed to unlike article';
      
      if (err.response) {
        if (err.response.status === 409) {
          errorMessage = 'You have not liked this article';
        } else if (err.response.status === 401) {
          errorMessage = 'You must be logged in to unlike articles';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
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
