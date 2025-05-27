// src/hooks/useMutations.ts
import { usePatch } from "./usePatch";

import type {
  Season,
  User,
  Player,
  Team,
  Article,
  Game
} from "../types/interfaces";

/**
 * Hook returning a `patchSeason` fn for updating seasons.
 */
export function useSeasonMutations() {
  const { patch: patchSeason } = usePatch<Season>("seasons");
  return { patchSeason };
}

/**
 * Hook returning a `patchUser` fn for updating users.
 * Adjust the resource path if your endpoint is under `/api/admin/users`.
 */
export function useUserMutations() {
  const { patch: patchUser } = usePatch<User>("users");
  return { patchUser };
}

/**
 * Hook returning a `patchPlayer` fn for updating players.
 */
export function usePlayerMutations() {
  const { patch: patchPlayer } = usePatch<Player>("players");
  return { patchPlayer };
}

/**
 * Hook returning a `patchTeam` fn for updating teams.
 */
export function useTeamMutations() {
  const { patch: patchTeam } = usePatch<Team>("teams");
  return { patchTeam };
}

/**
 * Hook returning a `patchArticle` fn for updating articles.
 */
export function useArticleMutations() {
  const { patch: patchArticle } = usePatch<Article>("articles");
  return { patchArticle };
}

/**
 * Hook returning a `patchGame` fn for updating games.
 */
export function useGameMutations() {
  const { patch: patchGame } = usePatch<Game>("games");
  return { patchGame };
}

// Add more entity‐specific mutation hooks here as needed...
