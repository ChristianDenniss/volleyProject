// src/hooks/allPatch.ts
import { useCallback } from "react";
import { usePatch } from "./usePatch";
import { authFetch } from "./authFetch";
import { useAuth } from "../context/authContext";

import type {
  Season,
  Player,
  Team,
  Article,
  Game,
  Stats,
  Award,
  Application,
} from "../types/interfaces";
import { BACKEND_URL } from "../constants/api";

const backendUrl = BACKEND_URL;

/**
 * Hook returning a `patchSeason` fn for updating seasons.
 */
export function useSeasonMutations() {
  const { patch: patchSeason } = usePatch<Season>("seasons");
  return { patchSeason };
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

  /**
   * Toggles a team's boolean feature flags (currently only `captainEditEnabled`).
   *
   * These live behind `PATCH /teams/:id/flags` rather than the normal team PATCH, so they
   * need their own request — but it belongs here with the other team mutations, not inline
   * in the portal page that renders the checkbox (CLAUDE.md Rule 3).
   */
  const patchTeamFlags = useCallback(
    async (id: number, flags: { captainEditEnabled?: boolean }): Promise<Partial<Team>> => {
      const response = await authFetch(`${backendUrl}/api/teams/${id}/flags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flags),
      });
      if (!response.ok) throw new Error("Failed to update team flags");
      return (await response.json()) as Partial<Team>;
    },
    [],
  );

  return { patchTeam, patchTeamFlags };
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
  const { token, isAuthenticated } = useAuth();

  const patchApplication = useCallback(
    async (
      slug: string,
      data: Pick<Application, "url" | "status">
    ): Promise<Application> => {
      if (!isAuthenticated) {
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
    [token, isAuthenticated]
  );

  return { patchApplication };
}

