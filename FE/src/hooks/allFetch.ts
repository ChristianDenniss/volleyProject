import { useFetch, useFetchTeamByName, useFetchGameById, useFetchSeasonById, useFetchArticleById, useFetchPlayerById, useObjectFetch } from "./useFetch";
import { Player, Team, Season, Game, Article, Stats, User, Award, Records, TriviaPlayer, TriviaTeam, TriviaSeason, GuessResult } from "../types/interfaces";
import { useState, useEffect } from "react";

// Hook to fetch players
export const usePlayers = () => useFetch<Player>("players");

// Hook to fetch teams
export const useTeams = () => useFetch<Team>("teams");

// Hook to fetch seasons
export const useSeasons = () => useFetch<Season>("seasons");

// Hook to fetch users
export const useUsers = () => useFetch<User>("users");

// Hook to fetch games
export const useGames = () => useFetch<Game>("games");

// Hook to fetch stats
export const useStats = () => useFetch<Stats>("stats");

// Hook to fetch articles
export const useArticles = () => useFetch<Article>("articles");

export const useAwards = () => useFetch<Award>("awards");

// Hook to fetch records
export const useRecords = () => {
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
    const { data, loading, error } = useFetch<Records>(`records?refresh=${refreshTrigger}`);
    
    const refetch = () => setRefreshTrigger((prev: number) => prev + 1);
    
    return { data, loading, error, refetch };
};

// Skinny hooks for faster loading without relations
export const useSkinnyTeams = () => useFetch<Team>("teams/skinny");
export const useMediumTeams = () => useFetch<Team>("teams/medium");
export const useSkinnySeasons = () => useFetch<Season>("seasons/skinny");
export const useMediumSeasons = () => useFetch<Season>("seasons/medium");
export const useSkinnyGames = () => useFetch<Game>("games/skinny");
export const useSkinnyAwards = () => useFetch<Award>("awards/skinny");
export const useMediumPlayers = () => useFetch<Player>("players/medium");

export const useSingleArticles = (articleId: string) => useFetchArticleById<Article>(`${articleId}`);

export const useSingleTeam = (teamName: string) => useFetchTeamByName<Team>(`${teamName}`);

export const useSingleGames = (gameId: string) => useFetchGameById<Game>(`${gameId}`);

export const useSingleSeason = (seasonId: string) => useFetchSeasonById<Season>(`${seasonId}`);

export const useSinglePlayer = (playedId: string) => useFetchPlayerById<Player>(`${playedId}`);

export const useSingleAward = (awardId: string) => useObjectFetch<Award>(`awards/${awardId}`);

export const useAwardsByPlayerID = (playerId: string) => useFetch<Award>(`awards/player/${playerId}`);

export const useTriviaPlayer = (difficulty: 'easy' | 'medium' | 'hard') => {
    const [data, setData] = useState<TriviaPlayer | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    // Clear data when difficulty changes
    useEffect(() => {
      setData(null);
      setError(null);
    }, [difficulty]);
  
    const fetchTriviaPlayer = async () => {
      console.log('🔍 [useTriviaPlayer] Starting fetch with difficulty:', difficulty);
      console.log('🔍 [useTriviaPlayer] API_BASE:', API_BASE);
      
      if (!difficulty) {
        console.error('❌ [useTriviaPlayer] No difficulty provided');
        setError('Difficulty is required');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      const url = `${API_BASE}/api/trivia/player?difficulty=${difficulty}`;
      console.log('🔍 [useTriviaPlayer] Fetching from URL:', url);
      
      try {
        console.log('🔍 [useTriviaPlayer] Making fetch request...');
        const res = await fetch(url);
        
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
  
    return { data, loading, error, fetchTriviaPlayer };
  };
  
  export const useTriviaTeam = (difficulty: 'easy' | 'medium' | 'hard') => {
    const [data, setData] = useState<TriviaTeam | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    // Clear data when difficulty changes
    useEffect(() => {
      setData(null);
      setError(null);
    }, [difficulty]);
  
    const fetchTriviaTeam = async () => {
      console.log('🔍 [useTriviaTeam] Starting fetch with difficulty:', difficulty);
      console.log('🔍 [useTriviaTeam] API_BASE:', API_BASE);
      
      if (!difficulty) {
        console.error('❌ [useTriviaTeam] No difficulty provided');
        setError('Difficulty is required');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      const url = `${API_BASE}/api/trivia/team?difficulty=${difficulty}`;
      console.log('🔍 [useTriviaTeam] Fetching from URL:', url);
      
      try {
        console.log('🔍 [useTriviaTeam] Making fetch request...');
        const res = await fetch(url);
        
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
  
    return { data, loading, error, fetchTriviaTeam };
  };
  
  export const useTriviaSeason = (difficulty: 'easy' | 'medium' | 'hard') => {
    const [data, setData] = useState<TriviaSeason | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    // Clear data when difficulty changes
    useEffect(() => {
      setData(null);
      setError(null);
    }, [difficulty]);
  
    const fetchTriviaSeason = async () => {
      console.log('🔍 [useTriviaSeason] Starting fetch with difficulty:', difficulty);
      console.log('🔍 [useTriviaSeason] API_BASE:', API_BASE);
      
      if (!difficulty) {
        console.error('❌ [useTriviaSeason] No difficulty provided');
        setError('Difficulty is required');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      const url = `${API_BASE}/api/trivia/season?difficulty=${difficulty}`;
      console.log('🔍 [useTriviaSeason] Fetching from URL:', url);
      
      try {
        console.log('🔍 [useTriviaSeason] Making fetch request...');
        const res = await fetch(url);
        
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
  
    return { data, loading, error, fetchTriviaSeason };
  };
  
  export const useSubmitTriviaGuess = () => {
    const [result, setResult] = useState<GuessResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const submitGuess = async (
      type: 'player' | 'team' | 'season',
      id: number,
      guess: string
    ) => {
      console.log('🔍 [useSubmitTriviaGuess] Starting guess submission:', { type, id, guess });
      console.log('🔍 [useSubmitTriviaGuess] API_BASE:', API_BASE);
      
      setLoading(true);
      setError(null);
      
      const requestBody = { type, id, guess };
      const url = `${API_BASE}/api/trivia/guess`;
      
      console.log('🔍 [useSubmitTriviaGuess] Submitting to URL:', url);
      console.log('🔍 [useSubmitTriviaGuess] Request body:', requestBody);
      
      try {
        console.log('🔍 [useSubmitTriviaGuess] Making POST request...');
        const res = await fetch(url, {
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
 