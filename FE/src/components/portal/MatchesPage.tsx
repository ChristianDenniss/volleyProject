// src/components/portal/MatchesPage.tsx

import React, { useState, useEffect } from "react";
import { useMatches } from "../../hooks/useMatches";
import { useSeasons } from "../../hooks/allFetch";
import { useAuth } from "../../context/authContext";
import type { CreateMatchInput } from "../../types/interfaces";
import SearchBar from "../Searchbar";
import Pagination from "../Pagination";
import "../../styles/UsersPage.css";
import "../../styles/PlayersPage.css";
import "../../styles/PortalPlayersPage.css";
import "../../styles/MatchesPage.css";

// Define Match interface locally since it's not exported from interfaces
interface Match {
  id: number;
  matchNumber: string;
  status: 'scheduled' | 'completed';
  round: string;
  date: Date;
  team1Score?: number;
  team2Score?: number;
  set1Score?: string | null;
  set2Score?: string | null;
  set3Score?: string | null;
  set4Score?: string | null;
  set5Score?: string | null;
  challongeMatchId?: string;
  challongeTournamentId?: string;
  challongeRound?: number;
  tags?: string[]; // Array of tags like ["RVL", "Invitational", "D-League"]
  season: any;
  teams?: any[];
}

type EditField =
  | "matchNumber"
  | "status"
  | "round"
  | "date"
  | "team1Score"
  | "team2Score"
  | "set1Score"
  | "set2Score"
  | "set3Score"
  | "set4Score"
  | "set5Score";

interface EditingState {
  id: number;
  field: EditField;
  value: string;
}

const MatchesPage: React.FC = () => {
  const { data: matches, loading, error } = useMatches();
  const { data: seasons } = useSeasons();
  const { user } = useAuth();

  const [localMatches, setLocalMatches] = useState<Match[]>([]);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const matchesPerPage = 10;

  // Filter state
  const [seasonFilter, setSeasonFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [roundFilter, setRoundFilter] = useState<string>("");

  // Modal state for creating a new match
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [newMatchNumber, setNewMatchNumber] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("scheduled");
  const [newRound, setNewRound] = useState<string>("");
  const [newDate, setNewDate] = useState<string>("");
  const [newTeam1Score, setNewTeam1Score] = useState<number | undefined>(undefined);
  const [newTeam2Score, setNewTeam2Score] = useState<number | undefined>(undefined);
  const [newSetScores, setNewSetScores] = useState<string[]>(["", "", "", "", ""]);
  const [newSeasonId, setNewSeasonId] = useState<number>(0);
  const [newTeamIds, setNewTeamIds] = useState<number[]>([0, 0]);
  const [newTags, setNewTags] = useState<string>(""); // Comma-separated tags
  const [formError, setFormError] = useState<string>("");

  useEffect(() => {
    if (matches) setLocalMatches(matches);
  }, [matches]);

  // Get unique seasons, statuses, and rounds for filter options
  const uniqueSeasons = Array.from(new Set(localMatches.map(match => match.season.id))).sort((a, b) => a - b);
  const uniqueStatuses = Array.from(new Set(localMatches.map(match => match.status)));
  const uniqueRounds = Array.from(new Set(localMatches.map(match => match.round))).sort();

  // Filter matches based on search query and filters
  const filteredMatches = localMatches.filter(match => {
    const matchesSearch = match?.matchNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
    const matchesSeason = !seasonFilter || match.season.id.toString() === seasonFilter;
    const matchesStatus = !statusFilter || match.status === statusFilter;
    const matchesRound = !roundFilter || match.round === roundFilter;
    
    return matchesSearch && matchesSeason && matchesStatus && matchesRound;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredMatches.length / matchesPerPage);
  const paginatedMatches = filteredMatches.slice(
    (currentPage - 1) * matchesPerPage,
    currentPage * matchesPerPage
  );

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Handle filter changes
  const handleSeasonFilterChange = (value: string) => {
    setSeasonFilter(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleRoundFilterChange = (value: string) => {
    setRoundFilter(value);
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSeasonFilter("");
    setStatusFilter("");
    setRoundFilter("");
    setCurrentPage(1);
  };

  // Commit inline edits
  const commitEdit = async () => {
    if (!editing) return;
    const { id, field, value } = editing;
    const orig = localMatches.find((m) => m.id === id);
    if (!orig) {
      setEditing(null);
      return;
    }

    try {
      const updateData: any = {};
      updateData[field] = value;

      // Handle special field types
      if (field === "date") {
        updateData[field] = new Date(value);
      } else if (field === "team1Score" || field === "team2Score") {
        updateData[field] = value === "" ? undefined : parseInt(value);
      }

      const response = await fetch(`/api/matches/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Failed to update match");
      }

      const updatedMatch = await response.json();
      setLocalMatches(prev =>
        prev.map(m => (m.id === id ? updatedMatch : m))
      );
      setEditing(null);
    } catch (error) {
      console.error("Error updating match:", error);
      alert("Failed to update match");
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this match?")) return;

    try {
      const response = await fetch(`/api/matches/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete match");
      }

      setLocalMatches(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error("Error deleting match:", error);
      alert("Failed to delete match");
    }
  };

  // Modal functions
  const openModal = () => {
    setIsModalOpen(true);
    setFormError("");
    setNewMatchNumber("");
    setNewStatus("scheduled");
    setNewRound("");
    setNewDate("");
    setNewTeam1Score(undefined);
    setNewTeam2Score(undefined);
    setNewSetScores(["", "", "", "", ""]);
    setNewSeasonId(0);
    setNewTeamIds([0, 0]);
    setNewTags("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError("");
  };

  const openImportModal = () => {
    setIsImportModalOpen(true);
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
  };

  // Handle create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!newMatchNumber || !newRound || !newDate || !newSeasonId || newTeamIds[0] === 0 || newTeamIds[1] === 0) {
      setFormError("Please fill in all required fields");
      return;
    }

    try {
      const matchData: CreateMatchInput = {
        matchNumber: newMatchNumber,
        status: newStatus as "scheduled" | "completed",
        round: newRound,
        scheduledDate: newDate,
        team1Score: newTeam1Score,
        team2Score: newTeam2Score,
        seasonId: newSeasonId,
        teamIds: newTeamIds,
        tags: newTags ? newTags.split(',').map(tag => tag.trim()) : undefined
      };

      const response = await fetch("/api/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(matchData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create match");
      }

      const newMatch = await response.json();
      setLocalMatches(prev => [newMatch, ...prev]);
      closeModal();
      alert("Match created successfully!");
    } catch (error) {
      console.error("Error creating match:", error);
      setFormError(error instanceof Error ? error.message : "Failed to create match");
    }
  };

  // Handle set score change
  const handleSetScoreChange = (index: number, value: string) => {
    const newScores = [...newSetScores];
    newScores[index] = value;
    setNewSetScores(newScores);
  };

  // Helper function to convert field values to strings for editing
  const toStr = (field: EditField, match: Match) => {
    const value = match[field];
    if (value === null || value === undefined) return "";
    if (field === "date") {
      return new Date(value).toISOString().slice(0, 16);
    }
    return value.toString();
  };

  if (loading) return <div className="loading">Loading matches...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="portal-page">
      <div className="page-header">
        <h1>Matches Management</h1>
        <div className="header-actions">
          <button onClick={openImportModal} className="import-button">
            Import from Challonge
          </button>
          <button onClick={openModal} className="create-button">
            Create Match
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="season-filter">Season:</label>
            <select
              id="season-filter"
              value={seasonFilter}
              onChange={(e) => handleSeasonFilterChange(e.target.value)}
            >
              <option value="">All Seasons</option>
              {uniqueSeasons.map(seasonId => (
                <option key={seasonId} value={seasonId}>
                  Season {seasonId}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="status-filter">Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="round-filter">Round:</label>
            <select
              id="round-filter"
              value={roundFilter}
              onChange={(e) => handleRoundFilterChange(e.target.value)}
            >
              <option value="">All Rounds</option>
              {uniqueRounds.map(round => (
                <option key={round} value={round}>
                  {round}
                </option>
              ))}
            </select>
          </div>

          {(searchQuery || seasonFilter || statusFilter || roundFilter) && (
            <button onClick={clearFilters} className="clear-filters-button">
              Clear Filters
            </button>
          )}
        </div>

        <div className="search-row">
          <SearchBar 
            onSearch={handleSearch} 
            placeholder="Search matches..." 
            className="matches-search-bar"
          />
          <div className="pagination-wrapper">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      {/* Matches Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Match Number</th>
              <th>Status</th>
              <th>Round</th>
              <th>Date</th>
              <th>Teams</th>
              <th>Score</th>
              <th>Set Scores</th>
              <th>Tags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMatches.map((match) => (
              <tr key={match.id}>
                {/* Match Number */}
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setEditing({
                      id: match.id,
                      field: "matchNumber",
                      value: toStr("matchNumber", match),
                    })
                  }
                >
                  {editing?.id === match.id && editing?.field === "matchNumber" ? (
                    <input
                      type="text"
                      value={editing.value}
                      onChange={(e) =>
                        setEditing({ ...editing, value: e.target.value })
                      }
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                        if (e.key === "Escape") {
                          setEditing(null);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    match.matchNumber
                  )}
                </td>

                {/* Status */}
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setEditing({
                      id: match.id,
                      field: "status",
                      value: toStr("status", match),
                    })
                  }
                >
                  {editing?.id === match.id && editing?.field === "status" ? (
                    <select
                      value={editing.value}
                      onChange={(e) =>
                        setEditing({ ...editing, value: e.target.value })
                      }
                      onBlur={commitEdit}
                      autoFocus
                    >
                      <option value="scheduled">scheduled</option>
                      <option value="completed">completed</option>
                    </select>
                  ) : (
                    <span className={`status-badge ${match.status}`}>
                      {match.status}
                    </span>
                  )}
                </td>

                {/* Round */}
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setEditing({
                      id: match.id,
                      field: "round",
                      value: toStr("round", match),
                    })
                  }
                >
                  {editing?.id === match.id && editing?.field === "round" ? (
                    <input
                      type="text"
                      value={editing.value}
                      onChange={(e) =>
                        setEditing({ ...editing, value: e.target.value })
                      }
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                        if (e.key === "Escape") {
                          setEditing(null);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    match.round
                  )}
                </td>

                {/* Date */}
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setEditing({
                      id: match.id,
                      field: "date",
                      value: toStr("date", match),
                    })
                  }
                >
                  {editing?.id === match.id && editing?.field === "date" ? (
                    <input
                      type="datetime-local"
                      value={editing.value}
                      onChange={(e) =>
                        setEditing({ ...editing, value: e.target.value })
                      }
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                        if (e.key === "Escape") {
                          setEditing(null);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    new Date(match.date).toLocaleDateString()
                  )}
                </td>

                {/* Teams */}
                <td>
                  {match.teams?.map((team, index) => (
                    <div key={team.id} className="team-info">
                      {team.logoUrl && (
                        <img 
                          src={team.logoUrl} 
                          alt={`${team.name} logo`} 
                          className="team-logo-small"
                        />
                      )}
                      <span>{team.name}</span>
                      {index === 0 && <span className="vs-separator">vs</span>}
                    </div>
                  ))}
                </td>

                {/* Score */}
                <td>
                  {match.status === "completed" && match.team1Score !== undefined && match.team2Score !== undefined ? (
                    <span className="score">
                      {match.team1Score} - {match.team2Score}
                    </span>
                  ) : (
                    <span className="text-muted">TBD</span>
                  )}
                </td>

                {/* Set Scores */}
                <td>
                  {match.status === "completed" && (
                    <div className="set-scores">
                      {[match.set1Score, match.set2Score, match.set3Score, match.set4Score, match.set5Score]
                        .filter(score => score !== null && score !== undefined)
                        .map((setScore, index) => (
                          <span key={index} className="set-score">
                            {setScore}
                          </span>
                        ))}
                    </div>
                  )}
                </td>

                {/* Tags */}
                <td>
                  {match.tags && match.tags.length > 0 ? (
                    <div className="tags-container">
                      {match.tags.map((tag, index) => (
                        <span key={index} className="tag-badge">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted">No tags</span>
                  )}
                </td>

                {/* Actions */}
                <td>
                  {user?.role === "superadmin" ? (
                    <button
                      onClick={() => handleDelete(match.id)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  ) : (
                    <span className="text-muted">No permission</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Match Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create New Match</h2>
              <button onClick={closeModal} className="close-button">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="matchNumber">Match Number *</label>
                  <input
                    type="text"
                    id="matchNumber"
                    value={newMatchNumber}
                    onChange={(e) => setNewMatchNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="status">Status *</label>
                  <select
                    id="status"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    required
                  >
                    <option value="scheduled">scheduled</option>
                    <option value="completed">completed</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="round">Round *</label>
                  <input
                    type="text"
                    id="round"
                    value={newRound}
                    onChange={(e) => setNewRound(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input
                    type="datetime-local"
                    id="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="seasonId">Season *</label>
                  <select
                    id="seasonId"
                    value={newSeasonId || ""}
                    onChange={(e) => setNewSeasonId(parseInt(e.target.value))}
                    required
                  >
                    <option value="">Select Season</option>
                    {seasons?.map(season => (
                      <option key={season.id} value={season.id}>
                        Season {season.seasonNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="team1Score">Team 1 Score</label>
                  <input
                    type="number"
                    id="team1Score"
                    value={newTeam1Score || ""}
                    onChange={(e) => setNewTeam1Score(e.target.value ? parseInt(e.target.value) : undefined)}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="team1Id">Team 1 *</label>
                  <select
                    id="team1Id"
                    value={newTeamIds[0] || ""}
                    onChange={(e) => {
                      const newIds = [...newTeamIds];
                      newIds[0] = parseInt(e.target.value);
                      setNewTeamIds(newIds);
                    }}
                    required
                  >
                    <option value="">Select Team 1</option>
                    {/* This would need to be populated with teams from the selected season */}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="team2Score">Team 2 Score</label>
                  <input
                    type="number"
                    id="team2Score"
                    value={newTeam2Score || ""}
                    onChange={(e) => setNewTeam2Score(e.target.value ? parseInt(e.target.value) : undefined)}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="team2Id">Team 2 *</label>
                  <select
                    id="team2Id"
                    value={newTeamIds[1] || ""}
                    onChange={(e) => {
                      const newIds = [...newTeamIds];
                      newIds[1] = parseInt(e.target.value);
                      setNewTeamIds(newIds);
                    }}
                    required
                  >
                    <option value="">Select Team 2</option>
                    {/* This would need to be populated with teams from the selected season */}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Set Scores (optional)</label>
                <div className="set-scores-inputs">
                  {newSetScores.map((score, index) => (
                    <input
                      key={index}
                      type="text"
                      placeholder={`Set ${index + 1} (e.g., 25-20)`}
                      value={score}
                      onChange={(e) => handleSetScoreChange(index, e.target.value)}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Tags (optional, comma-separated)</label>
                <input
                  type="text"
                  id="tags"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="e.g., RVL, Invitational, D-League"
                />
              </div>

              {formError && (
                <div className="error-message">
                  {formError}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="cancel-button">
                  Cancel
                </button>
                <button type="submit" className="create-button">
                  Create Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Import from Challonge</h2>
              <button onClick={closeImportModal} className="close-button">&times;</button>
            </div>
            <div className="modal-content">
              <p>This feature allows you to import matches from a Challonge tournament.</p>
              <p>Please use the import functionality from the main schedules page for now.</p>
              <div className="modal-actions">
                <button onClick={closeImportModal} className="cancel-button">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchesPage; 