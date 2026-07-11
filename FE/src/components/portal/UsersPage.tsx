// src/pages/UsersPage.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext";
import type { User } from "../../types/interfaces";
import { useUsers } from "../../hooks/useUsers";
import SearchBar from "../Searchbar";
import Pagination from "../Pagination";
import FilterBar from "../ui/FilterBar";
import Table from "../ui/Table";
import "../../styles/UsersPage.css";
import "../../styles/PortalPlayersPage.css";

const USERS_PER_PAGE = 10;
const ALL_ROLES: User["role"][] = ["user", "admin", "superadmin"];

const UsersPage: React.FC = () => {
  const { user: me } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [roleFilter, setRoleFilter] = useState<string>("");

  const { users, total, totalPages, loading, error, changeRole } = useUsers({
    page: currentPage,
    limit: USERS_PER_PAGE,
    search: searchQuery || undefined,
    role: roleFilter || undefined,
  });

  const [localUsers, setLocalUsers] = useState<User[]>([]);

  useEffect(() => {
    setLocalUsers(users);
  }, [users]);

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
    if (me?.role !== "superadmin") {
      return false;
    }
    if (target.role === "superadmin") return false;
    return target.role !== to;
  };

  // Table requires rows to satisfy Record<string, unknown>; User has no index
  // signature, so widen locally for the shared Table component's generic.
  type UserRow = User & Record<string, unknown>;

  const columns = [
    {
      key: "id",
      header: "ID",
      render: (u: UserRow) => u.id,
    },
    {
      key: "username",
      header: "Name",
      render: (u: UserRow) => u.username,
    },
    {
      key: "role",
      header: "Role",
      render: (u: UserRow) => u.role,
    },
    {
      key: "actions",
      header: "Actions",
      render: (u: UserRow) => {
        // 1) If this is the current user:
        if (u.id === me?.id) {
          return <span className="text-muted">This is you</span>;
        }

        // 2) If same role as current user:
        if (u.role === me?.role) {
          return (
            <span className="text-muted">
              Cannot moderate player of same role
            </span>
          );
        }

        // 3) Otherwise, render dropdown of promotable roles:
        const options = ALL_ROLES.filter(
          (r) => u.role !== r && canPromote(u, r)
        );

        if (options.length === 0) {
          return <span className="text-muted">No actions available</span>;
        }

        return (
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
        );
      },
    },
  ];

  if (loading) return <p>Loading users…</p>;
  if (error)   return <p>Error: {error}</p>;

  return (
    <div className="portal-main">
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
      <FilterBar onReset={clearFilters}>
        <div className="filter-group">
          <select
            className="filter-select"
            aria-label="Role"
            value={roleFilter}
            onChange={(e) => handleRoleFilterChange(e.target.value)}
          >
            <option value="">All Roles</option>
            {ALL_ROLES.map(role => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </FilterBar>

      <div className="results-counter">
        Showing {total === 0 ? 0 : ((currentPage - 1) * USERS_PER_PAGE) + 1}-{Math.min(currentPage * USERS_PER_PAGE, total)} of {total} users
      </div>

      <Table columns={columns} rows={localUsers as UserRow[]} rowKey={(row) => row.id} />
    </div>
  );
};

export default UsersPage;
