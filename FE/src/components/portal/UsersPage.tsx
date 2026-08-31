// src/pages/UsersPage.tsx
import React, { useState } from "react";
import { useAuth } from "../../context/authContext";
import type { User } from "../../types/interfaces";
import { useUsers } from "../../hooks/useUsers";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import SearchBar from "../Searchbar";
import Pagination from "../Pagination";
import FilterBar from "../ui/FilterBar";
import Table from "../ui/Table";
import "../../styles/PortalPlayersPage.css";
import {
  filterGroup,
  playersControls,
  playersControlsRight,
  portalMain,
  resultsCounter,
  textMuted,
} from "./portalPageStyles";

const USERS_PER_PAGE = 10;
const ALL_ROLES: User["role"][] = ["user", "captain", "vice_captain", "court_captain", "admin", "superadmin"];

const UsersPage: React.FC = () => {
  const { user: me } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [roleFilter, setRoleFilter] = useState<string>("");

  // Role changes apply via overrides in useUsers — no local mirror needed.
  // (Mirroring `users` in an effect infinite-loops: the hook remaps every render.)
  const { users, total, totalPages, loading, error, changeRole } = useUsers({
    page: currentPage,
    limit: USERS_PER_PAGE,
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
  });

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
          return <span className={textMuted}>This is you</span>;
        }

        // 2) If same role as current user:
        if (u.role === me?.role) {
          return (
            <span className={textMuted}>
              Cannot moderate player of same role
            </span>
          );
        }

        // 3) Otherwise, render dropdown of promotable roles:
        const options = ALL_ROLES.filter(
          (r) => u.role !== r && canPromote(u, r)
        );

        if (options.length === 0) {
          return <span className={textMuted}>No actions available</span>;
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
    <div className={portalMain}>
      {/* Search and Controls */}
      <div className={playersControls}>
        <div className={playersControlsRight}>
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
        <div className={filterGroup}>
          <select
            className="filter-select ui-filter-select"
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

      <div className={resultsCounter}>
        Showing {total === 0 ? 0 : ((currentPage - 1) * USERS_PER_PAGE) + 1}-{Math.min(currentPage * USERS_PER_PAGE, total)} of {total} users
      </div>

      <Table columns={columns} rows={users as UserRow[]} rowKey={(row) => row.id} />
    </div>
  );
};

export default UsersPage;
