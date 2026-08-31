// src/hooks/useUsers.ts
import { useState, useCallback, useEffect, useMemo } from "react";
import { authFetch }             from "./authFetch";
import { BACKEND_URL } from "../constants/api";
import type { User } from "../types/interfaces";
import { useAuth } from "../context/authContext";
import { usePaginatedFetch, PaginationParams, DEFAULT_PAGINATION } from "./usePaginatedFetch";

export interface UserListParams extends PaginationParams {
    search?: string;
    role?: string;
}

// Custom hook to fetch a page of users and handle role changes
export const useUsers = (params: UserListParams = DEFAULT_PAGINATION) =>
{
    const { token, isAuthenticated } = useAuth();
    const backendUrl = BACKEND_URL;

    const { data, total, totalPages, page, limit, loading, error } =
        usePaginatedFetch<User>("users", params);

    // Local overrides so a role change is reflected instantly without a refetch
    const [overrides, setOverrides] = useState<Record<number, User>>({});
    useEffect(() => { setOverrides({}); }, [data]);

    // Stable reference unless data/overrides actually change — callers must not
    // sync this into useEffect-driven local state with [users] as a dependency.
    const users = useMemo(
        () => (data ?? []).map((u) => overrides[u.id] ?? u),
        [data, overrides]
    );

    // Function to patch a user's role and update local state
    const changeRole = useCallback
    (
        async (id: number, role: User["role"]) =>
        {
            if (!isAuthenticated) {
                throw new Error("You must be logged in to change user roles");
            }

            // PATCH /api/admin/users/:id/role
            const res = await authFetch(
                `${backendUrl}/api/admin/users/${id}/role`,
                {
                    method: "PATCH",
                    headers:
                    {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ role }),
                },
                token
            );

            if ( !res.ok )
            {
                throw new Error(`Error ${res.status}`);
            }

            const updated: User = await res.json();
            setOverrides((prev) => ({ ...prev, [updated.id]: updated }));
            return updated;
        },
        [token, backendUrl]
    );

    return { users, total, totalPages, page, limit, loading, error, changeRole };
};
