"use client";

import { useSession } from "@/lib/auth-client";

let resolved = false;

function roleIsAdmin(role: unknown) {
  return role === "admin" || role === "superadmin";
}

export function useLiveSession() {
  const { data, isPending } = useSession();
  if (!isPending) resolved = true;

  return {
    user: resolved ? (data?.user ?? null) : undefined,
    isPending: !resolved,
    isSignedIn: resolved ? Boolean(data?.user) : undefined,
    isAdmin: resolved ? roleIsAdmin(data?.user?.role) : undefined,
  };
}
