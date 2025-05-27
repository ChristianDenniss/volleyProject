// src/hooks/useApi.ts
import { useCallback } from "react";
import { authFetch }   from "./authFetch";

const backendUrl =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export function usePatch<T = any>(resource: string)
{
    const patch = useCallback(
        async (id: number, data: Partial<T>): Promise<T> =>
        {
            const url = `${backendUrl}/api/${resource}/${id}`;

            // Log the URL and outgoing payload
            console.log("usePatch: PATCH →", url, "payload:", data);

            const res = await authFetch(url, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            // Log the raw status
            console.log(`usePatch: received status ${res.status} for PATCH ${url}`);

            if (!res.ok)
            {
                let body: any;

                try
                {
                    // Parse and log full error body
                    body = await res.json();
                    console.error("usePatch: error body:", body);

                    // If Zod returned multiple issues, log each one
                    if (Array.isArray(body.errors))
                    {
                        body.errors.forEach((issue: any) =>
                            console.error(
                                `usePatch: Validation issue at ${issue.path.join(".")}: ${issue.message}`
                            )
                        );
                    }
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

            // On success, parse and log the response payload
            const json = await res.json();
            console.log("usePatch: success:", json);

            return json as T;
        },
        [resource]
    );

    return { patch };
}
