// src/pages/PlayersPage.tsx

import React, { useState, useEffect } from "react";
import { usePlayers }                     from "../../hooks/allFetch";
import { usePlayerMutations }             from "../../hooks/allPatch";
import { useBatchPlayersByTeamName }      from "../../hooks/useCreatePlayers";
import { useDeletePlayers }               from "../../hooks/allDelete";
import { useAuth }                        from "../../context/authContext";
import { useRegion }                      from "../../context/regionContext";
import type { Player }                    from "../../types/interfaces";
import "../../styles/PlayersPage.css";
import "../../styles/PortalPlayersPage.css";
import {
  createButton,
  playersControls,
  playersControlsRight,
  portalMain,
  resultsCounter,
  textMuted,
} from "./portalPageStyles";
import SearchBar                          from "../Searchbar";
import Pagination                         from "../Pagination";
import Modal                              from "../ui/Modal";
import Table, { type TableColumn }        from "../ui/Table";
import OverflowListCell                   from "../ui/OverflowListCell";
import RegionSeasonFields                 from "../ui/RegionSeasonFields";
import { useFormRegionSeason }            from "../../hooks/useFormRegionSeason";
import { useDebouncedValue }              from "../../hooks/useDebouncedValue";

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

const playerModalError = "text-[#dc2626] mb-[0.5rem] text-[0.875rem]";

const playerForm = "player-form flex flex-col gap-[1rem]";

const playerFormHeader =
  "grid grid-cols-[minmax(140px,1fr)_minmax(120px,1fr)_minmax(220px,2fr)_auto] gap-[0.75rem] items-center " +
  "text-[0.8125rem] font-semibold text-text-muted pb-[0.25rem] border-b border-border " +
  "upto-md:hidden";

const playerFormRows = "flex flex-col gap-[0.75rem]";

const playerFormRow =
  "grid grid-cols-[minmax(140px,1fr)_minmax(120px,1fr)_minmax(220px,2fr)_auto] gap-[0.75rem] items-center " +
  "upto-md:grid-cols-[1fr] upto-md:p-[0.75rem] upto-md:border upto-md:border-border upto-md:rounded-[0.5rem]";

const playerFormRowSpacer = "w-[4.75rem] upto-md:hidden";

const playerInput =
  "py-[0.5rem] px-[0.75rem] border border-[#e2e8f0] rounded-[0.375rem] text-[0.875rem] w-full min-w-0 box-border " +
  "focus:outline-none focus:border-brand-primary focus:shadow-[0_0_0_2px_rgba(45,60,80,0.1)]";

const playerInputTeams = `${playerInput} min-w-0`;

const playerBtnRemove =
  "bg-[#dc2626] text-white border-none rounded-[0.25rem] py-[0.5rem] px-[0.75rem] text-[0.875rem] " +
  "cursor-pointer whitespace-nowrap self-center h-fit upto-md:justify-self-start";

const playerFormActions =
  "flex flex-wrap gap-[0.75rem] items-center pt-[0.75rem] border-t border-border";

const playerBtnAdd =
  "bg-brand-primary text-white border-none rounded-[0.25rem] py-[0.5rem] px-[1rem] text-[0.875rem] " +
  "cursor-pointer w-auto inline-block h-auto";

const playerBtnSubmit =
  "py-[0.5rem] px-[1rem] rounded-[0.25rem] bg-brand-primary text-white border-none text-[0.875rem] " +
  "cursor-pointer w-auto inline-block h-auto disabled:bg-[#63686f] disabled:cursor-not-allowed";

const PlayersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { regionQuery } = useRegion();
  const formRegionSeason = useFormRegionSeason("id");

  const { data: players, total, totalPages, loading, error, refetch } = usePlayers({
    page: currentPage,
    limit: PLAYERS_PER_PAGE,
    search: debouncedSearch || undefined,
    ...regionQuery,
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
    setLocalPlayers(players ?? []);
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

    if (!formRegionSeason.regionId || formRegionSeason.seasonValue === "") {
      setFormError("Region and season are required.");
      return;
    }

    const payload = {
      seasonId: formRegionSeason.seasonValue as number,
      players: batchRows.map((row) => {
        const teamNamesArray = row.teamNamesCSV
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s.length > 0);

        return {
          name:      row.name.trim(),
          position:  row.position.trim(),
          teamNames: teamNamesArray,
        };
      }),
    };

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
          onClick={() => setEditing({ id: p.id, field: "position", value: p.position ?? "" })}
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
            p.position || "Unknown"
          )}
        </span>
      ),
    },
    {
      key: "teams",
      header: "Teams",
      render: (p) => (
        <OverflowListCell
          items={p.teams?.map((team) => team.name) ?? []}
          maxVisible={2}
          emptyLabel={<span className={textMuted}>No teams</span>}
          popoverTitle="Teams"
        />
      ),
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
            <span className={textMuted}>No permission</span>
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
    <div className={portalMain}>
      {/* Search and Controls */}
      <div className={playersControls}>
        <button className={createButton} onClick={() => {
          formRegionSeason.initFromActiveRegion();
          setIsModalOpen(true);
        }}>
          Create Players
        </button>
        <div className={playersControlsRight}>
          <SearchBar onSearch={handleSearch} placeholder="Search players..." />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <div className={resultsCounter}>
        Showing {total === 0 ? 0 : ((currentPage - 1) * PLAYERS_PER_PAGE) + 1}-{Math.min(currentPage * PLAYERS_PER_PAGE, total)} of {total} players
      </div>

      {/* Modal for Submitting Players */}
      <Modal
        isOpen={isModalOpen}
        className="player-batch-modal"
        onClose={() => {
          setIsModalOpen(false);
          setBatchRows([{ name: "", position: "", teamNamesCSV: "" }]);
          setFormError("");
        }}
        title="Batch Create Players"
      >
        {formError && (
          <p className={playerModalError}>{formError}</p>
        )}
        {batchError && (
          <p className={playerModalError}>{batchError}</p>
        )}

        <form onSubmit={handleBatchCreate} className={playerForm}>
          <RegionSeasonFields
            regions={formRegionSeason.regions}
            regionsLoading={formRegionSeason.regionsLoading}
            regionId={formRegionSeason.regionId}
            onRegionChange={formRegionSeason.setRegionId}
            seasons={formRegionSeason.seasons}
            seasonsLoading={formRegionSeason.seasonsLoading}
            seasonValue={formRegionSeason.seasonValue}
            onSeasonChange={formRegionSeason.setSeasonValue}
            seasonValueKey="id"
          />

          <div className={playerFormHeader} aria-hidden="true">
            <span>Name*</span>
            <span>Position*</span>
            <span>Teams</span>
            <span />
          </div>

          <div className={playerFormRows}>
            {batchRows.map((row, idx) => (
              <div key={idx} className={playerFormRow}>
                <input
                  type="text"
                  placeholder="Player name"
                  className={playerInput}
                  value={row.name}
                  onChange={(e) => {
                    const updated = [...batchRows];
                    updated[idx].name = e.target.value;
                    setBatchRows(updated);
                  }}
                  required
                />

                <input
                  type="text"
                  placeholder="e.g. OH, S, MB"
                  className={playerInput}
                  value={row.position}
                  onChange={(e) => {
                    const updated = [...batchRows];
                    updated[idx].position = e.target.value;
                    setBatchRows(updated);
                  }}
                  required
                />

                <input
                  type="text"
                  placeholder="Team names (comma-separated)"
                  className={playerInputTeams}
                  value={row.teamNamesCSV}
                  onChange={(e) => {
                    const updated = [...batchRows];
                    updated[idx].teamNamesCSV = e.target.value;
                    setBatchRows(updated);
                  }}
                />

                {batchRows.length > 1 ? (
                  <button
                    type="button"
                    className={playerBtnRemove}
                    onClick={() => removeRow(idx)}
                  >
                    Remove
                  </button>
                ) : (
                  <span className={playerFormRowSpacer} />
                )}
              </div>
            ))}
          </div>

          <div className={playerFormActions}>
            <button
              type="button"
              className={playerBtnAdd}
              onClick={addRow}
            >
              + Add Another
            </button>

            <button
              type="submit"
              className={playerBtnSubmit}
              disabled={batchLoading}
            >
              {batchLoading ? "Creating…" : "Submit All"}
            </button>
          </div>
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
