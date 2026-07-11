// src/components/PrivateRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import type { User } from "../../types/interfaces";

type AllowedRole = Extract<User["role"], "admin" | "superadmin">;

interface PrivateRouteProps {
  roles: AllowedRole[];
  children: React.ReactNode;
}

export default function PrivateRoute({ roles, children }: PrivateRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role as AllowedRole)) return <Navigate to="/" replace />;

  return children;
}
