import { useState } from 'react';
import axios from 'axios';

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

  const likeArticle = async (articleId: number): Promise<boolean> => {
    setIsLiking(true);
    setError(null);

    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem('authToken_v2');
      
      if (!token) {
        setError('You must be logged in to like articles');
        return false;
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
      // Get the auth token from localStorage
      const token = localStorage.getItem('authToken_v2');
      
      if (!token) {
        setError('You must be logged in to unlike articles');
        return false;
      }

      console.log('Sending unlike request:', { articleId, token: token.substring(0, 10) + '...' });

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
      
      return true;
    } catch (err: any) {
      console.error('Unlike error details:', err.response?.data || err.message);
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