import { useState } from 'react';
import axios from 'axios';

interface UseLikeArticleReturn {
  likeArticle: (articleId: number) => Promise<void>;
  unlikeArticle: (articleId: number) => Promise<void>;
  toggleLike: (articleId: number, isCurrentlyLiked: boolean) => Promise<void>;
  isLiking: boolean;
  error: string | null;
}

export function useLikeArticle(): UseLikeArticleReturn {
  const [isLiking, setIsLiking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const likeArticle = async (articleId: number): Promise<void> => {
    setIsLiking(true);
    setError(null);

    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to like articles');
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/articles/${articleId}/like`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Article liked successfully:', response.data);
      
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
    } finally {
      setIsLiking(false);
    }
  };

  const unlikeArticle = async (articleId: number): Promise<void> => {
    setIsLiking(true);
    setError(null);

    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to unlike articles');
        return;
      }

      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/articles/${articleId}/like`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Article unliked successfully:', response.data);
      
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
    } finally {
      setIsLiking(false);
    }
  };

  const toggleLike = async (articleId: number, isCurrentlyLiked: boolean): Promise<void> => {
    if (isCurrentlyLiked) {
      await unlikeArticle(articleId);
    } else {
      await likeArticle(articleId);
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