// src/hooks/useUsers.ts
import { useState, useEffect, useCallback } from "react";
import { authFetch }                        from "./authFetch";
import type { User }                        from "../types/interfaces";
import { useAuth } from "../context/authContext";

// Custom hook to fetch all users and handle role changes
export const useUsers = () =>
{
    // Store the list of users
    const [ users, setUsers ] = useState<User[] | null>(null);

    // Track loading & error states
    const [ loading, setLoading ] = useState<boolean>(true);
    const [ error,   setError   ] = useState<string | null>(null);
    const { token } = useAuth();

    // Base URL for your backend
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

    // Load users on mount
    useEffect(() =>
    {
        const fetchUsers = async () =>
        {
            try
            {
                if (!token) {
                    setError("You must be logged in to fetch users");
                    setLoading(false);
                    return;
                }

                // GET /api/admin/users
                const res = await authFetch(`${backendUrl}/api/users`, {}, token);
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
