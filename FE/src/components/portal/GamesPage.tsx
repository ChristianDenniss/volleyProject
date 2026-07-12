// src/pages/GamesPage.tsx

import React, { useState, useEffect } from "react";
import { useGames, useSkinnySeasons, useGameStages } from "../../hooks/allFetch";
import { useGameMutations } from "../../hooks/allPatch";
import { useCreateGames } from "../../hooks/allCreate";
import { useDeleteGames } from "../../hooks/allDelete";
import { useAuth } from "../../context/authContext";
import { useRegion } from "../../context/regionContext";
import type { Game, CreateGameInput, ChallongeImportResult } from "../../types/interfaces";
import ChallongeImport from "../ChallongeImport";
import GameStatUploadModal from "./GameStatUploadModal";
import "../../styles/GamesPage.css";       // table & button styling
import "../../styles/PlayersPage.css";     // custom modal styling
import "../../styles/PortalPlayersPage.css"; // portal-specific styles
import SearchBar from "../Searchbar";
import Pagination from "../Pagination";
import Modal from "../ui/Modal";
import FilterBar from "../ui/FilterBar";
import Table, { type TableColumn } from "../ui/Table";
import { formatGameStage } from "../../utils/gameLabels";

type EditField = "name" | "seasonId" | "stage" | "phase" | "bracket" | "team1Score" | "team2Score" | "date" | "videoUrl" | "status";

interface EditingState {
  id: number;
  field: EditField;
  value: string;
}

interface GameColumn extends TableColumn<Game> {}

const GAMES_PER_PAGE = 10;

const GamesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [seasonFilter, setSeasonFilter] = useState<string>("");
  const [stageFilter, setStageFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [phaseFilter, setPhaseFilter] = useState<string>("");
  const [bracketFilter, setBracketFilter] = useState<string>("");

  const { regionQuery } = useRegion();

  const { data: games, total, totalPages, loading, error, refetch } = useGames({
    page: currentPage,
    limit: GAMES_PER_PAGE,
    search: searchQuery || undefined,
    seasonId: seasonFilter || undefined,
    stage: stageFilter || undefined,
    status: statusFilter || undefined,
    phase: phaseFilter || undefined,
    ...regionQuery,
    bracket: bracketFilter || undefined,
  });
  const { data: seasons, loading: seasonsLoading } = useSkinnySeasons({ page: 1, limit: 100, ...regionQuery });
  const { data: uniqueStages, loading: stagesLoading } = useGameStages({ seasonId: seasonFilter || undefined, ...regionQuery });
  const { patchGame } = useGameMutations();
  const { createGame, loading: creating, error: createError } = useCreateGames();
  const { deleteItem: deleteGame, loading: deleting } = useDeleteGames();
  const { user } = useAuth();

  const [localGames, setLocalGames] = useState<Game[]>([]);
  const [editing, setEditing] = useState<EditingState | null>(null);

  // Modal state for creating a new game
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<ChallongeImportResult | null>(null);
  const [statUploadGame, setStatUploadGame] = useState<Game | null>(null);
  const [newName, setNewName] = useState<string>("");
  const [newSeasonNumber, setNewSeasonNumber] = useState<string>("");
  const [newStage, setNewStage] = useState<string>("Round 1");
  const [newPhase, setNewPhase] = useState<Game["phase"]>("qualifiers");
  const [newBracket, setNewBracket] = useState<Game["bracket"]>(null);
  const [newStatus, setNewStatus] = useState<string>("scheduled");
  const [newTeam1Score, setNewTeam1Score] = useState<string>("");
  const [newTeam2Score, setNewTeam2Score] = useState<string>("");
  const [newDate, setNewDate] = useState<string>("");
  const [newVideoUrl, setNewVideoUrl] = useState<string>("");
  const [newTeam1Name, setNewTeam1Name] = useState<string>("");
  const [newTeam2Name, setNewTeam2Name] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  useEffect(() => {
    setLocalGames(games ?? []);
  }, [games]);

  const uniqueSeasons = (seasons ?? [])
    .map((season) => season.id)
    .sort((a, b) => a - b);

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
      case "status": payload.status = value; break;
      case "phase": payload.phase = value; break;
      case "bracket": payload.bracket = value === "" ? null : value; break;
    }

    try {
      const updatedGame = await patchGame(editing.id, payload);
      setLocalGames((prev) =>
        prev.map((g) => (g.id === editing.id ? updatedGame : g))
      );
      refetch();
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
      refetch();
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
        team1Score: newTeam1Score === "" ? null : Number(newTeam1Score),
        team2Score: newTeam2Score === "" ? null : Number(newTeam2Score),
        videoUrl: newVideoUrl === "" ? null : newVideoUrl,
        date: new Date(newDate),
        stage: newStage,
        phase: newPhase,
        bracket: newPhase === "playoffs" ? newBracket : null,
        status: newStatus as 'scheduled' | 'completed',
      } satisfies CreateGameInput);
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
      refetch();
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
      case "status": origValue = orig.status; break;
      case "phase": origValue = orig.phase ?? 'qualifiers'; break;
      case "bracket": origValue = orig.bracket ?? ''; break;
    }
    setEditing({ id, field, value: origValue });
  };

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
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePhaseFilterChange = (value: string) => {
    setPhaseFilter(value);
    setCurrentPage(1);
  };

  const handleBracketFilterChange = (value: string) => {
    setBracketFilter(value);
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSeasonFilter("");
    setStageFilter("");
    setStatusFilter("");
    setPhaseFilter("");
    setBracketFilter("");
    setCurrentPage(1);
  };

  const handleImportSuccess = (result: ChallongeImportResult) => {
    setIsImportModalOpen(false);
    setImportResult(result);
    refetch();
  };

  const columns: GameColumn[] = [
    {
      key: "name",
      header: "Game",
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
          <span onClick={() => startEdit(g.id, "name")}>{g.name || `#${g.id}`}</span>
        ),
    },
    {
      key: "phase",
      header: "Phase",
      render: (g) =>
        editing?.id === g.id && editing?.field === "phase" ? (
          <select
            value={editing.value}
            onChange={e => setEditing({ ...editing, value: e.target.value })}
            onBlur={commitEdit}
            autoFocus
          >
            <option value="pre_season">Pre-Season</option>
            <option value="qualifiers">Qualifiers</option>
            <option value="playoffs">Playoffs</option>
          </select>
        ) : (
          <span onClick={() => startEdit(g.id, "phase")}>{g.phase ?? 'qualifiers'}</span>
        ),
    },
    {
      key: "bracket",
      header: "Bracket",
      render: (g) =>
        editing?.id === g.id && editing?.field === "bracket" ? (
          <select
            value={editing.value}
            onChange={e => setEditing({ ...editing, value: e.target.value })}
            onBlur={commitEdit}
            autoFocus
          >
            <option value="">—</option>
            <option value="winners">Winners</option>
            <option value="losers">Losers</option>
          </select>
        ) : (
          <span onClick={() => startEdit(g.id, "bracket")}>{g.bracket ?? '—'}</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (g) =>
        editing?.id === g.id && editing?.field === "status" ? (
          <select
            value={editing.value}
            onChange={e => setEditing({ ...editing, value: e.target.value })}
            onBlur={commitEdit}
            autoFocus
          >
            <option value="scheduled">scheduled</option>
            <option value="completed">completed</option>
          </select>
        ) : (
          <span onClick={() => startEdit(g.id, "status")}>{g.status}</span>
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
          <span onClick={() => startEdit(g.id, "stage")}>{formatGameStage(g)}</span>
        ),
    },
    {
      key: "stats",
      header: "Stats",
      render: (g) => (g.stats?.length ? '✓' : '—'),
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
      render: (g) => (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setStatUploadGame(g)} className="create-button" style={{ padding: '0.25rem 0.5rem' }}>
            Upload Stats
          </button>
          {user?.role === "superadmin" && (
            <button
              onClick={() => handleDelete(g.id)}
              disabled={deleting}
              className="game-btn-remove"
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <p>Loading games…</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="portal-main">
      {/* Search and Controls */}
      <div className="players-controls">
        <div className="players-controls-left">
          <button className="create-button" onClick={openModal}>Create Game</button>
          <button className="create-button" onClick={() => setIsImportModalOpen(true)}>Import from Challonge</button>
        </div>
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
      <FilterBar onReset={(searchQuery || seasonFilter || stageFilter || statusFilter || phaseFilter || bracketFilter) ? clearFilters : undefined}>
        <div className="filter-group">
          <select
            className="filter-select"
            aria-label="Season"
            value={seasonFilter}
            onChange={(e) => handleSeasonFilterChange(e.target.value)}
          >
            <option value="">{seasonsLoading ? "Loading seasons..." : "All Seasons"}</option>
            {uniqueSeasons.map(season => (
              <option key={season} value={season.toString()}>
                Season {season}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select
            className="filter-select"
            aria-label="Stage"
            value={stageFilter}
            onChange={(e) => handleStageFilterChange(e.target.value)}
          >
            <option value="">{stagesLoading ? "Loading stages..." : "All Stages"}</option>
            {uniqueStages.map(stage => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select className="filter-select" aria-label="Status" value={statusFilter} onChange={(e) => handleStatusFilterChange(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="filter-group">
          <select className="filter-select" aria-label="Phase" value={phaseFilter} onChange={(e) => handlePhaseFilterChange(e.target.value)}>
            <option value="">All Phases</option>
            <option value="pre_season">Pre-Season</option>
            <option value="qualifiers">Qualifiers</option>
            <option value="playoffs">Playoffs</option>
          </select>
        </div>

        <div className="filter-group">
          <select className="filter-select" aria-label="Bracket" value={bracketFilter} onChange={(e) => handleBracketFilterChange(e.target.value)}>
            <option value="">All Brackets</option>
            <option value="winners">Winners</option>
            <option value="losers">Losers</option>
          </select>
        </div>
      </FilterBar>

      <div className="results-counter">
        Showing {total === 0 ? 0 : ((currentPage - 1) * GAMES_PER_PAGE) + 1}-{Math.min(currentPage * GAMES_PER_PAGE, total)} of {total} games
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

          <label>
            Status
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ width: "100%", marginBottom: "0.75rem" }}>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
            </select>
          </label>

          <label>
            Phase
            <select
              value={newPhase ?? 'qualifiers'}
              onChange={(e) => {
                const phase = e.target.value as Game["phase"];
                setNewPhase(phase);
                if (phase !== "playoffs") setNewBracket(null);
              }}
              style={{ width: "100%", marginBottom: "0.75rem" }}
            >
              <option value="pre_season">Pre-Season</option>
              <option value="qualifiers">Qualifiers</option>
              <option value="playoffs">Playoffs</option>
            </select>
          </label>

          {newPhase === "playoffs" && (
            <label>
              Bracket
              <select
                value={newBracket ?? ""}
                onChange={(e) => setNewBracket(e.target.value === "" ? null : e.target.value as Game["bracket"])}
                style={{ width: "100%", marginBottom: "0.75rem" }}
              >
                <option value="">Auto (from stage)</option>
                <option value="winners">Winners</option>
                <option value="losers">Losers</option>
              </select>
            </label>
          )}

          <label>
            Stage
            <input
              type="text"
              value={newStage}
              onChange={(e) => setNewStage(e.target.value)}
              placeholder="e.g. Round 1, Round of 16, Finals"
              required
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

      {isImportModalOpen && (
        <ChallongeImport
          onImportSuccess={handleImportSuccess}
          onCancel={() => setIsImportModalOpen(false)}
        />
      )}

      <Modal isOpen={!!importResult} onClose={() => setImportResult(null)} title="Challonge Import Results">
        {importResult && (
          <div>
            <p>Created: {importResult.summary.created}</p>
            <p>Updated: {importResult.summary.updated}</p>
            <p>Skipped: {importResult.summary.skipped}</p>
          </div>
        )}
      </Modal>

      <GameStatUploadModal
        game={statUploadGame}
        isOpen={!!statUploadGame}
        onClose={() => setStatUploadGame(null)}
        onSuccess={refetch}
      />

      {/* Games Table */}
      <div className="users-table" style={{ marginTop: "1.5rem" }}>
        <Table
          columns={columns}
          rows={localGames}
          rowKey={(row) => row.id}
        />
      </div>
    </div>
  );
};

export default GamesPage;
