// src/hooks/useBatchPlayersByTeamName.ts

import { useState } from "react";
import { authFetch } from "./authFetch";  
import type { Player } from "../types/interfaces";

/**
 * Payload shape for creating players by team-name:
 * [
 *   { name: "ohfiiire", position: "N/A", teamNames: ["hong kong (s4)"] },
 *   { name: "anotherPlayer", position: "Setter", teamNames: ["team A", "team B"] },
 *   ...
 * ]
 */
export type BatchPlayerByNameInput = Array<{
  name: string;
  position: string;
  teamNames: string[];
}>;

/**
 * Hook to POST a batch of players (matched by team name) to:
 *   POST /api/players/batch/by-team-name
 *
 * Usage:
 *   const { createBatch, loading, error } = useBatchPlayersByTeamName();
 *   const newPlayers: BatchPlayerByNameInput = [
 *     { name: "ohfiiire", position: "N/A", teamNames: ["hong kong (s4)"] },
 *     // ...
 *   ];
 *   const createdPlayers = await createBatch(newPlayers);
 */
export function useBatchPlayersByTeamName() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError]     = useState<string | null>(null);

  async function createBatch(
    payload: BatchPlayerByNameInput
  ): Promise<Player[] | null> {
    setLoading(true);
    setError(null);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
    try {
      const response = await authFetch(
        `${backendUrl}/api/players/batch/by-team-name`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        // try to read error message from JSON
        const errJson = await response
          .json()
          .catch(() => ({ message: "Batch creation failed" }));
        throw new Error(errJson.message || "Batch creation failed");
      }

      // Expecting an array of created Player objects
      const createdPlayers: Player[] = await response.json();
      return createdPlayers;
    } catch (err: any) {
      console.error("BatchCreate error [players/batch/by-team-name]:", err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { createBatch, loading, error };
}
