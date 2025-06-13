// src/hooks/useLogin.ts
import { useState, useRef } from "react";
import { useAuth } from "../context/authContext";    // ← only if you have AuthContext

export function useLogin() {
  // grab context login if available
  const auth = useAuth?.();                         // ← safe if you haven't wired context yet

  // loading / error state
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // login fn
  async function login(username: string, password: string) {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
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
          signal: abortControllerRef.current.signal
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      // save token
      localStorage.setItem("authToken", data.token);

      // save user object
      localStorage.setItem("currentUser", JSON.stringify(data.user));

      // if you have an AuthContext, inform it too
      auth?.login(data.token, data.user);

      return true;
    }
    catch (err: any) {
      // Only set error if it's not an abort error
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
