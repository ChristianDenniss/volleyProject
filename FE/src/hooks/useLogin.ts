// src/hooks/useLogin.ts
import { useState } from "react";
import { useAuth }  from "../context/authContext";    // ← only if you have AuthContext

export function useLogin() {
  // grab context login if available
  const auth = useAuth?.();                         // ← safe if you haven’t wired context yet

  // loading / error state
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // login fn
  async function login(username: string, password: string) {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"}/api/users/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
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
      setError(err.message);
      return false;
    }
    finally {
      setLoading(false);
    }
  }

  return { login, loading, error };
}
