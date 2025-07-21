import { useState } from 'react';
import { TriviaPlayer, TriviaTeam, TriviaSeason, GuessResult } from '../types/interfaces';

const API_BASE = import.meta.env.VITE_BACKEND_URL || "https://api.volleyball4-2.com";

export const useTriviaPlayer = (difficulty: 'easy' | 'medium' | 'hard') => {
  const [data, setData] = useState<TriviaPlayer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTriviaPlayer = async () => {
    if (!difficulty) {
      setError('Difficulty is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/trivia/player?difficulty=${difficulty}`);
      if (!res.ok) throw new Error('Failed to fetch trivia player');
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchTriviaPlayer };
};

export const useTriviaTeam = (difficulty: 'easy' | 'medium' | 'hard') => {
  const [data, setData] = useState<TriviaTeam | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTriviaTeam = async () => {
    if (!difficulty) {
      setError('Difficulty is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/trivia/team?difficulty=${difficulty}`);
      if (!res.ok) throw new Error('Failed to fetch trivia team');
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchTriviaTeam };
};

export const useTriviaSeason = (difficulty: 'easy' | 'medium' | 'hard') => {
  const [data, setData] = useState<TriviaSeason | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTriviaSeason = async () => {
    if (!difficulty) {
      setError('Difficulty is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/trivia/season?difficulty=${difficulty}`);
      if (!res.ok) throw new Error('Failed to fetch trivia season');
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
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
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/trivia/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, guess })
      });
      if (!res.ok) throw new Error('Failed to submit guess');
      const data = await res.json();
      setResult(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, submitGuess };
}; 