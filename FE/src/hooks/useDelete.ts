// src/utils/useDelete.ts

import { useState } from "react";
import { authFetch } from "./authFetch";

/**
 * Generic hook to DELETE a resource at `${endpoint}/{id}`.
 * Returns `true` on success, `null` on error.
 */
export const useDelete = (endpoint: string) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError]     = useState<string | null>(null);

    /**
     * Sends a DELETE to `/api/${endpoint}/${id}`.
     * @param id  The string ID of the item to delete.
     * @returns   `true` on success, `null` on failure.
     */
    const deleteItem = async (id: string): Promise<true | null> => {
        setLoading(true);
        setError(null);

        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
        try {
            const response = await authFetch(
                `${backendUrl}/api/${endpoint}/${id}`,
                { method: "DELETE" }
            );

            if (!response.ok) {
                // Try to read JSON error if present
                const errData = await response
                    .json()
                    .catch(() => ({ message: "Delete failed" }));
                throw new Error(errData.message || "Delete failed");
            }

            // If the backend returned 204 No Content or empty body, just return true.
            // We do NOT call response.json() because there may be no JSON.
            return true;
        } catch (err: any) {
            console.error(`Delete error [${endpoint}/${id}]:`, err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { deleteItem, loading, error };
};
