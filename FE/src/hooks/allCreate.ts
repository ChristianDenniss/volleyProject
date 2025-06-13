// src/hooks/allCreate.ts

import { useCreate } from "./useCreate";
import { Game,Player,Stats,Team,Season,Article,CreateGameInput,Award, CreateAwardsInput,CreatePlayerInput,
  CreateStatsInput,CreateTeamInput,CreateSeasonInput,CreateArticleInput,} from "../types/interfaces";

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
  const { createItem, loading, error } = useCreate<Game, CreateGameInput>("games");
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
