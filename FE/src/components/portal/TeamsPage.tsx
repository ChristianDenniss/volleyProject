// src/components/portal/TeamsPage.tsx

import React, { useState, useEffect } from "react";
import { useSkinnyTeams, useSkinnySeasons } from "../../hooks/allFetch";
import { useTeamMutations } from "../../hooks/allPatch";
import { useCreateTeams } from "../../hooks/allCreate";
import { useDeleteTeams } from "../../hooks/allDelete";
import { useAuth } from "../../context/authContext";
import type { Team } from "../../types/interfaces";
import "../../styles/PlayersPage.css";
import "../../styles/PortalPlayersPage.css";
import SearchBar from "../Searchbar";
import Pagination from "../Pagination";
import Modal from "../ui/Modal";
import FilterBar from "../ui/FilterBar";
import Table, { type TableColumn } from "../ui/Table";

type EditField =
  | "name"
  | "seasonNumber"
  | "placement"
  | "logoUrl";

interface EditingState {
  id: number;
  field: EditField;
  value: string;
}

interface TeamTableColumn extends TableColumn<Team> {}

const TEAMS_PER_PAGE = 10;

const TeamsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filter state
  const [seasonFilter, setSeasonFilter] = useState<string>("");

  const { data: teams, total, totalPages, loading, error, refetch } = useSkinnyTeams({
    page: currentPage,
    limit: TEAMS_PER_PAGE,
    search: searchQuery || undefined,
    seasonId: seasonFilter || undefined,
  });
  const { data: seasons } = useSkinnySeasons({ page: 1, limit: 100 });
  const { patchTeam } = useTeamMutations();
  const { createTeam, loading: creating, error: createError } = useCreateTeams();
  const { deleteItem: deleteTeam, loading: deleting, error: deleteError } = useDeleteTeams();
  const { user } = useAuth();

  const [localTeams, setLocalTeams] = useState<Team[]>([]);
  const [editing, setEditing] = useState<EditingState | null>(null);

  // Modal state for creating a new team
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [newSeasonNumber, setNewSeasonNumber] = useState<number>(0);
  const [newPlacement, setNewPlacement] = useState<string>("Didn't make playoffs");
  const [newLogoUrl, setNewLogoUrl] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  useEffect(() => {
    setLocalTeams(teams);
  }, [teams]);

  // Season filter options come from the full seasons list, not just this page's teams
  const uniqueSeasons = (seasons ?? [])
    .map(season => season.id)
    .sort((a, b) => a - b);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle season filter change
  const handleSeasonFilterChange = (value: string) => {
    setSeasonFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSeasonFilter("");
    setCurrentPage(1);
  };

  // Commit inline edits
  const commitEdit = async () => {
    if (!editing) return;
    const { id, field, value } = editing;
    const orig = localTeams.find((t) => t.id === id);
    if (!orig) {
      setEditing(null);
      return;
    }

    let origValue: string;
    switch (field) {
      case "name": origValue = orig.name; break;
      case "seasonNumber": origValue = orig.season.seasonNumber.toString(); break;
      case "placement": origValue = orig.placement; break;
      case "logoUrl": origValue = orig.logoUrl || ""; break;
      default: origValue = "";
    }
    if (value === origValue) {
      setEditing(null);
      return;
    }

    const labelMap: Record<EditField, string> = {
      name: "Name",
      seasonNumber: "Season Number",
      placement: "Placement",
      logoUrl: "Logo URL",
    };
    if (
      !window.confirm(
        `Change ${labelMap[field]} from "${origValue}" to "${value}"?`
      )
    ) {
      setEditing(null);
      return;
    }

    // Build payload
    const payload: Partial<Team> & Record<string, any> = {};
    switch (field) {
      case "name": payload.name = value; break;
      case "seasonNumber": payload.seasonNumber = Number(value); break;
      case "placement": payload.placement = value; break;
      case "logoUrl": payload.logoUrl = value.trim() === "" ? undefined : value.trim(); break;
    }

    try {
      const updated = await patchTeam(id, payload);
      setLocalTeams((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
      );
      refetch();
    } catch (err: any) {
      console.error(err);
      alert("Failed to save changes:\n" + err.message);
    } finally {
      setEditing(null);
    }
  };

  // Delete handler (superadmin only)
  const handleDelete = async (id: number) => {
    if (user?.role !== "superadmin") return;
    if (!window.confirm("Are you sure you want to delete this team?")) return;

    const wasDeleted = await deleteTeam(id.toString());
    if (wasDeleted) {
      setLocalTeams((prev) => prev.filter((t) => t.id !== id));
      refetch();
    }
  };

  // Open "Create Team" modal
  const openModal = () => {
    setIsModalOpen(true);
    setFormError("");
    setNewName("");
    setNewSeasonNumber(0);
    setNewPlacement("Didn't make playoffs");
    setNewLogoUrl("");
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setFormError("");
  };

  // Create new team handler
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() === "" || newSeasonNumber <= 0) {
      setFormError("Name and Season Number are required.");
      return;
    }

    const payload = {
      name: newName,
      seasonNumber: newSeasonNumber,
      placement: newPlacement,
      logoUrl: newLogoUrl.trim() || undefined, // Only include if not empty
    };

    try {
      const created = await createTeam(payload);
      if (created) {
        setLocalTeams((prev) => [created, ...prev]);
        refetch();
        closeModal();
      }
    } catch {
      // Hook will expose createError if any
    }
  };

  const columns: TeamTableColumn[] = [
    {
      key: "id",
      header: "ID",
      render: (t) => t.id,
    },
    {
      key: "name",
      header: "Name",
      render: (t) => (
        <div
          style={{ cursor: "pointer" }}
          onClick={() => setEditing({ id: t.id, field: "name", value: t.name })}
        >
          {editing?.id === t.id && editing.field === "name" ? (
            <input
              type="text"
              value={editing.value}
              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setEditing(null);
              }}
              autoFocus
            />
          ) : (
            t.name
          )}
        </div>
      ),
    },
    {
      key: "seasonNumber",
      header: "Season",
      render: (t) => (
        <div
          className="small-column"
          style={{ cursor: "pointer" }}
          onClick={() =>
            setEditing({ id: t.id, field: "seasonNumber", value: t.season.seasonNumber.toString() })
          }
        >
          {editing?.id === t.id && editing.field === "seasonNumber" ? (
            <input
              type="number"
              min="1"
              value={editing.value}
              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setEditing(null);
              }}
              autoFocus
            />
          ) : (
            t.season.seasonNumber
          )}
        </div>
      ),
    },
    {
      key: "placement",
      header: "Placement",
      render: (t) => (
        <div
          style={{ cursor: "pointer" }}
          onClick={() => setEditing({ id: t.id, field: "placement", value: t.placement })}
        >
          {editing?.id === t.id && editing.field === "placement" ? (
            <input
              type="text"
              value={editing.value}
              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setEditing(null);
              }}
              autoFocus
            />
          ) : (
            t.placement
          )}
        </div>
      ),
    },
    {
      key: "logoUrl",
      header: "Logo URL",
      render: (t) => (
        <div
          style={{ cursor: "pointer" }}
          onClick={() => setEditing({ id: t.id, field: "logoUrl", value: t.logoUrl || "" })}
        >
          {editing?.id === t.id && editing.field === "logoUrl" ? (
            <input
              type="url"
              value={editing.value}
              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setEditing(null);
              }}
              autoFocus
            />
          ) : (
            t.logoUrl || "N/A"
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (t) => (
        <>
          {user?.role === "superadmin" ? (
            <button
              onClick={() => handleDelete(t.id)}
              disabled={deleting}
              style={{
                padding: "0.25rem 0.5rem",
                borderRadius: "0.25rem",
                background: "#dc3545",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          ) : (
            <span className="text-muted">No permission</span>
          )}
          {deleteError && (
            <p className="error" style={{ color: "red", marginTop: "0.25rem" }}>
              {deleteError}
            </p>
          )}
        </>
      ),
    },
  ];

  if (loading) return <p>Loading teams…</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="portal-main">
      {/* Search and Controls */}
      <div className="players-controls">
        <button className="create-button" onClick={openModal}>
          Create Team
        </button>
        <div className="players-controls-right">
          <SearchBar onSearch={handleSearch} placeholder="Search teams..." />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Filters */}
      <FilterBar onReset={clearFilters}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontWeight: "bold", minWidth: "80px" }}>Season:</label>
          <select
            className="filter-select"
            value={seasonFilter}
            onChange={(e) => handleSeasonFilterChange(e.target.value)}
          >
            <option value="">All Seasons</option>
            {uniqueSeasons.map(season => (
              <option key={season} value={season.toString()}>
                Season {season}
              </option>
            ))}
          </select>
        </div>

        <div className="results-counter">
          Showing {total === 0 ? 0 : ((currentPage - 1) * TEAMS_PER_PAGE) + 1}-{Math.min(currentPage * TEAMS_PER_PAGE, total)} of {total} teams
        </div>
      </FilterBar>

      {/* Modal for Creating a New Team */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="New Team">
        {formError && (
          <p className="error" style={{ color: "red", marginBottom: "0.5rem" }}>
            {formError}
          </p>
        )}

        {/* Create Team Form */}
        <form onSubmit={handleCreate}>
          {/* Name */}
          <label>
            Name*
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              style={{ width: "100%", marginBottom: "0.75rem" }}
            />
          </label>

          {/* Season Number */}
          <label>
            Season*
            <select
              value={newSeasonNumber || ""}
              onChange={(e) => setNewSeasonNumber(Number(e.target.value))}
              required
              style={{ width: "100%", marginBottom: "0.75rem" }}
            >
              <option value="">Select a Season</option>
              {seasons?.map((season) => (
                <option key={season.id} value={season.seasonNumber}>
                  Season {season.seasonNumber}
                </option>
              ))}
            </select>
          </label>

          {/* Placement */}
          <label>
            Placement
            <input
              type="text"
              value={newPlacement}
              onChange={(e) => setNewPlacement(e.target.value)}
              style={{ width: "100%", marginBottom: "0.75rem" }}
            />
          </label>

          {/* Logo URL */}
          <label>
            Logo URL (Optional)
            <input
              type="url"
              value={newLogoUrl}
              onChange={(e) => setNewLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              style={{ width: "100%", marginBottom: "1rem" }}
            />
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={creating}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "0.25rem",
              background: "var(--color-brand-primary)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            {creating ? "Creating…" : "Submit"}
          </button>
          {createError && (
            <p className="error" style={{ color: "red", marginTop: "0.5rem" }}>
              {createError}
            </p>
          )}
        </form>
      </Modal>

      {/* Teams Table */}
      <div style={{ marginTop: "1.5rem" }}>
        <Table
          columns={columns}
          rows={localTeams}
          rowKey={(row) => row.id}
        />
      </div>
    </div>
  );
};

export default TeamsPage;
