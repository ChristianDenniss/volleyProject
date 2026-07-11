// src/components/portal/MatchesPage.tsx

import React, { useState, useEffect } from "react";
import { useMatches } from "../../hooks/allFetch";
import { useSkinnySeasons } from "../../hooks/allFetch";
import { useAuth } from "../../context/authContext";
import { useMatchMutations } from "../../hooks/allPatch";
import { useCreateMatches } from "../../hooks/allCreate";
import { useDeleteMatches } from "../../hooks/allDelete";

import type { Match } from "../../types/interfaces";
import SearchBar from "../Searchbar";
import Pagination from "../Pagination";
import ChallongeImport from "../ChallongeImport";
import Modal from "../ui/Modal";
import FilterBar from "../ui/FilterBar";
import Table from "../ui/Table";
import "../../styles/PlayersPage.css";
import "../../styles/PortalPlayersPage.css";
import "../../styles/MatchesPage.css";

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

const MATCHES_PER_PAGE = 10;
const MATCH_STATUSES = ["scheduled", "completed"] as const;

const MatchesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [seasonFilter, setSeasonFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [roundFilter, setRoundFilter] = useState<string>("");

  const { data: matches, total, totalPages, loading, error, refetch } = useMatches({
    page: currentPage,
    limit: MATCHES_PER_PAGE,
    search: searchQuery || undefined,
    seasonId: seasonFilter || undefined,
    status: statusFilter || undefined,
    round: roundFilter || undefined,
  });
  const { data: seasons } = useSkinnySeasons({ page: 1, limit: 100 });
  const { data: matchesSample } = useMatches({
    page: 1,
    limit: 100,
    seasonId: seasonFilter || undefined,
  });
  const { user } = useAuth();
  const { patchMatch } = useMatchMutations();
  const { createMatch } = useCreateMatches();
  const { deleteItem: deleteMatch } = useDeleteMatches();

  const [localMatches, setLocalMatches] = useState<Match[]>([]);
  const [editing, setEditing] = useState<EditingState | null>(null);

  // Modal state for creating a new match
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [newMatchNumber, setNewMatchNumber] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("scheduled");
  const [newRound, setNewRound] = useState<string>("");

  const [newDate, setNewDate] = useState<string>("");
  const [newTeam1Score, setNewTeam1Score] = useState<number | undefined>(undefined);
  const [newTeam2Score, setNewTeam2Score] = useState<number | undefined>(undefined);
  const [newSeasonId, setNewSeasonId] = useState<number>(0);
  const [newTeam1Name, setNewTeam1Name] = useState<string>("");
  const [newTeam2Name, setNewTeam2Name] = useState<string>("");
  const [newTags, setNewTags] = useState<string>(""); // Comma-separated tags
  const [formError, setFormError] = useState<string>("");

  useEffect(() => {
    setLocalMatches(matches as Match[]);
  }, [matches]);

  const uniqueSeasons = (seasons ?? [])
    .map((season) => season.id)
    .sort((a, b) => a - b);
  const uniqueRounds = Array.from(
    new Set((matchesSample ?? []).map((match) => match.round))
  ).sort();

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
        updateData[field] = value; // Send as string, backend will transform to Date
      } else if (field === "team1Score" || field === "team2Score") {
        updateData[field] = value === "" ? undefined : parseInt(value);
      } else if (field.startsWith("set") && field.endsWith("Score")) {
        // Handle set scores - they should be strings like "25-20" or null if empty
        updateData[field] = value.trim() === "" ? null : value.trim();
      }

      const updatedMatch = await patchMatch(id, updateData);
      setLocalMatches(prev =>
        prev.map(m => (m.id === id ? { ...m, ...updatedMatch, season: updatedMatch.season || m.season } : m))
      );
      refetch();
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
      await deleteMatch(id.toString());
      setLocalMatches(prev => prev.filter(m => m.id !== id));
      refetch();
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
    setNewSeasonId(0);
    setNewTeam1Name("");
    setNewTeam2Name("");
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

    if (!newMatchNumber || !newRound || !newDate || !newSeasonId || !newTeam1Name || !newTeam2Name) {
      setFormError("Please fill in all required fields");
      return;
    }

    try {
      const matchData: any = {
        matchNumber: newMatchNumber,
        status: newStatus as "scheduled" | "completed",
        round: newRound,
        phase: "qualifiers", // Default phase as required by backend
        region: "na", // Default region as required by backend
        date: newDate, // Backend expects 'date', not 'scheduledDate'
        team1Score: newTeam1Score,
        team2Score: newTeam2Score,
        seasonId: newSeasonId,
        team1Name: newTeam1Name,
        team2Name: newTeam2Name,
        tags: newTags ? newTags.split(',').map(tag => tag.trim()) : undefined
      };

      const newMatch = await createMatch(matchData);
      if (newMatch) {
        setLocalMatches(prev => [newMatch, ...prev]);
        refetch();
        closeModal();
        alert("Match created successfully!");
      }
    } catch (error) {
      console.error("Error creating match:", error);
      setFormError(error instanceof Error ? error.message : "Failed to create match");
    }
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

  // Row type used for the shared Table component (needs an index signature
  // to satisfy Table's generic constraint; behavior/typing of Match itself
  // is unaffected since MatchRow is a strict superset).
  type MatchRow = Match & Record<string, unknown>;

  type MatchColumn = {
    key: string;
    header: string;
    render: (row: MatchRow) => React.ReactNode;
  };

  const columns: MatchColumn[] = [
    {
      key: "matchNumber",
      header: "Match Number",
      render: (match) => (
        <div
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
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (match) => (
        <div
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
              onChange={async (e) => {
                setEditing({ ...editing, value: e.target.value });
                // Immediately commit the change for dropdown selections
                const { id, field } = editing;
                const orig = localMatches.find((m) => m.id === id);
                if (orig) {
                  try {
                    const updateData: any = {};
                    updateData[field] = e.target.value;
                    const updatedMatch = await patchMatch(id, updateData);
                    setLocalMatches(prev =>
                      prev.map(m => (m.id === id ? { ...m, ...updatedMatch, season: updatedMatch.season || m.season } : m))
                    );
                    refetch();
                    setEditing(null);
                  } catch (error) {
                    console.error("Error updating match status:", error);
                    alert("Failed to update match status");
                  }
                }
              }}
              onBlur={() => setEditing(null)}
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
        </div>
      ),
    },
    {
      key: "round",
      header: "Round",
      render: (match) => (
        <div
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
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (match) => (
        <div
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
        </div>
      ),
    },
    {
      key: "teams",
      header: "Teams",
      render: (match) => (
        <div className="team-info">
          <span>{match.team1Name || 'TBD'}</span>
          <span className="vs-separator">vs</span>
          <span>{match.team2Name || 'TBD'}</span>
        </div>
      ),
    },
    {
      key: "score",
      header: "Score",
      render: (match) => (
        <div className="score-container">
          {/* Team 1 Score */}
          <span
            style={{ cursor: "pointer" }}
            onClick={() =>
              setEditing({
                id: match.id,
                field: "team1Score",
                value: toStr("team1Score", match),
              })
            }
          >
            {editing?.id === match.id && editing?.field === "team1Score" ? (
              <input
                type="number"
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
                style={{ width: "50px" }}
              />
            ) : (
              match.team1Score ?? "-"
            )}
          </span>
          <span className="score-separator"> - </span>
          {/* Team 2 Score */}
          <span
            style={{ cursor: "pointer" }}
            onClick={() =>
              setEditing({
                id: match.id,
                field: "team2Score",
                value: toStr("team2Score", match),
              })
            }
          >
            {editing?.id === match.id && editing?.field === "team2Score" ? (
              <input
                type="number"
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
                style={{ width: "50px" }}
              />
            ) : (
              match.team2Score ?? "-"
            )}
          </span>
        </div>
      ),
    },
    {
      key: "setScores",
      header: "Set Scores",
      render: (match) => (
        <div className="set-scores">
          {(["set1Score", "set2Score", "set3Score", "set4Score", "set5Score"] as const).map((setField, index) => {
            const setScore = match[setField];
            const setNumber = index + 1;

            return (
              <span
                key={setField}
                style={{ cursor: "pointer", marginRight: "8px" }}
                onClick={() =>
                  setEditing({
                    id: match.id,
                    field: setField,
                    value: toStr(setField, match),
                  })
                }
              >
                {editing?.id === match.id && editing?.field === setField ? (
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
                    placeholder={`Set ${setNumber}`}
                    style={{ width: "60px" }}
                  />
                ) : (
                  <span className="set-score">
                    {setScore || `S${setNumber}`}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      ),
    },
    {
      key: "tags",
      header: "Tags",
      render: (match) => (
        match.tags && match.tags.length > 0 ? (
          <div className="tags-container">
            {match.tags.map((tag, index) => (
              <span key={index} className="tag-badge">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-muted">No tags</span>
        )
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (match) => (
        user?.role === "superadmin" ? (
          <button
            onClick={() => handleDelete(match.id)}
            className="delete-button"
          >
            Delete
          </button>
        ) : (
          <span className="text-muted">No permission</span>
        )
      ),
    },
  ];

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
        <FilterBar onReset={clearFilters}>
          <div className="filter-group">
            <label htmlFor="season-filter">Season:</label>
            <select
              id="season-filter"
              value={seasonFilter}
              onChange={(e) => handleSeasonFilterChange(e.target.value)}
            >
              <option value="">All Seasons</option>
              {uniqueSeasons.map(seasonId => {
                const season = seasons?.find((s) => s.id === seasonId);
                return (
                  <option key={seasonId} value={seasonId}>
                    Season {season?.seasonNumber ?? seasonId}
                  </option>
                );
              })}
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
              {MATCH_STATUSES.map(status => (
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
        </FilterBar>

        <div className="results-counter">
          Showing {total === 0 ? 0 : ((currentPage - 1) * MATCHES_PER_PAGE) + 1}-{Math.min(currentPage * MATCHES_PER_PAGE, total)} of {total} matches
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
        <Table
          columns={columns}
          rows={localMatches as unknown as MatchRow[]}
          rowKey={(row) => row.id}
        />
      </div>

      {/* Create Match Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="Create New Match">
            <form onSubmit={handleCreate} className="modal-form">
              <div className="modal-body">
                {/* Basic Information Row */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="matchNumber">Match Number *</label>
                    <input
                      type="text"
                      id="matchNumber"
                      value={newMatchNumber}
                      onChange={(e) => setNewMatchNumber(e.target.value)}
                      required
                      placeholder="e.g., Round 1 - Match 1"
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
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                             {/* Round and Date Row */}
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

              {/* Season and Team 1 Score Row */}
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

              {/* Team Names Row */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="team1Name">Team 1 Name *</label>
                  <input
                    type="text"
                    id="team1Name"
                    value={newTeam1Name}
                    onChange={(e) => setNewTeam1Name(e.target.value)}
                    placeholder="Enter team 1 name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="team2Name">Team 2 Name *</label>
                  <input
                    type="text"
                    id="team2Name"
                    value={newTeam2Name}
                    onChange={(e) => setNewTeam2Name(e.target.value)}
                    placeholder="Enter team 2 name"
                    required
                  />
                </div>
              </div>

              {/* Team 2 Score Row */}
              <div className="form-row">
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
                <div className="form-group">
                  <label htmlFor="tags">Tags (optional, comma-separated)</label>
                  <input
                    type="text"
                    id="tags"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="e.g., RVL, Invitational, D-League"
                  />
                </div>
              </div>

              

                {formError && (
                  <div className="error-message">
                    {formError}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="cancel-button">
                  Cancel
                </button>
                <button type="submit" className="create-button">
                  Create Match
                </button>
              </div>
            </form>
      </Modal>

      {/* Import Modal */}
      {isImportModalOpen && (
        <ChallongeImport
          onImportSuccess={() => {
            closeImportModal();
            // Refresh the matches data
            window.location.reload();
          }}
          onCancel={closeImportModal}
        />
      )}
    </div>
  );
};

export default MatchesPage; 