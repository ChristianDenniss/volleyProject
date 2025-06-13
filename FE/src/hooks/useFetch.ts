import { useEffect, useState } from "react";
import { authFetch } from "./authFetch";


export const useFetch = <T>(endpoint: string) =>
    {
        // Store fetched data
        const [data, setData] = useState<T[] | null>(null);
    
        // Store error message
        const [error, setError] = useState<string | null>(null);
    
        // Store loading state
        const [loading, setLoading] = useState<boolean>(true);
    
        // Base URL (from env or fallback)
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
    
        // Fetch data on mount or when endpoint changes
        useEffect(() =>
        {
            const fetchData = async () =>
            {
                try
                {    
                    // Use authFetch so the bearer token is injected automatically
                    const response = await authFetch(`${backendUrl}/api/${endpoint}`, {
                        method: "GET"
                    });
    
                    if (!response.ok)
                    {
                        throw new Error("Network response was not ok");
                    }
    
                    const result: T[] = await response.json(); // Always assume it's an array
                    setData(result);
                }
                catch (err: any)
                {
                    console.error(`Fetch error [${endpoint}]:`, err);
                    setError(err.message);
                }
                finally
                {
                    setLoading(false);
                }
            };
    
            fetchData();
        }, [endpoint]);
    
        // Return data, loading, and error
        return { data, loading, error };
    };

// Specific hook to fetch a team by name
export const useFetchTeamByName = <T>(teamName: string) =>
{
    return useFetch<T>(`teams/name/${teamName}`);  // Always treats result as an array
};

export const useFetchGameById = <T>(gameId: string) =>
{
    console.log(`Use fetch called using games/${gameId}`);
    return useFetch<T>(`games/${gameId}`);  // Always treats result as an array
};

export const useFetchSeasonById = <T>(seasonId: string) =>
{
    console.log(`Use fetch called using seasons/${seasonId}`);
    return useFetch<T>(`seasons/${seasonId}`);  // Always treats result as an array
};

export const useFetchArticleById = <T>(articleId: string) =>
    {
        console.log(`Use fetch called using articles/${articleId}`);
        return useFetch<T>(`articles/${articleId}`);  // Always treats result as an array
    };

export const useFetchPlayerById = <T>(playerId: string) =>
{
    console.log(`Use fetch called using players/${playerId}`);
    return useObjectFetch<T>(`players/${playerId}`);  // Always treats result as an array
};

export const useFetchAwardsById = <T>(playerId: string) =>
{
    console.log(`Use fetch called using awards/player/${playerId}`);
    return useObjectFetch<T>(`awards/player/${playerId}`);  // Always treats result as an array
};

export const useObjectFetch = <T>(endpoint: string) =>
{
    // Store fetched object
    const [data, setData] = useState<T | null>(null);

    // Store error
    const [error, setError] = useState<string | null>(null);

    // Store loading state
    const [loading, setLoading] = useState<boolean>(true);

    // Base URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

    // Fetch on mount / endpoint change
    useEffect(() =>
    {
        const fetchData = async () =>
        {
            try
            {
                const response = await authFetch(`${backendUrl}/api/${endpoint}`, {
                    method: "GET"
                });

                if (!response.ok)
                {
                    throw new Error("Network response was not ok");
                }

                const result: T = await response.json(); // ✅ Expecting a single object
                setData(result);
            }
            catch (err: any)
            {
                console.error(`Fetch error [${endpoint}]:`, err);
                setError(err.message);
            }
            finally
            {
                setLoading(false);
            }
        };

        fetchData();
    }, [endpoint]);

    return { data, loading, error };
};

