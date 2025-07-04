import React, { useState, useEffect } from "react";
import { useSkinnyAwards } from "../../hooks/allFetch";
import { useAwardsMutations } from "../../hooks/allPatch";
import { useCreateAwards } from "../../hooks/allCreate";
import { useDeleteAwards } from "../../hooks/allDelete";
import { useAuth } from "../../context/authContext";
import type { Award } from "../../types/interfaces";
import SearchBar from "../Searchbar";
import Pagination from "../Pagination";
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

type EditField = "type" | "description" | "seasonId" | "playerName" | "imageUrl" | "createdAt";

interface EditingState {
  id: number;
  field: EditField;
  value: string;
}

const AwardsPage: React.FC = () => {
  const { data: awards, loading, error } = useSkinnyAwards();
  const { patchAward } = useAwardsMutations();
  const { createAwards, loading: creating } = useCreateAwards();
  const { deleteItem: deleteAward, loading: deleting } = useDeleteAwards();
  const { user } = useAuth();

  const [localAwards, setLocalAwards] = useState<Award[]>([]);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const awardsPerPage = 10;

  // Filter states
  const [seasonFilter, setSeasonFilter] = useState<string>("");
  const [awardTypeFilter, setAwardTypeFilter] = useState<string>("");

  // Modal state for creating a new award
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newType, setNewType] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newSeasonId, setNewSeasonId] = useState<number>(0);
  const [newPlayerName, setNewPlayerName] = useState<string>("");
  const [newImageUrl, setNewImageUrl] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  useEffect(() => {
    if (awards) setLocalAwards(awards);
  }, [awards]);

  // Get unique seasons for filter options
  const uniqueSeasons = Array.from(new Set(localAwards.map(award => award.season.seasonNumber))).sort((a, b) => a - b);

  // Filter awards based on search query, season and award type
  const filteredAwards = localAwards.filter(award => {
    const matchesSearch = award.players[0]?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
    const matchesSeason = !seasonFilter || award.season.seasonNumber.toString() === seasonFilter;
    const matchesAwardType = !awardTypeFilter || award.type === awardTypeFilter;
    
    return matchesSearch && matchesSeason && matchesAwardType;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredAwards.length / awardsPerPage);
  const paginatedAwards = filteredAwards.slice(
    (currentPage - 1) * awardsPerPage,
    currentPage * awardsPerPage
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

  const handleAwardTypeFilterChange = (value: string) => {
    setAwardTypeFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSeasonFilter("");
    setAwardTypeFilter("");
    setCurrentPage(1);
  };

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
      case "imageUrl": origValue = orig.imageUrl || ""; break;
      case "createdAt": origValue = new Date(orig.createdAt).toISOString(); break;
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
      imageUrl: "Image URL",
      createdAt: "Award Date",
    };

    if (!window.confirm(`Change ${labelMap[field]} from "${origValue}" to "${value}"?`)) {
      setEditing(null);
      setIsSubmitting(false);
      return;
    }

    // Build payload
    const payload: Record<string, any> = {};
    switch (field) {
      case "type": payload.type = value; break;
      case "description": payload.description = value; break;
      case "seasonId": payload.seasonId = Number(value); break;
      case "playerName": payload.playerName = value.toLowerCase(); break;
      case "imageUrl": payload.imageUrl = value; break;
      case "createdAt": payload.createdAt = value; break;
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
    setNewImageUrl("");
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
      imageUrl: newImageUrl,
    };

    console.log('Creating award with payload:', payload);

    try {
      const created = await createAwards(payload);
      if (created) {
        setLocalAwards((prev) => [created, ...prev]);
        closeModal();
      }
    } catch (err: any) {
      console.error('Error creating award:', err);
      setFormError(err.message || "Failed to create award");
    }
  };

  if (loading) return <p>Loading awards...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="portal-main">
      <h1 className="users-title">Awards</h1>

      {/* Search and Controls */}
      <div className="players-controls">
        <button
          onClick={openModal}
          className="create-button"
        >
          Create Award
        </button>
        <div className="players-controls-right">
          <SearchBar onSearch={handleSearch} placeholder="Search player names..." />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container">
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
          <label className="filter-label">Award Type:</label>
          <select
            className="filter-select"
            value={awardTypeFilter}
            onChange={(e) => handleAwardTypeFilterChange(e.target.value)}
          >
            <option value="">All Award Types</option>
            {AWARD_TYPES.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {(searchQuery || seasonFilter || awardTypeFilter) && (
          <button
            className="clear-filters-button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        )}

        <div className="results-counter">
          Showing {((currentPage - 1) * awardsPerPage) + 1}-{Math.min(currentPage * awardsPerPage, filteredAwards.length)} of {filteredAwards.length} awards
        </div>
      </div>

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
              <th>Award Date</th>
              <th>Image</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAwards.map((award) => (
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
                <td>
                  {editing?.id === award.id && editing.field === "seasonId" ? (
                    <input
                      type="number"
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
                          field: "seasonId",
                          value: award.season.id.toString(),
                        })
                      }
                    >
                      {award.season.seasonNumber}
                    </span>
                  )}
                </td>
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
                  {editing?.id === award.id && editing.field === "createdAt" ? (
                    <input
                      type="datetime-local"
                      value={editing.value.slice(0, 16)} // Format for datetime-local input
                      onChange={(e) =>
                        setEditing({ ...editing, value: new Date(e.target.value).toISOString() })
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
                          field: "createdAt",
                          value: new Date(award.createdAt).toISOString(),
                        })
                      }
                    >
                      {new Date(award.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </td>
                <td>
                  {editing?.id === award.id && editing.field === "imageUrl" ? (
                    <input
                      type="url"
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
                      autoFocus
                    />
                  ) : (
                    <div
                      onClick={() =>
                        !isSubmitting && setEditing({
                          id: award.id,
                          field: "imageUrl",
                          value: award.imageUrl || "",
                        })
                      }
                      style={{ cursor: "pointer" }}
                    >
                      {award.imageUrl ? (
                        <img 
                          src={award.imageUrl} 
                          alt={`${award.type} award`} 
                          style={{ 
                            maxWidth: "80px",
                            maxHeight: "45px",
                            width: "auto",
                            height: "auto",
                            objectFit: "contain",
                            borderRadius: "4px"
                          }} 
                        />
                      ) : (
                        "No image"
                      )}
                    </div>
                  )}
                </td>
                <td>
                  {user?.role === "superadmin" ? (
                    <button
                      onClick={() => handleDelete(award.id)}
                      disabled={deleting}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  ) : (
                    <span style={{ color: "#666", fontStyle: "italic" }}>No permissions</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
              <div className="form-group">
                <label>Image URL:</label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
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
    </div>
  );
};

export default AwardsPage; 