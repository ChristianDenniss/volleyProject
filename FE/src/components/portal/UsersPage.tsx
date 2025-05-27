// src/pages/UsersPage.tsx
import React from "react";
import { useAuth } from "../../context/authContext";
import type { User } from "../../types/interfaces";
import { useUsers } from "../../hooks/useUsers";
import "../../styles/UsersPage.css";

const UsersPage: React.FC = () => {
  const { user: me } = useAuth();
  const { users, loading, error, changeRole } = useUsers();

  const canPromote = (target: User, to: User["role"]) => {
    if (me?.role === "admin") {
      return target.role === "user" && to === "admin";
    }
    if (me?.role === "superadmin") {
      if (target.role === "superadmin") return false;
      if (target.role === "admin" && to === "user") return true;
      return true;
    }
    return false;
  };

  const ALL_ROLES: User["role"][] = ["user", "admin", "superadmin"];

  if (loading) return <p>Loading users…</p>;
  if (error)   return <p>Error: {error}</p>;

  return (
    <div className="portal-main">
      <h1 className="users-title">Users</h1>
      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users!.map((u) => {
            // 1) If this is the current user:
            if (u.id === me?.id) {
              return (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.role}</td>
                  <td>
                    <span className="text-muted">This is you</span>
                  </td>
                </tr>
              );
            }

            // 2) If same role as current user:
            if (u.role === me?.role) {
              return (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.role}</td>
                  <td>
                    <span className="text-muted">
                      Cannot moderate player of same role
                    </span>
                  </td>
                </tr>
              );
            }

            // 3) Otherwise, render dropdown of promotable roles:
            const options = ALL_ROLES.filter(
              (r) => u.role !== r && canPromote(u, r)
            );

            return (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.role}</td>
                <td>
                  {options.length > 0 ? (
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const newRole = e.target.value as User["role"];
                        if (
                          newRole &&
                          window.confirm(
                            `Are you sure you want to change ${u.username}'s role to "${newRole}"?`
                          )
                        ) {
                          changeRole(u.id, newRole);
                        }
                        e.currentTarget.value = "";
                      }}
                    >
                      <option value="" disabled hidden>
                        Change role…
                      </option>
                      {options.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-muted">No actions available</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UsersPage;
