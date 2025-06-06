// src/hooks/allDelete.ts

import { useDelete } from "./useDelete";

/**
 * Hook to delete a player by ID:
 *   const { deleteItem, loading, error } = useDeletePlayers();
 *   await deleteItem("123");
 */
export const useDeletePlayers = () => {
  return useDelete("players");
};

/**
 * Hook to delete a team by ID:
 *   const { deleteItem, loading, error } = useDeleteTeams();
 *   await deleteItem("45");
 */
export const useDeleteTeams = () => {
  return useDelete("teams");
};

/**
 * Hook to delete a season by ID:
 *   const { deleteItem, loading, error } = useDeleteSeasons();
 *   await deleteItem("16");
 */
export const useDeleteSeasons = () => {
  return useDelete("seasons");
};

/**
 * Hook to delete a game by ID:
 *   const { deleteItem, loading, error } = useDeleteGames();
 *   await deleteItem("9");
 */
export const useDeleteGames = () => {
  return useDelete("games");
};

/**
 * Hook to delete an article by ID:
 *   const { deleteItem, loading, error } = useDeleteArticles();
 *   await deleteItem("3");
 */
export const useDeleteArticles = () => {
  return useDelete("articles");
};

export const useDeleteUsers = () => {
    return useDelete("users");
  };

  export const useDeleteStats = () => {
    return useDelete("stats");
  };