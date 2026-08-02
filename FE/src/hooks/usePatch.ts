// src/hooks/useApi.ts
import { useCallback } from "react";
import { authFetch }   from "./authFetch";
import { useAuth } from "../context/authContext";
import { BACKEND_URL } from "../constants/api";

const backendUrl = BACKEND_URL;

export function usePatch<T = any>(resource: string)
{
    const { token, isAuthenticated } = useAuth();
    
    const patch = useCallback(
        async (id: number, data: Partial<T>): Promise<T> =>
        {
            if (!isAuthenticated) {
                throw new Error("You must be logged in to update items");
            }

            const url = `${backendUrl}/api/${resource}/${id}`;

            const res = await authFetch(url, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }, token);

            if (!res.ok)
            {
                let body: any;

                try
                {
                    body = await res.json();
                    console.error("usePatch: error body:", body);
                }
                catch (parseErr)
                {
                    console.error("usePatch: failed to parse error body:", parseErr);
                }

                throw new Error(
                    `PATCH /api/${resource}/${id} failed (${res.status}): ` +
                    (body?.message || JSON.stringify(body) || res.statusText)
                );
            }

            const json = await res.json();
            return json as T;
        },
        [resource, token, isAuthenticated]
    );

    return { patch };
}
