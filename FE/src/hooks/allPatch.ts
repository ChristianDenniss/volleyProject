// src/hooks/useMutations.ts
import { useCallback } from "react";
import { usePatch } from "./usePatch";
import { authFetch } from "./authFetch";
import { useAuth } from "../context/authContext";

import type {
  Season,
  User,
  Player,
  Team,
  Article,
  Game,
  Stats,
  Award,
  Application,
} from "../types/interfaces";

const backendUrl =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

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

/**
 * Hook returning a `patchStats` fn for updating stats.
 */
export function useStatsMutations() {
  const { patch: patchStats } = usePatch<Stats>("stats");
  return { patchStats };
}

export function useAwardsMutations() {
  const { patch: patchAward } = usePatch<Award>("awards");
  return { patchAward };
}

export function useApplicationMutations() {
  const { token } = useAuth();

  const patchApplication = useCallback(
    async (
      slug: string,
      data: Pick<Application, "url" | "status">
    ): Promise<Application> => {
      if (!token) {
        throw new Error("You must be logged in to update applications");
      }

      const res = await authFetch(
        `${backendUrl}/api/applications/${slug}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
        token
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to update application");
      }

      return res.json() as Promise<Application>;
    },
    [token]
  );

  return { patchApplication };
}

