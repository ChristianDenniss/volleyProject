// src/pages/GamesPage.tsx

import React, { useState, useEffect } from "react";
import { useSkinnyGames } from "../../hooks/allFetch";
import { useGameMutations } from "../../hooks/allPatch";
import { useCreateGames } from "../../hooks/allCreate";
import { useDeleteGames } from "../../hooks/allDelete";
import { useAuth } from "../../context/authContext";
import type { Game } from "../../types/interfaces";
import "../../styles/GamesPage.css";       // table & button styling
import "../../styles/PlayersPage.css";     // custom modal styling
import "../../styles/PortalPlayersPage.css"; // portal-specific styles
import SearchBar from "../Searchbar";
import Pagination from "../Pagination";
import Modal from "../ui/Modal";
import FilterBar from "../ui/FilterBar";
import Table from "../ui/Table";

type EditField = "name" | "seasonId" | "stage" | "team1Score" | "team2Score" | "date" | "videoUrl";

interface EditingState {
  id: number;
  field: EditField;
  value: string;
}

interface GameColumn {
  key: string;
  header: string;
  render?: (row: Game) => React.ReactNode;
}

interface CreateGameInput {
  name: string;
  seasonId: number;
  teamNames: string[];
  team1Score: number;
  team2Score: number;
  videoUrl: string | null;
  date: Date;
  stage: string;
}

const GamesPage: React.FC = () => {
  const { data: games, loading, error } = useSkinnyGames();
  const { patchGame } = useGameMutations();
  const { createGame, loading: creating, error: createError } = useCreateGames();
  const { deleteItem: deleteGame, loading: deleting } = useDeleteGames();
  const { user } = useAuth();

  const [localGames, setLocalGames] = useState<Game[]>([]);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const gamesPerPage = 10;

  // Filter states
  const [seasonFilter, setSeasonFilter] = useState<string>("");
  const [stageFilter, setStageFilter] = useState<string>("");

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

  // Get unique seasons and stages for filter options
  const uniqueSeasons = Array.from(new Set(localGames.map(game => game.season.seasonNumber))).sort((a, b) => a - b);
  const uniqueStages = Array.from(new Set(localGames.map(game => game.stage).filter(stage => stage))).sort();

  // Commit inline edits
  const commitEdit = async () => {
    if (!editing) return;

    const payload: any = {};
    const value = editing.value;

    switch (editing.field) {
      case "name": payload.name = value; break;
      case "seasonId": payload.seasonId = Number(value); break;
      case "stage": payload.stage = value; break;
      case "team1Score": payload.team1Score = Number(value); break;
      case "team2Score": payload.team2Score = Number(value); break;
      case "date": payload.date = new Date(value); break;
      case "videoUrl": payload.videoUrl = value === "" ? null : value; break;
    }

    try {
      const updatedGame = await patchGame(editing.id, payload);
      setLocalGames((prev) =>
        prev.map((g) => (g.id === editing.id ? updatedGame : g))
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
        date: new Date(newDate),
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
      case "date": 
        // Handle date as string, null, or undefined
        let dateObj: Date;
        if (!orig.date) {
          // If date is null/undefined, use current date
          dateObj = new Date();
        } else {
          dateObj = new Date(orig.date);
        }
        
        // Check if the date is valid
        if (isNaN(dateObj.getTime())) {
          dateObj = new Date(); // Use current date if invalid
        }
        
        origValue = dateObj.toISOString().split('T')[0]; 
        break;
      case "videoUrl": origValue = orig.videoUrl || ''; break;
    }
    setEditing({ id, field, value: origValue });
  };

  // Filter games based on search query, season, and stage
  const filteredGames = localGames.filter(game => {
    const gameName = game?.name || 'No Given Name';
    const matchesSearch = gameName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeason = !seasonFilter || game.season.seasonNumber.toString() === seasonFilter;
    const matchesStage = !stageFilter || game.stage === stageFilter;
    
    return matchesSearch && matchesSeason && matchesStage;
  });

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

  // Handle filter changes
  const handleSeasonFilterChange = (value: string) => {
    setSeasonFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleStageFilterChange = (value: string) => {
    setStageFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSeasonFilter("");
    setStageFilter("");
    setCurrentPage(1);
  };

  // Column definitions for the shared Table component
  const columns: GameColumn[] = [
    {
      key: "name",
      header: "Name",
      render: (g) =>
        editing?.id === g.id && editing?.field === "name" ? (
          <input
            type="text"
            value={editing.value}
            onChange={e => setEditing({ ...editing, value: e.target.value })}
            onBlur={commitEdit}
            onKeyDown={e => e.key === 'Enter' && commitEdit()}
            autoFocus
          />
        ) : (
          <span onClick={() => startEdit(g.id, "name")}>{g.name || 'No Given Name'}</span>
        ),
    },
    {
      key: "season",
      header: "Season",
      render: (g) =>
        editing?.id === g.id && editing?.field === "seasonId" ? (
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
        ),
    },
    {
      key: "stage",
      header: "Stage",
      render: (g) =>
        editing?.id === g.id && editing?.field === "stage" ? (
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
        ),
    },
    {
      key: "team1",
      header: "Team 1",
      render: (g) => g.teams?.[0]?.name || 'N/A',
    },
    {
      key: "team2",
      header: "Team 2",
      render: (g) => g.teams?.[1]?.name || 'N/A',
    },
    {
      key: "team1Score",
      header: "T1 Score",
      render: (g) =>
        editing?.id === g.id && editing?.field === "team1Score" ? (
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
        ),
    },
    {
      key: "team2Score",
      header: "T2 Score",
      render: (g) =>
        editing?.id === g.id && editing?.field === "team2Score" ? (
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
        ),
    },
    {
      key: "date",
      header: "Date",
      render: (g) =>
        editing?.id === g.id && editing?.field === "date" ? (
          <input
            type="date"
            value={editing.value}
            onChange={e => setEditing({ ...editing, value: e.target.value })}
            onBlur={commitEdit}
            onKeyDown={e => e.key === 'Enter' && commitEdit()}
            autoFocus
          />
        ) : (
          <span
            onClick={() => startEdit(g.id, "date")}
            style={{ cursor: "pointer" }}
          >
            {(() => {
              if (!g.date) return 'No Date';
              const dateObj = new Date(g.date);
              return isNaN(dateObj.getTime()) ? 'Invalid Date' : dateObj.toLocaleDateString();
            })()}
          </span>
        ),
    },
    {
      key: "videoUrl",
      header: "Video",
      render: (g) =>
        editing?.id === g.id && editing?.field === "videoUrl" ? (
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
        ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (g) =>
        user?.role === "superadmin" ? (
          <button
            onClick={() => handleDelete(g.id)}
            disabled={deleting}
            className="game-btn-remove"
          >
            Delete
          </button>
        ) : (
          <span style={{ color: "#666", fontStyle: "italic" }}>No permissions</span>
        ),
    },
  ];

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
          <SearchBar onSearch={handleSearch} placeholder="Search games..." />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Filters */}
      <FilterBar onReset={(searchQuery || seasonFilter || stageFilter) ? clearFilters : undefined}>
        <div className="filter-group">
          <label className="filter-label">Season:</label>
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

        <div className="filter-group">
          <label className="filter-label">Stage:</label>
          <select
            className="filter-select"
            value={stageFilter}
            onChange={(e) => handleStageFilterChange(e.target.value)}
          >
            <option value="">All Stages</option>
            {uniqueStages.map(stage => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>
      </FilterBar>

      <div className="results-counter">
        Showing {((currentPage - 1) * gamesPerPage) + 1}-{Math.min(currentPage * gamesPerPage, filteredGames.length)} of {filteredGames.length} games
      </div>

      {/* Modal for Creating a New Game */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="New Game">
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
            className="modal-submit-button"
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

      {/* Games Table */}
      <div className="users-table" style={{ marginTop: "1.5rem" }}>
        <Table
          columns={columns as any}
          rows={paginatedGames as unknown as Record<string, unknown>[]}
          rowKey={(row) => (row as unknown as Game).id}
        />
      </div>
    </div>
  );
};

export default GamesPage;
