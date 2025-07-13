// src/hooks/allCreate.ts

import { useCreate } from "./useCreate";
import { Game,Player,Stats,Team,Season,Article,CreateGameInput,Award, CreateAwardsInput,CreatePlayerInput,
  CreateStatsInput,CreateTeamInput,CreateSeasonInput,CreateArticleInput, CSVUploadPayload, CSVUploadResult } from "../types/interfaces";
import { useState } from "react";
import { authFetch } from "./authFetch";

/**
 * useCreatePlayers
 * – Enforces CreatePlayerInput
 * – Returns createPlayer(payload) → Promise<Player | null>
 */
export const useCreatePlayers = () => {
  const { createItem, loading, error } = useCreate<Player, CreatePlayerInput>("players");
  return {
    createPlayer: createItem,
    loading,
    error,
  };
};

/**
 * useCreateTeams
 * – Enforces CreateTeamInput
 * – Returns createTeam(payload) → Promise<Team | null>
 */
export const useCreateTeams = () => {
  const { createItem, loading, error } = useCreate<Team, CreateTeamInput>("teams");
  return {
    createTeam: createItem,
    loading,
    error,
  };
};

/**
 * useCreateSeasons
 * – Enforces CreateSeasonInput
 * – Returns createSeason(payload) → Promise<Season | null>
 */
export const useCreateSeasons = () => {
  const { createItem, loading, error } = useCreate<Season, CreateSeasonInput>("seasons");
  return {
    createSeason: createItem,
    loading,
    error,
  };
};

/**
 * useCreateGames
 * – Enforces CreateGameInput
 * – Returns createGame(payload) → Promise<Game | null>
 */
export const useCreateGames = () => {
  const { createItem, loading, error } = useCreate<Game, CreateGameInput>("games/createByNames");
  return {
    createGame: createItem,
    loading,
    error,
  };
};

/**
 * useCreateArticles
 * – Enforces CreateArticleInput
 * – Returns createArticle(payload) → Promise<Article | null>
 */
export const useCreateArticles = () => {
  const { createItem, loading, error } = useCreate<Article, CreateArticleInput>("articles");
  return {
    createArticle: createItem,
    loading,
    error,
  };
};

/**
 * useCreateStats
 * – Enforces CreateStatsInput
 * – Returns createStats(payload) → Promise<Stats | null>
 */
export const useCreateStats = () => {
  const { createItem: createById, loading: loadingById, error: errorById } = useCreate<Stats, CreateStatsInput>("stats");
  const { createItem: createByName, loading: loadingByName, error: errorByName } = useCreate<Stats, CreateStatsInput>("stats/by-name");

  const createStats = async (payload: CreateStatsInput): Promise<Stats | null> => {
    if (payload.playerName) {
      return createByName(payload);
    } else {
      return createById(payload);
    }
  };

  return {
    createStats,
    loading: loadingById || loadingByName,
    error: errorById || errorByName
  };
};

export const useCreateAwards = () => {
  const { createItem: createWithNames, loading: loadingWithNames, error: createErrorWithNames } = useCreate<Award, CreateAwardsInput>("awards/with-names");

  return {
    createAwards: createWithNames,
    loading: loadingWithNames,
    error: createErrorWithNames
  };
};

/**
 * useCSVUpload
 * – Uploads CSV data to create game with teams and stats
 * – Returns uploadCSV(payload) → Promise<CSVUploadResult | null>
 * – Accepts showErrorModal callback for error display
 */
export const useCSVUpload = (showErrorModal?: (err: any) => void) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const uploadCSV = async (payload: CSVUploadPayload): Promise<CSVUploadResult | null> => {
    setLoading(true);
    setError(null);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
    try {
      const response = await authFetch(
        `${backendUrl}/api/stats/batch-csv`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errJson = await response
          .json()
          .catch(() => ({ message: "CSV upload failed" }));
        if (showErrorModal) showErrorModal(errJson.message || errJson.error || "CSV upload failed");
        return null;
      }

      const result: CSVUploadResult = await response.json();
      return result;
    } catch (err: any) {
      if (showErrorModal) showErrorModal(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { uploadCSV, loading, error };
};

/**
 * useAddStatsToExistingGame
 * – Adds stats to an existing game from CSV data
 * – Returns addStatsToGame(payload) → Promise<Stats[] | null>
 * – Accepts showErrorModal callback for error display
 */
export const useAddStatsToExistingGame = (showErrorModal?: (err: any) => void) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const addStatsToGame = async (gameId: number, statsData: any[]): Promise<Stats[] | null> => {
    setLoading(true);
    setError(null);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
    try {
      const response = await authFetch(
        `${backendUrl}/api/stats/add-to-game`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId, statsData }),
        }
      );

      if (!response.ok) {
        const errJson = await response
          .json()
          .catch(() => ({ message: "Failed to add stats to game" }));
        if (showErrorModal) showErrorModal(errJson.message || errJson.error || "Failed to add stats to game");
        return null;
      }

      const result = await response.json();
      return result.stats;
    } catch (err: any) {
      if (showErrorModal) showErrorModal(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { addStatsToGame, loading, error };
};

/**
 * useCalculateRecords
 * – Triggers the backend to recalculate all records
 * – Returns calculateRecords() → Promise<boolean>
 * – Accepts showErrorModal callback for error display
 */
export const useCalculateRecords = (showErrorModal?: (err: any) => void) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const calculateRecords = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
    try {
      const response = await authFetch(
        `${backendUrl}/api/records/calculate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const errJson = await response
          .json()
          .catch(() => ({ message: "Failed to calculate records" }));
        if (showErrorModal) showErrorModal(errJson.message || errJson.error || "Failed to calculate records");
        return false;
      }

      return true;
    } catch (err: any) {
      if (showErrorModal) showErrorModal(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { calculateRecords, loading, error };
};
