// src/hooks/useLogin.ts
import { useState, useRef } from "react";
import { useAuth } from "../context/authContext";
import { isMockMode } from "../utils/authStorage";

export function useLogin() {
  const auth = useAuth?.();

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  async function login(username: string, password: string) {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"}/api/users/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
          credentials: "include",
          signal: abortControllerRef.current.signal
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Login failed");

      auth?.login(data.user, isMockMode ? data.token : undefined);

      return true;
    }
    catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || "Failed to connect to server. Please try again.");
      }
      return false;
    }
    finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }

  return { login, loading, error };
}
