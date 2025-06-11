import React, { useState, useEffect } from "react";
import { useAwards } from "../../hooks/allFetch";
import { useAwardsMutations } from "../../hooks/allPatch";
import { useCreateAwards } from "../../hooks/allCreate";
import { useDeleteAwards } from "../../hooks/allDelete";
import { useAuth } from "../../context/authContext";
import type { Award } from "../../types/interfaces";
import "../../styles/UsersPage.css";
import "../../styles/AwardsPage.css";

const AWARD_TYPES = [
  "MVP",
  "Best Spiker",
  "Best Server",
  "Best Blocker",
  "Best Libero",
  "Best Setter",
  "MIP",
  "Best Aper",
  "FMVP",
  "DPOS",
  "Best Receiver",
  "LuvLate Award"
] as const;

type EditField = "type" | "description" | "seasonId" | "playerName";

interface EditingState {
  id: number;
  field: EditField;
  value: string;
}

const AwardsPage: React.FC = () => {
  const { data: awards, loading, error } = useAwards();
  const { patchAward } = useAwardsMutations();
  const { createAwards, loading: creating } = useCreateAwards();
  const { deleteItem: deleteAward, loading: deleting } = useDeleteAwards();
  const { user } = useAuth();

  const [localAwards, setLocalAwards] = useState<Award[]>([]);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state for creating a new award
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newType, setNewType] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newSeasonId, setNewSeasonId] = useState<number>(0);
  const [newPlayerName, setNewPlayerName] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  useEffect(() => {
    if (awards) setLocalAwards(awards);
  }, [awards]);

  // Commit inline edits
  const commitEdit = async () => {
    if (!editing || isSubmitting) return;
    
    setIsSubmitting(true);
    const { id, field, value } = editing;
    const orig = localAwards.find((a) => a.id === id);
    if (!orig) {
      setEditing(null);
      setIsSubmitting(false);
      return;
    }

    let origValue: string;
    switch (field) {
      case "type": origValue = orig.type; break;
      case "description": origValue = orig.description; break;
      case "seasonId": origValue = orig.season.id.toString(); break;
      case "playerName": origValue = orig.players[0]?.name || ""; break;
      default: origValue = "";
    }

    if (value === origValue) {
      setEditing(null);
      setIsSubmitting(false);
      return;
    }

    const labelMap: Record<EditField, string> = {
      type: "Type",
      description: "Description",
      seasonId: "Season ID",
      playerName: "Player Name",
    };

    if (!window.confirm(`Change ${labelMap[field]} from "${origValue}" to "${value}"?`)) {
      setEditing(null);
      setIsSubmitting(false);
      return;
    }

    // Build payload
    const payload: Partial<Award> & Record<string, any> = {};
    switch (field) {
      case "type": payload.type = value; break;
      case "description": payload.description = value; break;
      case "seasonId": payload.seasonId = Number(value); break;
      case "playerName": payload.playerName = value.toLowerCase(); break;
    }

    try {
      const updated = await patchAward(id, payload);
      setLocalAwards((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updated } : a))
      );
    } catch (err: any) {
      console.error(err);
      alert("Failed to save changes:\n" + err.message);
    } finally {
      setEditing(null);
      setIsSubmitting(false);
    }
  };

  // Delete handler (superadmin only)
  const handleDelete = async (id: number) => {
    if (user?.role !== "superadmin") return;
    if (!window.confirm("Are you sure you want to delete this award?")) return;

    const wasDeleted = await deleteAward(id.toString());
    if (wasDeleted) {
      setLocalAwards((prev) => prev.filter((a) => a.id !== id));
    }
  };

  // Open "Create Award" modal
  const openModal = () => {
    setIsModalOpen(true);
    setFormError("");
    setNewType("");
    setNewDescription("");
    setNewSeasonId(0);
    setNewPlayerName("");
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setFormError("");
  };

  // Create new award handler
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newType.trim() === "" || newSeasonId <= 0 || newPlayerName.trim() === "" || newDescription.trim() === "") {
      setFormError("Type, Description, Season ID, and Player Name are required.");
      return;
    }

    const payload = {
      type: newType,
      description: newDescription,
      seasonId: newSeasonId,
      playerName: newPlayerName.toLowerCase(),
    };

    try {
      const created = await createAwards(payload);
      if (created) {
        setLocalAwards((prev) => [created, ...prev]);
        closeModal();
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to create award");
    }
  };

  if (loading) return <p>Loading awards...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="portal-main">
      <h1 className="users-title">Awards</h1>

      {/* "Create Award" Button */}
      <button
        onClick={openModal}
        className="create-button"
      >
        Create Award
      </button>

      {/* Modal Overlay for Creating a New Award */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create New Award</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Type:</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  required
                >
                  <option value="">Select an award type</option>
                  {AWARD_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Season ID:</label>
                <input
                  type="number"
                  value={newSeasonId}
                  onChange={(e) => setNewSeasonId(Number(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Player Name:</label>
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value.toLowerCase())}
                  required
                />
              </div>
              {formError && <p className="error-message">{formError}</p>}
              <div className="modal-buttons">
                <button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create"}
                </button>
                <button type="button" onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Awards Table */}
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Description</th>
              <th>Season</th>
              <th>Player</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {localAwards.map((award) => (
              <tr key={award.id}>
                <td>{award.id}</td>
                <td>
                  {editing?.id === award.id && editing.field === "type" ? (
                    <select
                      value={editing.value}
                      onChange={(e) =>
                        setEditing({ ...editing, value: e.target.value })
                      }
                      onBlur={commitEdit}
                      disabled={isSubmitting}
                      autoFocus
                    >
                      {AWARD_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      onClick={() =>
                        !isSubmitting && setEditing({ id: award.id, field: "type", value: award.type })
                      }
                    >
                      {award.type}
                    </span>
                  )}
                </td>
                <td>
                  {editing?.id === award.id && editing.field === "description" ? (
                    <input
                      type="text"
                      value={editing.value}
                      onChange={(e) =>
                        setEditing({ ...editing, value: e.target.value })
                      }
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isSubmitting) {
                          e.preventDefault();
                          commitEdit();
                        }
                      }}
                      disabled={isSubmitting}
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() =>
                        !isSubmitting && setEditing({
                          id: award.id,
                          field: "description",
                          value: award.description,
                        })
                      }
                    >
                      {award.description}
                    </span>
                  )}
                </td>
                <td>{award.season.seasonNumber}</td>
                <td>
                  {editing?.id === award.id && editing.field === "playerName" ? (
                    <input
                      type="text"
                      value={editing.value}
                      onChange={(e) =>
                        setEditing({ ...editing, value: e.target.value.toLowerCase() })
                      }
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isSubmitting) {
                          e.preventDefault();
                          commitEdit();
                        }
                      }}
                      disabled={isSubmitting}
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() =>
                        !isSubmitting && setEditing({
                          id: award.id,
                          field: "playerName",
                          value: award.players[0]?.name?.toLowerCase() || "",
                        })
                      }
                    >
                      {award.players[0]?.name || "N/A"}
                    </span>
                  )}
                </td>
                <td>
                  {user?.role === "superadmin" && (
                    <button
                      onClick={() => handleDelete(award.id)}
                      disabled={deleting}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AwardsPage; 