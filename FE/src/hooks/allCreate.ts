import { useCallback } from "react";
import { authFetch } from "./authFetch";
import type { Game } from "../types/interfaces";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export function useCreateGame() {
  const createGame = useCallback(async (data: Partial<Game>): Promise<Game> => {
    const url = `${backendUrl}/api/games`;
    
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to create game: ${res.statusText}`);
    }

    return res.json();
  }, []);

  return { createGame };
}
