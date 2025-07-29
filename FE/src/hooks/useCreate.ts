// src/utils/useCreate.ts

import { useState } from "react";
import { authFetch } from "./authFetch";
import { useAuth } from "../context/authContext";

/**
 * Generic hook to POST a new resource to `${endpoint}`.
 *
 * @template T  – The type of the object returned by the API (e.g. Game, Player, etc.).
 * @template U  – The type of the payload you must send (e.g. CreateGameInput).
 *
 * Usage in a specific hook:
 *   const { createItem, loading, error } = useCreate<Game, CreateGameInput>("games");
 *   const newGame = await createItem({ name: "...", seasonId: 5, ... });
 */
export const useCreate = <T, U>(endpoint: string) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError]     = useState<string | null>(null);
    const { token } = useAuth();

    async function createItem(payload: U): Promise<T | null> {
        setLoading(true);
        setError(null);

        if (!token) {
            setError("You must be logged in to create items");
            return null;
        }

        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
        try {
            console.log('useCreate: Sending payload to', `${backendUrl}/api/${endpoint}:`, payload);
            const response = await authFetch(
                `${backendUrl}/api/${endpoint}`,
                {
                    method:  "POST",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify(payload),
                },
                token
            );

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => ({ message: "Create failed" }));
                console.error('useCreate: Error response:', errorData);
                throw new Error(errorData.message || "Create failed");
            }

            const result: T = await response.json();
            console.log('useCreate: Success response:', result);
            return result;
        } catch (err: any) {
            console.error(`useCreate: Error [${endpoint}]:`, err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }

    return { createItem, loading, error };
};
