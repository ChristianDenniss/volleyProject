import { useEffect, useState } from "react";
import { authFetch } from "./authFetch";
import { TriviaPlayer, TriviaTeam, TriviaSeason, GuessResult } from "../types/interfaces";


export const useFetch = <T>(endpoint: string) =>
    {
        // Store fetched data
        const [data, setData] = useState<T[] | null>(null);
    
        // Store error message
        const [error, setError] = useState<string | null>(null);
    
        // Store loading state
        const [loading, setLoading] = useState<boolean>(true);
    
        // Base URL (from env or fallback)
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
    
        // Fetch data on mount or when endpoint changes
        useEffect(() =>
        {
            const fetchData = async () =>
            {
                try
                {    
                    // Use authFetch so the bearer token is injected automatically
                    const response = await authFetch(`${backendUrl}/api/${endpoint}`, {
                        method: "GET"
                    });
    
                    if (!response.ok)
                    {
                        throw new Error("Network response was not ok");
                    }
    
                    const result: T[] = await response.json(); // Always assume it's an array
                    setData(result);
                }
                catch (err: any)
                {
                    console.error(`Fetch error [${endpoint}]:`, err);
                    setError(err.message);
                }
                finally
                {
                    setLoading(false);
                }
            };
    
            fetchData();
        }, [endpoint]);
    
        // Return data, loading, and error
        return { data, loading, error };
    };

// Specific hook to fetch a team by name
export const useFetchTeamByName = <T>(teamName: string) =>
{
    return useFetch<T>(`teams/name/${encodeURIComponent(teamName)}`);  // Always treats result as an array
};

export const useFetchGameById = <T>(gameId: string) =>
{
    return useFetch<T>(`games/${gameId}`);  // Always treats result as an array
};

export const useFetchSeasonById = <T>(seasonId: string) =>
{
    return useFetch<T>(`seasons/${seasonId}`);  // Always treats result as an array
};

export const useFetchArticleById = <T>(articleId: string) =>
    {
        return useFetch<T>(`articles/${articleId}`);  // Always treats result as an array
    };

export const useFetchPlayerById = <T>(playerId: string, region?: string) =>
{
    const query = region ? `?region=${region}` : '';
    return useObjectFetch<T>(`players/${playerId}${query}`);
};

export const useObjectFetch = <T>(endpoint: string) =>
{
    // Store fetched object
    const [data, setData] = useState<T | null>(null);

    // Store error
    const [error, setError] = useState<string | null>(null);

    // Store loading state
    const [loading, setLoading] = useState<boolean>(true);

    // Base URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

    // Fetch on mount / endpoint change
    useEffect(() =>
    {
        const fetchData = async () =>
        {
            try
            {
                const response = await authFetch(`${backendUrl}/api/${endpoint}`, {
                    method: "GET"
                });

                if (!response.ok)
                {
                    throw new Error("Network response was not ok");
                }

                const result: T = await response.json(); // ✅ Expecting a single object
                setData(result);
            }
            catch (err: any)
            {
                console.error(`Fetch error [${endpoint}]:`, err);
                setError(err.message);
            }
            finally
            {
                setLoading(false);
            }
        };

        fetchData();
    }, [endpoint]);

    return { data, loading, error };
};

// Trivia hooks
export const useTriviaPlayer = (difficulty: 'easy' | 'medium' | 'hard' | 'impossible') => {
  const [data, setData] = useState<TriviaPlayer | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Base URL (from env or fallback)
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const fetchTriviaPlayer = async () => {
    if (!difficulty) {
      console.error('useTriviaPlayer: difficulty is required');
      setError('Difficulty is required');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const res = await authFetch(`${backendUrl}/api/trivia/player?difficulty=${difficulty}`, {
        method: 'GET'
      });
      
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to fetch trivia player", res.status, errorText);
        throw new Error(`Failed to fetch trivia player: ${res.status} ${res.statusText}`);
      }
      
      const result = await res.json();
      
      setData(result);
      return result;
    } catch (err: any) {
      console.error("useTriviaPlayer fetch failed", err);
      setError(err.message || 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Clear data when difficulty changes
  useEffect(() => {
    setData(null);
    setError(null);
  }, [difficulty]);

  return { data, loading, error, fetchTriviaPlayer };
};

export const useTriviaTeam = (difficulty: 'easy' | 'medium' | 'hard' | 'impossible') => {
  const [data, setData] = useState<TriviaTeam | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Base URL (from env or fallback)
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const fetchTriviaTeam = async () => {
    if (!difficulty) {
      console.error('useTriviaTeam: difficulty is required');
      setError('Difficulty is required');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const res = await authFetch(`${backendUrl}/api/trivia/team?difficulty=${difficulty}`, {
        method: 'GET'
      });
      
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to fetch trivia team", res.status, errorText);
        throw new Error(`Failed to fetch trivia team: ${res.status} ${res.statusText}`);
      }
      
      const result = await res.json();
      
      setData(result);
      return result;
    } catch (err: any) {
      console.error("useTriviaTeam fetch failed", err);
      setError(err.message || 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Clear data when difficulty changes
  useEffect(() => {
    setData(null);
    setError(null);
  }, [difficulty]);

  return { data, loading, error, fetchTriviaTeam };
};

export const useTriviaSeason = (difficulty: 'easy' | 'medium' | 'hard' | 'impossible') => {
  const [data, setData] = useState<TriviaSeason | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Base URL (from env or fallback)
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const fetchTriviaSeason = async () => {
    if (!difficulty) {
      console.error('useTriviaSeason: difficulty is required');
      setError('Difficulty is required');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const res = await authFetch(`${backendUrl}/api/trivia/season?difficulty=${difficulty}`, {
        method: 'GET'
      });
      
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to fetch trivia season", res.status, errorText);
        throw new Error(`Failed to fetch trivia season: ${res.status} ${res.statusText}`);
      }
      
      const result = await res.json();
      
      setData(result);
      return result;
    } catch (err: any) {
      console.error("useTriviaSeason fetch failed", err);
      setError(err.message || 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Clear data when difficulty changes
  useEffect(() => {
    setData(null);
    setError(null);
  }, [difficulty]);

  return { data, loading, error, fetchTriviaSeason };
};

export const useSubmitTriviaGuess = () => {
  const [result, setResult] = useState<GuessResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Base URL (from env or fallback)
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const submitGuess = async (
    type: 'player' | 'team' | 'season',
    id: number,
    guess: string
  ) => {
    
    setLoading(true);
    setError(null);
    
    const requestBody = { type, id, guess };
    
    
    try {
      const res = await authFetch(`${backendUrl}/api/trivia/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to submit trivia guess", res.status, errorText);
        throw new Error(`Failed to submit guess: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      
      setResult(data);
      return data;
    } catch (err: any) {
      console.error("useSubmitTriviaGuess failed", err);
      setError(err.message || 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, submitGuess };
};

