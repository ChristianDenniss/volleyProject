// src/pages/UsersPage.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext";
import type { User } from "../../types/interfaces";
import { useUsers } from "../../hooks/useUsers";
import SearchBar from "../Searchbar";
import Pagination from "../Pagination";
import "../../styles/UsersPage.css";

const UsersPage: React.FC = () => {
  const { user: me } = useAuth();
  const { users, loading, error, changeRole } = useUsers();

  // Local state for search and pagination
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const usersPerPage = 10;

  // Filter state
  const [roleFilter, setRoleFilter] = useState<string>("");

  // Update local state when users data changes
  useEffect(() => {
    if (users) setLocalUsers(users);
  }, [users]);

  // Get unique roles for filter options
  const uniqueRoles = Array.from(new Set(localUsers.map(user => user.role))).sort();

  // Filter users based on search query (username) and role
  const filteredUsers = localUsers.filter(user => {
    const matchesSearch = user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
    const matchesRole = !roleFilter || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle role filter change
  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("");
    setCurrentPage(1);
  };

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

      {/* Search and Controls */}
      <div className="players-controls">
        <div className="players-controls-right">
          <SearchBar onSearch={handleSearch} placeholder="Search users..." />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container" style={{ 
        marginTop: "1rem", 
        padding: "1rem", 
        backgroundColor: "#f8f9fa", 
        borderRadius: "0.5rem",
        display: "flex",
        gap: "1rem",
        alignItems: "center",
        flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontWeight: "bold", minWidth: "60px" }}>Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => handleRoleFilterChange(e.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: "0.25rem",
              border: "1px solid #ccc",
              minWidth: "120px"
            }}
          >
            <option value="">All Roles</option>
            {uniqueRoles.map(role => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {(searchQuery || roleFilter) && (
          <button
            onClick={clearFilters}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.25rem",
              background: "#6c757d",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem"
            }}
          >
            Clear Filters
          </button>
        )}

        <div style={{ marginLeft: "auto", fontSize: "0.875rem", color: "#6c757d" }}>
          Showing {((currentPage - 1) * usersPerPage) + 1}-{Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
        </div>
      </div>

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
          {paginatedUsers.map((u) => {
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
