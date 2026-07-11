// src/pages/PlayersPage.tsx

import React, { useState, useEffect } from "react";
import { usePlayers }                     from "../../hooks/allFetch";
import { usePlayerMutations }             from "../../hooks/allPatch";
import { useBatchPlayersByTeamName }      from "../../hooks/useCreatePlayers";
import { useDeletePlayers }               from "../../hooks/allDelete";
import { useAuth }                        from "../../context/authContext";
import type { Player }                    from "../../types/interfaces";
import "../../styles/UsersPage.css";       // table & button styling
import "../../styles/PlayersPage.css";     // custom "submit players" modal styling
import "../../styles/PortalPlayersPage.css"; // portal-specific styles
import SearchBar                          from "../Searchbar";
import Pagination                         from "../Pagination";
import Modal                              from "../ui/Modal";
import Table, { type TableColumn }        from "../ui/Table";

type EditField = "name" | "position";
interface EditingState {
  id:    number;
  field: EditField;
  value: string;
}

interface BatchFormRow {
  name: string;
  position: string;
  teamNamesCSV: string; // comma-separated team names (all lowercase)
}

const PLAYERS_PER_PAGE = 10;

const PlayersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { data: players, total, totalPages, loading, error, refetch } = usePlayers({
    page: currentPage,
    limit: PLAYERS_PER_PAGE,
    search: searchQuery || undefined,
  });
  const { patchPlayer } = usePlayerMutations();
  const { createBatch, loading: batchLoading, error: batchError } = useBatchPlayersByTeamName();
  const { deleteItem: deletePlayer, loading: deleting, error: deleteError } = useDeletePlayers();
  const { user } = useAuth();

  const [localPlayers, setLocalPlayers] = useState<Player[]>([]);
  const [editing, setEditing] = useState<EditingState | null>(null);

  // Modal state for "Submit Players"
  const [ isModalOpen, setIsModalOpen ]   = useState<boolean>(false);
  const [ batchRows, setBatchRows ]       = useState<BatchFormRow[]>([
    { name: "", position: "", teamNamesCSV: "" },
  ]);
  const [ formError, setFormError ]       = useState<string>("");

  useEffect(() => {
    setLocalPlayers(players);
  }, [players]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Commit inline edits for name/position
  const commitEdit = async () => {
    if (!editing) return;
    const { id, field, value } = editing;
    const orig = localPlayers.find((p) => p.id === id);
    if (!orig) {
      setEditing(null);
      return;
    }

    let origValue: string = field === "name" ? orig.name : orig.position;
    if (value === origValue) {
      setEditing(null);
      return;
    }

    const label = field === "name" ? "Name" : "Position";
    if (!window.confirm(`Change ${label} from "${origValue}" to "${value}"?`)) {
      setEditing(null);
      return;
    }

    const payload: Partial<Player> = {};
    if (field === "name") payload.name = value;
    else payload.position = value;

    try {
      const updated = await patchPlayer(id, payload);
      setLocalPlayers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
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
    if (!window.confirm("Are you sure you want to delete this player?")) return;

    const wasDeleted = await deletePlayer(id.toString());
    if (wasDeleted) {
      setLocalPlayers((prev) => prev.filter((p) => p.id !== id));
      refetch();
    }
  };

  // Add one more empty row to the "Submit Players" form
  const addRow = () => {
    setBatchRows((rows) => [
      ...rows,
      { name: "", position: "", teamNamesCSV: "" },
    ]);
  };

  // Remove a row by index
  const removeRow = (idx: number) => {
    setBatchRows((rows) => rows.filter((_, i) => i !== idx));
  };

  // Handle form submission of multiple players
  const handleBatchCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Validate each row: name + position required
    for (let i = 0; i < batchRows.length; i++) {
      const { name, position } = batchRows[i];
      if (!name.trim() || !position.trim()) {
        setFormError(`Row ${i + 1}: Name and Position are required.`);
        return;
      }
    }

    // Build the payload array for the API
    const payload = batchRows.map((row) => {
      const teamNamesArray = row.teamNamesCSV
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 0);

      return {
        name:      row.name.trim(),
        position:  row.position.trim(),
        teamNames: teamNamesArray,
      };
    });

    try {
      const created = await createBatch(payload);
      if (created) {
        // Ensure created is an array before spreading
        const newPlayers = Array.isArray(created) ? created : [created];
        setLocalPlayers((prev) => [...newPlayers, ...prev]);
        refetch();
        setIsModalOpen(false);
        setBatchRows([{ name: "", position: "", teamNamesCSV: "" }]);
      } else {
        setFormError("Failed to create players. No response received.");
      }
    } catch (err) {
      console.error("Error creating players:", err);
      setFormError("Failed to create players. Please try again.");
    }
  };

  const columns: TableColumn<Player>[] = [
    {
      key: "id",
      header: "ID",
      render: (p) => p.id,
    },
    {
      key: "name",
      header: "Name",
      render: (p) => (
        <span
          style={{ cursor: "pointer", display: "block", width: "100%" }}
          onClick={() => setEditing({ id: p.id, field: "name", value: p.name })}
        >
          {editing?.id === p.id && editing.field === "name" ? (
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
            p.name
          )}
        </span>
      ),
    },
    {
      key: "position",
      header: "Position",
      render: (p) => (
        <span
          style={{ cursor: "pointer", display: "block", width: "100%" }}
          onClick={() => setEditing({ id: p.id, field: "position", value: p.position })}
        >
          {editing?.id === p.id && editing.field === "position" ? (
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
            p.position
          )}
        </span>
      ),
    },
    {
      key: "teams",
      header: "Teams",
      render: (p) =>
        p.teams && p.teams.length > 0
          ? p.teams.map((team) => team.name).join(", ")
          : <span className="text-muted">No teams</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (p) => (
        <>
          {user?.role === "superadmin" ? (
            <button
              onClick={() => handleDelete(p.id)}
              disabled={deleting}
              style={{
                padding:      "0.25rem 0.5rem",
                borderRadius: "0.25rem",
                background:   "#dc3545",
                color:        "#fff",
                border:       "none",
                cursor:       "pointer",
                fontSize:     "0.875rem",
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

  if (loading) return <p>Loading players…</p>;
  if (error)   return <p>Error: {error}</p>;

  return (
    <div className="portal-main">
      {/* Search and Controls */}
      <div className="players-controls">
        <button className="create-button" onClick={() => setIsModalOpen(true)}>
          Create Players
        </button>
        <div className="players-controls-right">
          <SearchBar onSearch={handleSearch} placeholder="Search players..." />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <div className="results-counter">
        Showing {total === 0 ? 0 : ((currentPage - 1) * PLAYERS_PER_PAGE) + 1}-{Math.min(currentPage * PLAYERS_PER_PAGE, total)} of {total} players
      </div>

      {/* Modal for Submitting Players */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setBatchRows([{ name: "", position: "", teamNamesCSV: "" }]);
          setFormError("");
        }}
        title="Batch Create Players"
      >
        {formError && (
          <p className="player-modal-error">{formError}</p>
        )}
        {batchError && (
          <p className="player-modal-error">{batchError}</p>
        )}

        <form onSubmit={handleBatchCreate} className="player-form">
          {batchRows.map((row, idx) => (
            <div key={idx} className="player-form-row">
              {/* Name Input */}
              <input
                type="text"
                placeholder="Name*"
                className="player-input"
                value={row.name}
                onChange={(e) => {
                  const updated = [...batchRows];
                  updated[idx].name = e.target.value;
                  setBatchRows(updated);
                }}
                required
              />

              {/* Position Input */}
              <input
                type="text"
                placeholder="Position*"
                className="player-input"
                value={row.position}
                onChange={(e) => {
                  const updated = [...batchRows];
                  updated[idx].position = e.target.value;
                  setBatchRows(updated);
                }}
                required
              />

              {/* Team Names CSV Input */}
              <input
                type="text"
                placeholder="Team names (comma-separated)"
                className="player-input player-input-teams"
                value={row.teamNamesCSV}
                onChange={(e) => {
                  const updated = [...batchRows];
                  updated[idx].teamNamesCSV = e.target.value;
                  setBatchRows(updated);
                }}
              />

              {/* Remove Row Button */}
              <button
                type="button"
                className="player-btn-remove"
                onClick={() => removeRow(idx)}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            className="player-btn-add"
            onClick={addRow}
          >
            + Add Another
          </button>

          <button
            type="submit"
            className="player-btn-submit"
            disabled={batchLoading}
          >
            {batchLoading ? "Creating…" : "Submit All"}
          </button>
        </form>
      </Modal>

      {/* Players Table */}
      <div style={{ marginTop: "1.5rem" }}>
        <Table<Player>
          columns={columns}
          rows={localPlayers}
          rowKey={(row) => row.id}
        />
      </div>
    </div>
  );
};

export default PlayersPage;
