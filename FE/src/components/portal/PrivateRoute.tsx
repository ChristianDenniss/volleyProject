// src/components/PrivateRoute.tsx
import React from "react";
import { useAuth } from "../../context/authContext";
import type { User } from "../../types/interfaces";

type AllowedRole = Extract<User["role"], "admin" | "superadmin">;

interface PrivateRouteProps {
  roles: AllowedRole[];
  children: React.ReactNode;
}

/**  
 * Renders its children **only** when the logged-in user's role is in `roles`.  
 * Otherwise it renders nothing—no redirects, no flashes.  
 */
export default function PrivateRoute({ roles, children }: PrivateRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;                       // Wait for context init
  if (!isAuthenticated || !user) return null;     // Not logged in
  if (!roles.includes(user.role as AllowedRole)) return null; // Wrong role

  return children;                                // Authorized → show content
}
