// src/hooks/useUsers.ts
import { useState, useCallback, useEffect } from "react";
import { authFetch }             from "./authFetch";
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
    const { token } = useAuth();
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

    const { data, total, totalPages, page, limit, loading, error } =
        usePaginatedFetch<User>("users", params);

    // Local overrides so a role change is reflected instantly without a refetch
    const [overrides, setOverrides] = useState<Record<number, User>>({});
    useEffect(() => { setOverrides({}); }, [data]);

    const users = data.map((u) => overrides[u.id] ?? u);

    // Function to patch a user's role and update local state
    const changeRole = useCallback
    (
        async (id: number, role: User["role"]) =>
        {
            if (!token) {
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
