// src/pages/GamesPage.tsx

import React, { useState, useEffect } from "react";
import { useGames }                   from "../../hooks/allFetch";
import { useGameMutations }           from "../../hooks/allPatch";
import { useCreateGames }             from "../../hooks/allCreate";
import { useDeleteGames }             from "../../hooks/allDelete";
import { useAuth }                    from "../../context/authContext";
import type { Game }                  from "../../types/interfaces";
import "../../styles/UsersPage.css";   // contains .users-table, .text-muted, plus our new classes

type EditField =
  | "name"
  | "seasonId"
  | "stage"
  | "team1Score"
  | "team2Score"
  | "date"
  | "videoUrl";

interface EditingState {
  id:    number;
  field: EditField;
  value: string;
}

const GamesPage: React.FC = () => {
  const { data: games, loading, error } = useGames();
  const { patchGame }                   = useGameMutations();
  const { createGame, loading: creating, error: createError } = useCreateGames();
  const { deleteItem: deleteGame, loading: deleting, error: deleteError } = useDeleteGames();
  const { user }                        = useAuth();

  const [ localGames, setLocalGames ] = useState<Game[]>([]);
  const [ editing, setEditing ]       = useState<EditingState | null>(null);

  // Modal state for creating a new game
  const [ isModalOpen, setIsModalOpen ]     = useState<boolean>(false);
  const [ newName, setNewName ]             = useState<string>("");
  const [ newSeasonId, setNewSeasonId ]     = useState<number>(0);
  const [ newStage, setNewStage ]           = useState<string>("");
  const [ newTeam1Score, setNewTeam1Score ] = useState<number>(0);
  const [ newTeam2Score, setNewTeam2Score ] = useState<number>(0);
  const [ newDate, setNewDate ]             = useState<string>("");
  const [ newVideoUrl, setNewVideoUrl ]     = useState<string>("");
  const [ formError, setFormError ]         = useState<string>("");

  useEffect(() => {
    if (games) setLocalGames(games);
  }, [games]);

  // Commit inline edits
  const commitEdit = async () => {
    if (!editing) return;
    const { id, field, value } = editing;
    const orig = localGames.find((g) => g.id === id);
    if (!orig) {
      setEditing(null);
      return;
    }

    let origValue: string;
    switch (field) {
      case "name":       origValue = orig.name; break;
      case "seasonId":   origValue = orig.season.id.toString(); break;
      case "stage":      origValue = orig.stage; break;
      case "team1Score": origValue = orig.team1Score.toString(); break;
      case "team2Score": origValue = orig.team2Score.toString(); break;
      case "date":       origValue = new Date(orig.date).toISOString().slice(0, 10); break;
      default:           origValue = orig.videoUrl ?? "";
    }
    if (value === origValue) {
      setEditing(null);
      return;
    }

    const labelMap: Record<EditField, string> = {
      name: "Name",
      seasonId: "Season ID",
      stage: "Stage",
      team1Score: "Team 1 Score",
      team2Score: "Team 2 Score",
      date: "Date",
      videoUrl: "Video URL",
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
    const payload: Partial<Game> & Record<string, any> = {};
    switch (field) {
      case "name":       payload.name        = value; break;
      case "seasonId":   payload.seasonId    = Number(value); break;
      case "stage":      payload.stage       = value; break;
      case "team1Score": payload.team1Score  = Number(value); break;
      case "team2Score": payload.team2Score  = Number(value); break;
      case "date":       payload.date        = new Date(value); break;
      case "videoUrl":   payload.videoUrl    = value || null; break;
    }

    try {
      const updated = await patchGame(id, payload);
      setLocalGames((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...updated } : g))
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
    if (!window.confirm("Are you sure you want to delete this game?")) return;

    const wasDeleted = await deleteGame(id.toString());
    if (wasDeleted) {
      setLocalGames((prev) => prev.filter((g) => g.id !== id));
    }
  };

  // Open “Create Game” modal
  const openModal = () => {
    setIsModalOpen(true);
    setFormError("");
    setNewName("");
    setNewSeasonId(0);
    setNewStage("");
    setNewTeam1Score(0);
    setNewTeam2Score(0);
    setNewDate("");
    setNewVideoUrl("");
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setFormError("");
  };

  // Create new game handler
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() === "" || newSeasonId <= 0 || newDate.trim() === "") {
      setFormError("Name, Season ID, and Date are required.");
      return;
    }

    const payload = {
      name:       newName,
      seasonId:   newSeasonId,
      stage:      newStage,
      team1Score: newTeam1Score,
      team2Score: newTeam2Score,
      date:       new Date(newDate).toISOString(),
      videoUrl:   newVideoUrl !== "" ? newVideoUrl : null,
    };

    try {
      const created = await createGame(payload);
      if (created) {
        setLocalGames((prev) => [created, ...prev]);
        closeModal();
      }
    } catch {
      // Hook will expose createError if any
    }
  };

  if (loading) return <p>Loading games…</p>;
  if (error)   return <p>Error: {error}</p>;

  return (
    <div className="portal-main">
      <h1 className="users-title">Games</h1>

      {/* “Create Game” Button Below the Heading */}
      <button className="create-button" onClick={openModal}>
        Create Game
      </button>

      {/* Modal Overlay for Creating a New Game */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position:       "fixed",
            top:            0,
            left:           0,
            width:          "100%",
            height:         "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            zIndex:         1000,
          }}
        >
          <div
            className="modal"
            style={{
              background:      "#fff",
              padding:         "1.5rem",
              borderRadius:    "0.5rem",
              width:           "90%",
              maxWidth:        "400px",
              boxShadow:       "0 2px 10px rgba(0,0,0,0.3)",
            }}
          >
            {/* Close Modal Button */}
            <button
              onClick={closeModal}
              style={{
                background:      "transparent",
                border:          "none",
                fontSize:        "1.25rem",
                float:           "right",
                cursor:          "pointer",
              }}
            >
              ×
            </button>

            <h2 style={{ marginTop: 0 }}>New Game</h2>

            {formError && (
              <p className="error" style={{ color: "red", marginBottom: "0.5rem" }}>
                {formError}
              </p>
            )}

            {/* Create Game Form */}
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

              {/* Stage */}
              <label>
                Stage
                <input
                  type="text"
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  style={{ width: "100%", marginBottom: "0.75rem" }}
                />
              </label>

              {/* Team 1 Score */}
              <label>
                Team 1 Score
                <input
                  type="number"
                  min="0"
                  value={newTeam1Score}
                  onChange={(e) => setNewTeam1Score(Number(e.target.value))}
                  style={{ width: "100%", marginBottom: "0.75rem" }}
                />
              </label>

              {/* Team 2 Score */}
              <label>
                Team 2 Score
                <input
                  type="number"
                  min="0"
                  value={newTeam2Score}
                  onChange={(e) => setNewTeam2Score(Number(e.target.value))}
                  style={{ width: "100%", marginBottom: "0.75rem" }}
                />
              </label>

              {/* Date */}
              <label>
                Date*
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                  style={{ width: "100%", marginBottom: "0.75rem" }}
                />
              </label>

              {/* Video URL */}
              <label>
                Video URL
                <input
                  type="text"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  style={{ width: "100%", marginBottom: "1rem" }}
                />
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={creating}
                style={{
                  width:        "100%",
                  padding:      "0.5rem",
                  borderRadius: "0.25rem",
                  background:   "#007bff",
                  color:        "#fff",
                  border:       "none",
                  cursor:       "pointer",
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

      {/* Games Table */}
      <table className="users-table" style={{ marginTop: "1.5rem" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th className="small-column">Season ID</th>
            <th className="wide-column">Stage</th>
            <th>Team1 Score</th>
            <th>Team2 Score</th>
            <th>Date</th>
            <th>Video URL</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {localGames.map((g) => {
            const dateStr = new Date(g.date).toISOString().slice(0, 10);
            return (
              <tr key={g.id}>
                <td>{g.id}</td>

                {/* Name (editable) */}
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() => setEditing({ id: g.id, field: "name", value: g.name })}
                >
                  {editing?.id === g.id && editing.field === "name" ? (
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
                    g.name
                  )}
                </td>

                {/* Season ID (editable, small width) */}
                <td
                  className="small-column"
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setEditing({ id: g.id, field: "seasonId", value: g.season.id.toString() })
                  }
                >
                  {editing?.id === g.id && editing.field === "seasonId" ? (
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
                    g.season.id
                  )}
                </td>

                {/* Stage (editable, wider column) */}
                <td
                  className="wide-column"
                  style={{ cursor: "pointer" }}
                  onClick={() => setEditing({ id: g.id, field: "stage", value: g.stage })}
                >
                  {editing?.id === g.id && editing.field === "stage" ? (
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
                    g.stage
                  )}
                </td>

                {/* Team1 Score */}
                <td
                  style={{ cursor: "pointer", textAlign: "center" }}
                  onClick={() =>
                    setEditing({
                      id:    g.id,
                      field: "team1Score",
                      value: g.team1Score.toString(),
                    })
                  }
                >
                  {editing?.id === g.id && editing.field === "team1Score" ? (
                    <input
                      type="number"
                      min="0"
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
                    g.team1Score
                  )}
                </td>

                {/* Team2 Score */}
                <td
                  style={{ cursor: "pointer", textAlign: "center" }}
                  onClick={() =>
                    setEditing({
                      id:    g.id,
                      field: "team2Score",
                      value: g.team2Score.toString(),
                    })
                  }
                >
                  {editing?.id === g.id && editing.field === "team2Score" ? (
                    <input
                      type="number"
                      min="0"
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
                    g.team2Score
                  )}
                </td>

                {/* Date */}
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() => setEditing({ id: g.id, field: "date", value: dateStr })}
                >
                  {editing?.id === g.id && editing.field === "date" ? (
                    <input
                      type="date"
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
                    new Date(g.date).toLocaleDateString()
                  )}
                </td>

                {/* Video URL */}
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setEditing({ id: g.id, field: "videoUrl", value: g.videoUrl ?? "" })
                  }
                >
                  {editing?.id === g.id && editing.field === "videoUrl" ? (
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
                    g.videoUrl ?? <span className="text-muted">None</span>
                  )}
                </td>

                {/* Actions (delete if superadmin) */}
                <td>
                  {user?.role === "superadmin" ? (
                    <button
                      onClick={() => handleDelete(g.id)}
                      disabled={deleting}
                      style={{
                        padding:      "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        background:   "#dc3545",
                        color:        "#fff",
                        border:       "none",
                        cursor:       "pointer",
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default GamesPage;
