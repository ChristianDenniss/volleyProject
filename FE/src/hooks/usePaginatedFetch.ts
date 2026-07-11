import { useCallback, useEffect, useState } from "react";
import { authFetch } from "./authFetch";
import { useAuth } from "../context/authContext";
import type { PaginatedResponse } from "../types/interfaces";

export interface PaginationParams {
    page: number;
    limit: number;
    [filterKey: string]: string | number | undefined;
}

export const DEFAULT_PAGINATION: PaginationParams = { page: 1, limit: 100 };

/**
 * Fetches one page of a paginated list endpoint, rebuilding the query string
 * (and refetching) whenever the endpoint or any param changes.
 */
export const usePaginatedFetch = <T>(
    endpoint: string,
    params: Partial<PaginationParams> = DEFAULT_PAGINATION
) => {
    const mergedParams: PaginationParams = { ...DEFAULT_PAGINATION, ...params };
    const [data, setData] = useState<T[] | undefined>(undefined);
    const [total, setTotal] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { token } = useAuth();

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

    // Stable key so the effect only re-runs when a param value actually changes
    const paramsKey = JSON.stringify(params);
    const [refreshCount, setRefreshCount] = useState(0);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            const query = new URLSearchParams();
            Object.entries(mergedParams).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "") {
                    query.set(key, String(value));
                }
            });

            const response = await authFetch(
                `${backendUrl}/api/${endpoint}?${query.toString()}`,
                { method: "GET" },
                token
            );

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const result: PaginatedResponse<T> = await response.json();
            setData(result.data);
            setTotal(result.total);
            setTotalPages(result.totalPages);
        } catch (err: any) {
            console.error(`Paginated fetch error [${endpoint}]:`, err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [endpoint, paramsKey, token]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshCount]);

    const refetch = useCallback(() => setRefreshCount((c) => c + 1), []);

    return { data, total, totalPages, page: mergedParams.page, limit: mergedParams.limit, loading, error, refetch };
};
