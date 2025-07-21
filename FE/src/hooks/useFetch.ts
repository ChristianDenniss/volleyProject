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
    return useFetch<T>(`teams/name/${teamName}`);  // Always treats result as an array
};

export const useFetchGameById = <T>(gameId: string) =>
{
    console.log(`Use fetch called using games/${gameId}`);
    return useFetch<T>(`games/${gameId}`);  // Always treats result as an array
};

export const useFetchSeasonById = <T>(seasonId: string) =>
{
    console.log(`Use fetch called using seasons/${seasonId}`);
    return useFetch<T>(`seasons/${seasonId}`);  // Always treats result as an array
};

export const useFetchArticleById = <T>(articleId: string) =>
    {
        console.log(`Use fetch called using articles/${articleId}`);
        return useFetch<T>(`articles/${articleId}`);  // Always treats result as an array
    };

export const useFetchPlayerById = <T>(playerId: string) =>
{
    console.log(`Use fetch called using players/${playerId}`);
    return useObjectFetch<T>(`players/${playerId}`);  // Always treats result as an array
};

export const useFetchAwardsById = <T>(playerId: string) =>
{
    console.log(`Use fetch called using awards/player/${playerId}`);
    return useObjectFetch<T>(`awards/player/${playerId}`);  // Always treats result as an array
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
export const useTriviaPlayer = (difficulty: 'easy' | 'medium' | 'hard') => {
  const [data, setData] = useState<TriviaPlayer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Base URL (from env or fallback)
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  // Fetch data on mount or when difficulty changes
  useEffect(() => {
    const fetchData = async () => {
      if (!difficulty) {
        console.error('❌ [useTriviaPlayer] No difficulty provided');
        setError('Difficulty is required');
        setLoading(false);
        return;
      }

      console.log('🔍 [useTriviaPlayer] Starting fetch with difficulty:', difficulty);
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔍 [useTriviaPlayer] Making fetch request...');
        const res = await authFetch(`${backendUrl}/api/trivia/player?difficulty=${difficulty}`, {
          method: 'GET'
        });
        
        console.log('🔍 [useTriviaPlayer] Response status:', res.status);
        console.log('🔍 [useTriviaPlayer] Response headers:', Object.fromEntries(res.headers.entries()));
        
        if (!res.ok) {
          console.error('❌ [useTriviaPlayer] Response not OK:', res.status, res.statusText);
          const errorText = await res.text();
          console.error('❌ [useTriviaPlayer] Error response body:', errorText);
          throw new Error(`Failed to fetch trivia player: ${res.status} ${res.statusText}`);
        }
        
        console.log('🔍 [useTriviaPlayer] Parsing JSON response...');
        const result = await res.json();
        console.log('✅ [useTriviaPlayer] Successfully fetched trivia player:', result);
        
        setData(result);
      } catch (err: any) {
        console.error('❌ [useTriviaPlayer] Fetch error:', err);
        console.error('❌ [useTriviaPlayer] Error details:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
        setError(err.message || 'Unknown error');
      } finally {
        console.log('🔍 [useTriviaPlayer] Setting loading to false');
        setLoading(false);
      }
    };

    fetchData();
  }, [difficulty, backendUrl]);

  return { data, loading, error };
};

export const useTriviaTeam = (difficulty: 'easy' | 'medium' | 'hard') => {
  const [data, setData] = useState<TriviaTeam | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Base URL (from env or fallback)
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  // Fetch data on mount or when difficulty changes
  useEffect(() => {
    const fetchData = async () => {
      if (!difficulty) {
        console.error('❌ [useTriviaTeam] No difficulty provided');
        setError('Difficulty is required');
        setLoading(false);
        return;
      }

      console.log('🔍 [useTriviaTeam] Starting fetch with difficulty:', difficulty);
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔍 [useTriviaTeam] Making fetch request...');
        const res = await authFetch(`${backendUrl}/api/trivia/team?difficulty=${difficulty}`, {
          method: 'GET'
        });
        
        console.log('🔍 [useTriviaTeam] Response status:', res.status);
        console.log('🔍 [useTriviaTeam] Response headers:', Object.fromEntries(res.headers.entries()));
        
        if (!res.ok) {
          console.error('❌ [useTriviaTeam] Response not OK:', res.status, res.statusText);
          const errorText = await res.text();
          console.error('❌ [useTriviaTeam] Error response body:', errorText);
          throw new Error(`Failed to fetch trivia team: ${res.status} ${res.statusText}`);
        }
        
        console.log('🔍 [useTriviaTeam] Parsing JSON response...');
        const result = await res.json();
        console.log('✅ [useTriviaTeam] Successfully fetched trivia team:', result);
        
        setData(result);
      } catch (err: any) {
        console.error('❌ [useTriviaTeam] Fetch error:', err);
        console.error('❌ [useTriviaTeam] Error details:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
        setError(err.message || 'Unknown error');
      } finally {
        console.log('🔍 [useTriviaTeam] Setting loading to false');
        setLoading(false);
      }
    };

    fetchData();
  }, [difficulty, backendUrl]);

  return { data, loading, error };
};

export const useTriviaSeason = (difficulty: 'easy' | 'medium' | 'hard') => {
  const [data, setData] = useState<TriviaSeason | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Base URL (from env or fallback)
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  // Fetch data on mount or when difficulty changes
  useEffect(() => {
    const fetchData = async () => {
      if (!difficulty) {
        console.error('❌ [useTriviaSeason] No difficulty provided');
        setError('Difficulty is required');
        setLoading(false);
        return;
      }

      console.log('🔍 [useTriviaSeason] Starting fetch with difficulty:', difficulty);
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔍 [useTriviaSeason] Making fetch request...');
        const res = await authFetch(`${backendUrl}/api/trivia/season?difficulty=${difficulty}`, {
          method: 'GET'
        });
        
        console.log('🔍 [useTriviaSeason] Response status:', res.status);
        console.log('🔍 [useTriviaSeason] Response headers:', Object.fromEntries(res.headers.entries()));
        
        if (!res.ok) {
          console.error('❌ [useTriviaSeason] Response not OK:', res.status, res.statusText);
          const errorText = await res.text();
          console.error('❌ [useTriviaSeason] Error response body:', errorText);
          throw new Error(`Failed to fetch trivia season: ${res.status} ${res.statusText}`);
        }
        
        console.log('🔍 [useTriviaSeason] Parsing JSON response...');
        const result = await res.json();
        console.log('✅ [useTriviaSeason] Successfully fetched trivia season:', result);
        
        setData(result);
      } catch (err: any) {
        console.error('❌ [useTriviaSeason] Fetch error:', err);
        console.error('❌ [useTriviaSeason] Error details:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
        setError(err.message || 'Unknown error');
      } finally {
        console.log('🔍 [useTriviaSeason] Setting loading to false');
        setLoading(false);
      }
    };

    fetchData();
  }, [difficulty, backendUrl]);

  return { data, loading, error };
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
    console.log('🔍 [useSubmitTriviaGuess] Starting guess submission:', { type, id, guess });
    
    setLoading(true);
    setError(null);
    
    const requestBody = { type, id, guess };
    
    console.log('🔍 [useSubmitTriviaGuess] Request body:', requestBody);
    
    try {
      console.log('🔍 [useSubmitTriviaGuess] Making POST request...');
      const res = await authFetch(`${backendUrl}/api/trivia/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('🔍 [useSubmitTriviaGuess] Response status:', res.status);
      console.log('🔍 [useSubmitTriviaGuess] Response headers:', Object.fromEntries(res.headers.entries()));
      
      if (!res.ok) {
        console.error('❌ [useSubmitTriviaGuess] Response not OK:', res.status, res.statusText);
        const errorText = await res.text();
        console.error('❌ [useSubmitTriviaGuess] Error response body:', errorText);
        throw new Error(`Failed to submit guess: ${res.status} ${res.statusText}`);
      }
      
      console.log('🔍 [useSubmitTriviaGuess] Parsing JSON response...');
      const data = await res.json();
      console.log('✅ [useSubmitTriviaGuess] Successfully submitted guess:', data);
      
      setResult(data);
      return data;
    } catch (err: any) {
      console.error('❌ [useSubmitTriviaGuess] Submit error:', err);
      console.error('❌ [useSubmitTriviaGuess] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(err.message || 'Unknown error');
      return null;
    } finally {
      console.log('🔍 [useSubmitTriviaGuess] Setting loading to false');
      setLoading(false);
    }
  };

  return { result, loading, error, submitGuess };
};

