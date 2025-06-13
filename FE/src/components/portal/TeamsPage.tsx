// src/components/portal/TeamsPage.tsx

import React, { useState, useEffect } from "react";
import { useTeams } from "../../hooks/allFetch";
import { useTeamMutations } from "../../hooks/allPatch";
import { useCreateTeams } from "../../hooks/allCreate";
import { useDeleteTeams } from "../../hooks/allDelete";
import { useAuth } from "../../context/authContext";
import type { Team } from "../../types/interfaces";
import "../../styles/UsersPage.css";
import "../../styles/PlayersPage.css";
import "../../styles/PortalPlayersPage.css";
import SearchBar from "../Searchbar";
import Pagination from "../Pagination";

type EditField =
  | "name"
  | "seasonId"
  | "placement";

interface EditingState {
  id: number;
  field: EditField;
  value: string;
}

const TeamsPage: React.FC = () => {
  const { data: teams, loading, error } = useTeams();
  const { patchTeam } = useTeamMutations();
  const { createTeam, loading: creating, error: createError } = useCreateTeams();
  const { deleteItem: deleteTeam, loading: deleting, error: deleteError } = useDeleteTeams();
  const { user } = useAuth();

  const [localTeams, setLocalTeams] = useState<Team[]>([]);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const teamsPerPage = 10;

  // Modal state for creating a new team
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [newSeasonId, setNewSeasonId] = useState<number>(0);
  const [newPlacement, setNewPlacement] = useState<string>("Didn't make playoffs");
  const [formError, setFormError] = useState<string>("");

  useEffect(() => {
    if (teams) setLocalTeams(teams);
  }, [teams]);

  // Filter teams based on search query
  const filteredTeams = localTeams.filter(team =>
    team?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredTeams.length / teamsPerPage);
  const paginatedTeams = filteredTeams.slice(
    (currentPage - 1) * teamsPerPage,
    currentPage * teamsPerPage
  );

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
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
      case "seasonId": origValue = orig.season.id.toString(); break;
      case "placement": origValue = orig.placement; break;
      default: origValue = "";
    }
    if (value === origValue) {
      setEditing(null);
      return;
    }

    const labelMap: Record<EditField, string> = {
      name: "Name",
      seasonId: "Season ID",
      placement: "Placement",
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
      case "seasonId": payload.seasonId = Number(value); break;
      case "placement": payload.placement = value; break;
    }

    try {
      const updated = await patchTeam(id, payload);
      setLocalTeams((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
      );
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
    }
  };

  // Open "Create Team" modal
  const openModal = () => {
    setIsModalOpen(true);
    setFormError("");
    setNewName("");
    setNewSeasonId(0);
    setNewPlacement("Didn't make playoffs");
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setFormError("");
  };

  // Create new team handler
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() === "" || newSeasonId <= 0) {
      setFormError("Name and Season ID are required.");
      return;
    }

    const payload = {
      name: newName,
      seasonId: newSeasonId,
      placement: newPlacement,
    };

    try {
      const created = await createTeam(payload);
      if (created) {
        setLocalTeams((prev) => [created, ...prev]);
        closeModal();
      }
    } catch {
      // Hook will expose createError if any
    }
  };

  if (loading) return <p>Loading teams…</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="portal-main">
      <h1 className="users-title">Teams</h1>

      {/* Search and Controls */}
      <div className="players-controls">
        <button className="create-button" onClick={openModal}>
          Create Team
        </button>
        <div className="players-controls-right">
          <SearchBar onSearch={handleSearch} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Modal Overlay for Creating a New Team */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal"
            style={{
              background: "#fff",
              padding: "1.5rem",
              borderRadius: "0.5rem",
              width: "90%",
              maxWidth: "400px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}
          >
            {/* Close Modal Button */}
            <button
              onClick={closeModal}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "1.25rem",
                float: "right",
                cursor: "pointer",
              }}
            >
              ×
            </button>

            <h2 style={{ marginTop: 0 }}>New Team</h2>

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

              {/* Season ID */}
              <label>
                Season ID*
                <input
                  type="number"
                  value={newSeasonId}
                  onChange={(e) => setNewSeasonId(Number(e.target.value))}
                  required
                  style={{ width: "100%", marginBottom: "0.75rem" }}
                />
              </label>

              {/* Placement */}
              <label>
                Placement
                <input
                  type="text"
                  value={newPlacement}
                  onChange={(e) => setNewPlacement(e.target.value)}
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
                  background: "#007bff",
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
          </div>
        </div>
      )}

      {/* Teams Table */}
      <table className="users-table" style={{ marginTop: "1.5rem" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th className="small-column">Season ID</th>
            <th>Placement</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedTeams.map((t) => (
            <tr key={t.id}>
              <td>{t.id}</td>

              {/* Name (editable) */}
              <td
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
              </td>

              {/* Season ID (editable) */}
              <td
                className="small-column"
                style={{ cursor: "pointer" }}
                onClick={() =>
                  setEditing({ id: t.id, field: "seasonId", value: t.season.id.toString() })
                }
              >
                {editing?.id === t.id && editing.field === "seasonId" ? (
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
                  t.season.id
                )}
              </td>

              {/* Placement (editable) */}
              <td
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
              </td>

              {/* Actions (delete if superadmin) */}
              <td>
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeamsPage;
