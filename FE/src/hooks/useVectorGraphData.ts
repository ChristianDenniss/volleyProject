// src/hooks/useVectorGraphData.ts

import { useEffect, useState } from "react";
import { authFetch } from "./authFetch";
import type { Player, Season } from "../types/interfaces";

/**
 * Hook to fetch all players with their stats (includes game and season relations)
 * This is needed for vectorization which requires stats with game.season data
 */
export const useFetchPlayersWithStats = () => {
  const [data, setData] = useState<Player[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await authFetch(`${backendUrl}/api/players`, {
          method: "GET"
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const result: Player[] = await response.json();
        setData(result);
      } catch (err: any) {
        console.error("Fetch error [players]:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

/**
 * Hook to fetch all seasons
 * Used for the season selector dropdown
 */
export const useFetchSeasons = () => {
  const [data, setData] = useState<Season[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await authFetch(`${backendUrl}/api/seasons`, {
          method: "GET"
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const result: Season[] = await response.json();
        setData(result);
      } catch (err: any) {
        console.error("Fetch error [seasons]:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

