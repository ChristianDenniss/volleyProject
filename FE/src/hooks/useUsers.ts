// src/hooks/useUsers.ts
import { useState, useEffect, useCallback } from "react";
import { authFetch }                        from "./authFetch";
import type { User }                        from "../types/interfaces";

// Custom hook to fetch all users and handle role changes
export const useUsers = () =>
{
    // Store the list of users
    const [ users, setUsers ] = useState<User[] | null>(null);

    // Track loading & error states
    const [ loading, setLoading ] = useState<boolean>(true);
    const [ error,   setError   ] = useState<string | null>(null);

    // Base URL for your backend
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

    // Load users on mount
    useEffect(() =>
    {
        const fetchUsers = async () =>
        {
            try
            {
                // GET /api/admin/users
                const res = await authFetch(`${backendUrl}/api/users`);
                if ( !res.ok )
                {
                    throw new Error(`Error ${res.status}`);
                }

                const data: User[] = await res.json();
                setUsers(data);
            }
            catch (err: any)
            {
                setError(err.message);
            }
            finally
            {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Function to patch a user's role and update local state
    const changeRole = useCallback
    (
        async (id: number, role: User["role"]) =>
        {
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
                }
            );

            if ( !res.ok )
            {
                throw new Error(`Error ${res.status}`);
            }

            const updated: User = await res.json();

            // replace in list
            setUsers((prev) =>
                prev
                ? prev.map((u) => (u.id === updated.id ? updated : u))
                : prev
            );
        },
        []
    );

    return { users, loading, error, changeRole };
};
