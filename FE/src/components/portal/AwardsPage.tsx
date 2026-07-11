import React, { useState, useEffect } from "react";
import { useSkinnyAwards, useSkinnySeasons } from "../../hooks/allFetch";
import { useAwardsMutations } from "../../hooks/allPatch";
import { useCreateAwards } from "../../hooks/allCreate";
import { useDeleteAwards } from "../../hooks/allDelete";
import { useAuth } from "../../context/authContext";
import type { Award } from "../../types/interfaces";
import SearchBar from "../Searchbar";
import Pagination from "../Pagination";
import Modal from "../ui/Modal";
import FilterBar from "../ui/FilterBar";
import Table from "../ui/Table";
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

const AWARDS_PER_PAGE = 10;

const AwardsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [seasonFilter, setSeasonFilter] = useState<string>("");
  const [awardTypeFilter, setAwardTypeFilter] = useState<string>("");

  const { data: awards, total, totalPages, loading, error, refetch } = useSkinnyAwards({
    page: currentPage,
    limit: AWARDS_PER_PAGE,
    search: searchQuery || undefined,
    seasonNumber: seasonFilter || undefined,
    type: awardTypeFilter || undefined,
  });
  const { data: seasons } = useSkinnySeasons({ page: 1, limit: 100 });
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
  const [newImageUrl, setNewImageUrl] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  useEffect(() => {
    setLocalAwards(awards);
  }, [awards]);

  const uniqueSeasons = (seasons ?? [])
    .map((season) => season.seasonNumber)
    .sort((a, b) => a - b);

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
      case "createdAt": payload.createdAt = value.toString(); break;
    }
    
    console.log('AwardsPage: Sending payload for createdAt update:', payload);

    try {
      const updated = await patchAward(id, payload);
      setLocalAwards((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updated } : a))
      );
      refetch();
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
      refetch();
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
      setFormError("Type, Description, Season, and Player Name are required.");
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
        refetch();
        closeModal();
      }
    } catch (err: any) {
      console.error('Error creating award:', err);
      setFormError(err.message || "Failed to create award");
    }
  };

  if (loading) return <p>Loading awards...</p>;
  if (error) return <p>Error: {error}</p>;

  const columns = [
    {
      key: "id",
      header: "ID",
      render: (award: Award) => award.id,
    },
    {
      key: "type",
      header: "Type",
      render: (award: Award) =>
        editing?.id === award.id && editing.field === "type" ? (
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
        ),
    },
    {
      key: "description",
      header: "Description",
      render: (award: Award) =>
        editing?.id === award.id && editing.field === "description" ? (
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
        ),
    },
    {
      key: "season",
      header: "Season",
      render: (award: Award) =>
        editing?.id === award.id && editing.field === "seasonId" ? (
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
        ),
    },
    {
      key: "player",
      header: "Player",
      render: (award: Award) =>
        editing?.id === award.id && editing.field === "playerName" ? (
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
        ),
    },
    {
      key: "createdAt",
      header: "Awarded Date",
      render: (award: Award) =>
        editing?.id === award.id && editing.field === "createdAt" ? (
          <input
            type="date"
            value={editing.value.slice(0, 10)} // Format for date input (YYYY-MM-DD)
            onChange={(e) =>
              setEditing({ ...editing, value: new Date(e.target.value + 'T00:00:00').toISOString() })
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
        ),
    },
    {
      key: "imageUrl",
      header: "Image",
      render: (award: Award) =>
        editing?.id === award.id && editing.field === "imageUrl" ? (
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
        ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (award: Award) =>
        user?.role === "superadmin" ? (
          <button
            onClick={() => handleDelete(award.id)}
            disabled={deleting}
            className="delete-button"
          >
            Delete
          </button>
        ) : (
          <span style={{ color: "#666", fontStyle: "italic" }}>No permissions</span>
        ),
    },
  ];

  return (
    <div className="portal-main">
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
      <FilterBar onReset={clearFilters}>
        <div className="filter-group">
          <select
            className="filter-select"
            aria-label="Season"
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
          <select
            className="filter-select"
            aria-label="Award type"
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
      </FilterBar>

      <div className="results-counter">
        Showing {total === 0 ? 0 : ((currentPage - 1) * AWARDS_PER_PAGE) + 1}-{Math.min(currentPage * AWARDS_PER_PAGE, total)} of {total} awards
      </div>

      {/* Awards Table */}
      <div className="table-container">
        <Table
          columns={columns}
          rows={localAwards as unknown as (Award & Record<string, unknown>)[]}
          rowKey={(award) => award.id}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Create New Award"
        className="award-create-modal"
      >
        {formError && <p className="award-modal-error">{formError}</p>}

        <form onSubmit={handleCreate} className="award-create-form">
          <div className="award-form-row award-form-row-2">
            <div className="form-group">
              <label htmlFor="awardType">Type*</label>
              <select
                id="awardType"
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
              <label htmlFor="awardSeason">Season*</label>
              <select
                id="awardSeason"
                value={newSeasonId || ""}
                onChange={(e) => setNewSeasonId(Number(e.target.value))}
                required
              >
                <option value="">Select a season</option>
                {seasons?.map((season) => (
                  <option key={season.id} value={season.id}>
                    Season {season.seasonNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="award-form-row award-form-row-2">
            <div className="form-group">
              <label htmlFor="awardPlayerName">Player Name*</label>
              <input
                id="awardPlayerName"
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value.toLowerCase())}
                placeholder="player name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="awardImageUrl">Image URL</label>
              <input
                id="awardImageUrl"
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="awardDescription">Description*</label>
            <textarea
              id="awardDescription"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Award description"
              required
            />
          </div>

          <div className="award-form-actions">
            <button type="button" onClick={closeModal} className="award-btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={creating} className="award-btn-submit">
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AwardsPage; 