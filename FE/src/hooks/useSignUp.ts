// src/hooks/useSignup.ts
import { useState } from "react";

export function useSignup()
{
    // loading + error state
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState<string | null>(null);

    // clear error function
    const clearError = () => setError(null);

    // base URL (env or fallback)
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

    // signup function
    async function signup(username: string, password: string, email: string)
    {
        // reset previous error
        setError(null);

        // show spinner
        setLoading(true);

        try
        {
            // call register endpoint
            const res = await fetch(
                `${backendUrl}/api/users/register`,
                {
                    method: "POST",
                    headers:
                    {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ username, password, email })
                }
            );

            // parse response
            const data = await res.json();

            // API signals error via data.error
            if ((data as any).error)
            {
                throw new Error((data as any).error);
            }

            // if HTTP status not ok, fallback
            if (!res.ok)
            {
                throw new Error((data as any).message || "Signup failed");
            }

            // registration succeeded
            return true;
        }
        catch (err: any)
        {
            // capture & display error
            setError(err.message);
            return false;
        }
        finally
        {
            // hide spinner
            setLoading(false);
        }
    }

    return { signup, loading, error, clearError };
}
