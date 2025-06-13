// src/pages/GamesPage.tsx

import React, { useState, useEffect } from "react";
import { useGames } from "../../hooks/allFetch";
import { useGameMutations } from "../../hooks/allPatch";
import { useCreateGames } from "../../hooks/allCreate";
import { useDeleteGames } from "../../hooks/allDelete";
import { useAuth } from "../../context/authContext";
import type { Game, Season } from "../../types/interfaces";
import "../../styles/UsersPage.css";   // contains .users-table, .text-muted, plus our new classes
import "../../styles/PortalPlayersPage.css"; // portal-specific styles
import SearchBar from "../Searchbar";
import Pagination from "../Pagination";

type EditField = "name" | "seasonId" | "stage" | "team1Score" | "team2Score" | "date" | "videoUrl";

interface EditingState {
  id: number;
  field: EditField;
  value: string;
}

interface CreateGameInput {
  name: string;
  seasonId: number;
  teamNames: string[];
  team1Score: number;
  team2Score: number;
  videoUrl: string | null;
  date: string;
  stage: string;
}

const GamesPage: React.FC = () => {
  const { data: games, loading, error } = useGames();
  const { patchGame } = useGameMutations();
  const { createGame, loading: creating, error: createError } = useCreateGames();
  const { deleteItem: deleteGame, loading: deleting } = useDeleteGames();
  const { user } = useAuth();

  const [localGames, setLocalGames] = useState<Game[]>([]);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const gamesPerPage = 10;

  // Modal state for creating a new game
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [newSeasonNumber, setNewSeasonNumber] = useState<string>("");
  const [newStage, setNewStage] = useState<string>("");
  const [newTeam1Score, setNewTeam1Score] = useState<string>("");
  const [newTeam2Score, setNewTeam2Score] = useState<string>("");
  const [newDate, setNewDate] = useState<string>("");
  const [newVideoUrl, setNewVideoUrl] = useState<string>("");
  const [newTeam1Name, setNewTeam1Name] = useState<string>("");
  const [newTeam2Name, setNewTeam2Name] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  useEffect(() => {
    if (games) setLocalGames(games);
  }, [games]);

  // Commit inline edits
  const commitEdit = async () => {
    if (!editing) return;

    const payload: Partial<Game> = {};
    const value = editing.value;

    switch (editing.field) {
      case "name": payload.name = value; break;
      case "seasonId": payload.season = { id: Number(value) } as Season; break;
      case "stage": payload.stage = value; break;
      case "team1Score": payload.team1Score = Number(value); break;
      case "team2Score": payload.team2Score = Number(value); break;
      case "date": payload.date = new Date(value); break;
      case "videoUrl": payload.videoUrl = value === "" ? null : value; break;
    }

    try {
      await patchGame(editing.id, payload);
      setLocalGames((prev) =>
        prev.map((g) => (g.id === editing.id ? { ...g, ...payload } : g))
      );
    } catch (error) {
      console.error("Error updating game:", error);
      alert("Failed to update game");
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

  // Open "Create Game" modal
  const openModal = () => {
    setIsModalOpen(true);
    setFormError("");
    setNewName("");
    setNewSeasonNumber("");
    setNewStage("");
    setNewTeam1Score("");
    setNewTeam2Score("");
    setNewDate("");
    setNewVideoUrl("");
    setNewTeam1Name("");
    setNewTeam2Name("");
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setFormError("");
  };

  // Create new game handler
  const handleCreate = async () => {
    if (!newName || !newSeasonNumber || !newTeam1Name || !newTeam2Name || !newDate || !newStage) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await createGame({
        name: newName,
        seasonId: Number(newSeasonNumber),
        teamNames: [newTeam1Name, newTeam2Name],
        team1Score: Number(newTeam1Score),
        team2Score: Number(newTeam2Score),
        videoUrl: newVideoUrl === "" ? null : newVideoUrl,
        date: new Date(newDate).toISOString(),
        stage: newStage
      } as CreateGameInput);
      setIsModalOpen(false);
      setNewName("");
      setNewSeasonNumber("");
      setNewTeam1Name("");
      setNewTeam2Name("");
      setNewTeam1Score("");
      setNewTeam2Score("");
      setNewVideoUrl("");
      setNewDate("");
      setNewStage("");
    } catch (error) {
      console.error("Error creating game:", error);
      alert("Failed to create game");
    }
  };

  // Start edit function
  const startEdit = (id: number, field: EditField) => {
    if (!games) return;
    const orig = games.find(g => g.id === id);
    if (!orig) return;

    let origValue: string;
    switch (field) {
      case "name": origValue = orig.name; break;
      case "seasonId": origValue = String(orig.season.id); break;
      case "stage": origValue = orig.stage; break;
      case "team1Score": origValue = String(orig.team1Score); break;
      case "team2Score": origValue = String(orig.team2Score); break;
      case "date": origValue = orig.date.toISOString().split('T')[0]; break;
      case "videoUrl": origValue = orig.videoUrl || ''; break;
    }
    setEditing({ id, field, value: origValue });
  };

  // Filter games based on search query
  const filteredGames = localGames.filter(game =>
    game?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredGames.length / gamesPerPage);
  const paginatedGames = filteredGames.slice(
    (currentPage - 1) * gamesPerPage,
    currentPage * gamesPerPage
  );

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  if (loading) return <p>Loading games…</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="portal-main">
      <h1 className="users-title">Games</h1>

      {/* Search and Controls */}
      <div className="players-controls">
        <button className="create-button" onClick={openModal}>
          Create Game
        </button>
        <div className="players-controls-right">
          <div className="players-search-wrapper">
            <SearchBar onSearch={handleSearch} />
          </div>
          <div className="players-pagination-wrapper">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      {/* Modal Overlay for Creating a New Game */}
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

              {/* Season Number */}
              <label>
                Season Number*
                <input
                  type="number"
                  value={newSeasonNumber}
                  onChange={(e) => setNewSeasonNumber(e.target.value)}
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

              {/* Team 1 Name */}
              <label>
                Team 1 Name*
                <input
                  type="text"
                  value={newTeam1Name}
                  onChange={(e) => setNewTeam1Name(e.target.value)}
                  required
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
                  onChange={(e) => setNewTeam1Score(e.target.value)}
                  style={{ width: "100%", marginBottom: "0.75rem" }}
                />
              </label>

              {/* Team 2 Name */}
              <label>
                Team 2 Name*
                <input
                  type="text"
                  value={newTeam2Name}
                  onChange={(e) => setNewTeam2Name(e.target.value)}
                  required
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
                  onChange={(e) => setNewTeam2Score(e.target.value)}
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

      {/* Games Table */}
      <table className="users-table" style={{ marginTop: "1.5rem" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Season</th>
            <th>Stage</th>
            <th>Team 1</th>
            <th>Team 2</th>
            <th>Score</th>
            <th>Date</th>
            <th>Video</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedGames.map((g) => {
            return (
              <tr key={g.id}>
                <td>
                  {editing?.id === g.id && editing?.field === "name" ? (
                    <input
                      type="text"
                      value={editing.value}
                      onChange={e => setEditing({ ...editing, value: e.target.value })}
                      onBlur={commitEdit}
                      onKeyDown={e => e.key === 'Enter' && commitEdit()}
                      autoFocus
                    />
                  ) : (
                    <span onClick={() => startEdit(g.id, "name")}>{g.name}</span>
                  )}
                </td>
                <td>
                  {editing?.id === g.id && editing?.field === "seasonId" ? (
                    <input
                      type="number"
                      value={editing.value}
                      onChange={e => setEditing({ ...editing, value: e.target.value })}
                      onBlur={commitEdit}
                      onKeyDown={e => e.key === 'Enter' && commitEdit()}
                      autoFocus
                    />
                  ) : (
                    <span onClick={() => startEdit(g.id, "seasonId")}>{g.season.seasonNumber}</span>
                  )}
                </td>
                <td>
                  {editing?.id === g.id && editing?.field === "stage" ? (
                    <input
                      type="text"
                      value={editing.value}
                      onChange={e => setEditing({ ...editing, value: e.target.value })}
                      onBlur={commitEdit}
                      onKeyDown={e => e.key === 'Enter' && commitEdit()}
                      autoFocus
                    />
                  ) : (
                    <span onClick={() => startEdit(g.id, "stage")}>{g.stage}</span>
                  )}
                </td>
                <td>{g.teams?.[0]?.name || 'N/A'}</td>
                <td>{g.teams?.[1]?.name || 'N/A'}</td>
                <td>
                  {editing?.id === g.id && editing?.field === "team1Score" ? (
                    <input
                      type="number"
                      value={editing.value}
                      onChange={e => setEditing({ ...editing, value: e.target.value })}
                      onBlur={commitEdit}
                      onKeyDown={e => e.key === 'Enter' && commitEdit()}
                      autoFocus
                    />
                  ) : (
                    <span onClick={() => startEdit(g.id, "team1Score")}>{g.team1Score}</span>
                  )}
                  {" - "}
                  {editing?.id === g.id && editing?.field === "team2Score" ? (
                    <input
                      type="number"
                      value={editing.value}
                      onChange={e => setEditing({ ...editing, value: e.target.value })}
                      onBlur={commitEdit}
                      onKeyDown={e => e.key === 'Enter' && commitEdit()}
                      autoFocus
                    />
                  ) : (
                    <span onClick={() => startEdit(g.id, "team2Score")}>{g.team2Score}</span>
                  )}
                </td>
                <td>
                  {editing?.id === g.id && editing?.field === "date" ? (
                    <input
                      type="date"
                      value={editing.value}
                      onChange={e => setEditing({ ...editing, value: e.target.value })}
                      onBlur={commitEdit}
                      onKeyDown={e => e.key === 'Enter' && commitEdit()}
                      autoFocus
                    />
                  ) : (
                    <span onClick={() => startEdit(g.id, "date")}>{new Date(g.date).toLocaleDateString()}</span>
                  )}
                </td>
                <td>
                  {editing?.id === g.id && editing?.field === "videoUrl" ? (
                    <input
                      type="text"
                      value={editing.value}
                      onChange={e => setEditing({ ...editing, value: e.target.value })}
                      onBlur={commitEdit}
                      onKeyDown={e => e.key === 'Enter' && commitEdit()}
                      autoFocus
                    />
                  ) : (
                    <span onClick={() => startEdit(g.id, "videoUrl")}>{g.videoUrl || 'N/A'}</span>
                  )}
                </td>
                <td>
                  {user?.role === "superadmin" && (
                    <button
                      onClick={() => handleDelete(g.id)}
                      disabled={deleting}
                      className="delete-button"
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        background: "#dc3545",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                      }}
                    >
                      Delete
                    </button>
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
