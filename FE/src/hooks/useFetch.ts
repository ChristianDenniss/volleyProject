import { useEffect, useState } from "react";

// Generic hook to fetch any type of data
export const useFetch = <T>(endpoint: string) =>
{
    // Store fetched data
    const [data, setData] = useState<T[] | null>(null);

    // Store error message
    const [error, setError] = useState<string | null>(null);

    // Store loading state
    const [loading, setLoading] = useState<boolean>(true);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";


    // Fetch data on mount
    useEffect(() =>
    {
        const fetchData = async () =>
        {
            try
            {
                console.log(`Fetching data from ${backendUrl}/api/${endpoint}`);
                const response = await fetch(`${backendUrl}/api/${endpoint}`);

                if (!response.ok)
                {
                    throw new Error("Network response was not ok");
                }

                const result: T[] = await response.json(); // Always assume it's an array
                setData(result);
                setLoading(false);
            }
            catch (err: any)
            {
                console.error(`Fetch error [${endpoint}]:`, err);
                setError(err.message);
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


