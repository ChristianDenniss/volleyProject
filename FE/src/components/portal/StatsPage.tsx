// src/pages/StatsPage.tsx

import React, { useState, useEffect } from "react";
import { useStats }                  from "../../hooks/allFetch";
import { useStatsMutations }          from "../../hooks/allPatch";
import { useCreateStats }            from "../../hooks/allCreate";
import { useDeleteStats }            from "../../hooks/allDelete";
import { useAuth }                   from "../../context/authContext";
import type { Stats }                from "../../types/interfaces";
import "../../styles/UsersPage.css"; // reuse table & text-muted styles
import "../../styles/GamesPage.css"; // reuse table & text-muted styles

// Define the fields eligible for inline editing
type EditField =
    | "spikingErrors"
    | "apeKills"
    | "apeAttempts"
    | "spikeKills"
    | "spikeAttempts"
    | "assists"
    | "settingErrors"
    | "blocks"
    | "digs"
    | "blockFollows"
    | "aces"
    | "servingErrors"
    | "miscErrors"
    | "playerId";

interface EditingState {
    id:    number;
    field: EditField;
    value: string;
}

const StatsPage: React.FC = () =>
{
    // Retrieve stats list from API
    const { data: stats, loading, error } = useStats();

    // Destructure mutation functions for patching stats
    const { patchStats }                 = useStatsMutations();

    // Destructure creation hook for new stats
    const { createStats, loading: creating, error: createError } = useCreateStats();

    // Destructure deletion hook for stats
    const { deleteItem: deleteStat, loading: deleting, error: deleteError } = useDeleteStats();

    // Retrieve current user (for permission checks)
    const { user }                      = useAuth();

    // Local copy of stats for inline editing and immediate UI updates
    const [ localStats, setLocalStats ] = useState<Stats[]>([]);

    // Track which cell is being edited
    const [ editing, setEditing ]       = useState<EditingState | null>(null);

    // Modal state for creating a new stats record
    const [ isModalOpen, setIsModalOpen ]           = useState<boolean>(false);
    const [ newSpikingErrors, setNewSpikingErrors ] = useState<number>(0);
    const [ newApeKills, setNewApeKills ]           = useState<number>(0);
    const [ newApeAttempts, setNewApeAttempts ]     = useState<number>(0);
    const [ newSpikeKills, setNewSpikeKills ]       = useState<number>(0);
    const [ newSpikeAttempts, setNewSpikeAttempts ] = useState<number>(0);
    const [ newAssists, setNewAssists ]             = useState<number>(0);
    const [ newSettingErrors, setNewSettingErrors ] = useState<number>(0);
    const [ newBlocks, setNewBlocks ]               = useState<number>(0);
    const [ newDigs, setNewDigs ]                   = useState<number>(0);
    const [ newBlockFollows, setNewBlockFollows ]   = useState<number>(0);
    const [ newAces, setNewAces ]                   = useState<number>(0);
    const [ newServingErrors, setNewServingErrors ] = useState<number>(0);
    const [ newMiscErrors, setNewMiscErrors ]       = useState<number>(0);
    const [ newPlayerId, setNewPlayerId ]           = useState<number>(0);
    const [ formError, setFormError ]               = useState<string>("");

    // Initialize localStats when data is fetched
    useEffect(() =>
    {
        if (stats)
        {
            setLocalStats(stats);
        }
    }, [stats]);

    // Commit inline edits to the server and update local state
    const commitEdit = async () =>
    {
        if (!editing)
        {
            return;
        }

        const { id, field, value } = editing;

        // Find the original stats record by ID
        const orig = localStats.find((s) => s.id === id);
        if (!orig)
        {
            setEditing(null);
            return;
        }

        // Retrieve original value as string for comparison
        const origValue = orig[field].toString();

        // If the value did not change, cancel editing
        if (value === origValue)
        {
            setEditing(null);
            return;
        }

        // Mapping of field keys to human-readable labels
        const labelMap: Record<EditField, string> = {
            spikingErrors: "Spiking Errors",
            apeKills:      "Ape Kills",
            apeAttempts:   "Ape Attempts",
            spikeKills:    "Spike Kills",
            spikeAttempts: "Spike Attempts",
            assists:       "Assists",
            settingErrors: "Setting Errors",
            blocks:        "Blocks",
            digs:          "Digs",
            blockFollows:  "Block Follows",
            aces:          "Aces",
            servingErrors: "Serving Errors",
            miscErrors:    "Misc Errors",
            playerId:      "Player ID",
        };

        // Confirm with the user before saving changes
        if (!window.confirm(`Change ${labelMap[field]} from "${origValue}" to "${value}"?`))
        {
            setEditing(null);
            return;
        }

        // Build payload for partial update
        const payload: Partial<Stats> & Record<string, any> = {};

        // Assign the new value to the correct field in payload
        payload[field] = Number(value);

        try
        {
            // Send patch request
            const updated = await patchStats(id, payload);

            // Update local state with updated record
            setLocalStats((prev) =>
                prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
            );
        }
        catch (err: any)
        {
            console.error(err);
            alert("Failed to save changes:\n" + err.message);
        }
        finally
        {
            // Exit editing mode
            setEditing(null);
        }
    };

    // Delete handler (superadmin only)
    const handleDelete = async (id: number) =>
    {
        if (user?.role !== "superadmin")
        {
            return;
        }

        // Confirm deletion with the user
        if (!window.confirm("Are you sure you want to delete this stats record?"))
        {
            return;
        }

        // Call delete hook
        const wasDeleted = await deleteStat(id.toString());
        if (wasDeleted)
        {
            // Remove from local state if deletion succeeded
            setLocalStats((prev) => prev.filter((s) => s.id !== id));
        }
    };

    // Open create modal and reset form state
    const openModal = () =>
    {
        setIsModalOpen(true);
        setFormError("");
        setNewSpikingErrors(0);
        setNewApeKills(0);
        setNewApeAttempts(0);
        setNewSpikeKills(0);
        setNewSpikeAttempts(0);
        setNewAssists(0);
        setNewSettingErrors(0);
        setNewBlocks(0);
        setNewDigs(0);
        setNewBlockFollows(0);
        setNewAces(0);
        setNewServingErrors(0);
        setNewMiscErrors(0);
        setNewPlayerId(0);
    };

    // Close create modal and reset form error
    const closeModal = () =>
    {
        setIsModalOpen(false);
        setFormError("");
    };

    // Create new stats record handler
    const handleCreate = async (e: React.FormEvent) =>
    {
        e.preventDefault();

        // Validate required field: playerId must be > 0
        if (newPlayerId <= 0)
        {
            setFormError("Player ID is required and must be greater than 0.");
            return;
        }

        // Construct payload according to CreateStatsInput
        const payload = {
            spikingErrors: newSpikingErrors,
            apeKills:      newApeKills,
            apeAttempts:   newApeAttempts,
            spikeKills:    newSpikeKills,
            spikeAttempts: newSpikeAttempts,
            assists:       newAssists,
            settingErrors: newSettingErrors,
            blocks:        newBlocks,
            digs:          newDigs,
            blockFollows:  newBlockFollows,
            aces:          newAces,
            servingErrors: newServingErrors,
            miscErrors:    newMiscErrors,
            playerId:      newPlayerId,
        };

        try
        {
            // Call hook to create stats record
            const created = await createStats(payload);
            if (created)
            {
                // Prepend new record to local state
                setLocalStats((prev) => [created, ...prev]);
                closeModal();
            }
        }
        catch
        {
            // Creation errors are shown by the hook
        }
    };

    // Display loading or error states
    if (loading)
    {
        return <p>Loading stats…</p>;
    }

    if (error)
    {
        return <p>Error: {error}</p>;
    }

    return (
        <div className="portal-main">
            <h1 className="users-title">Stats</h1>

            {/* Button to open modal for creating a new stats record */}
            <button className="create-button" onClick={openModal}>
                Create Stat
            </button>

            {/* Create Modal */}
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
                        {/* Close button */}
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

                        <h2 style={{ marginTop: 0 }}>New Stat</h2>

                        {/* Display form validation error */}
                        {formError && (
                            <p className="error" style={{ color: "red", marginBottom: "0.5rem" }}>
                                {formError}
                            </p>
                        )}

                        <form onSubmit={handleCreate}>
                            {/* Spiking Errors */}
                            <label>
                                Spiking Errors
                                <input
                                    type="number"
                                    value={newSpikingErrors}
                                    onChange={(e) => setNewSpikingErrors(Number(e.target.value))}
                                    min="0"
                                    style={{ width: "100%", marginBottom: "0.75rem" }}
                                />
                            </label>

                            {/* Ape Kills */}
                            <label>
                                Ape Kills
                                <input
                                    type="number"
                                    value={newApeKills}
                                    onChange={(e) => setNewApeKills(Number(e.target.value))}
                                    min="0"
                                    style={{ width: "100%", marginBottom: "0.75rem" }}
                                />
                            </label>

                            {/* Ape Attempts */}
                            <label>
                                Ape Attempts
                                <input
                                    type="number"
                                    value={newApeAttempts}
                                    onChange={(e) => setNewApeAttempts(Number(e.target.value))}
                                    min="0"
                                    style={{ width: "100%", marginBottom: "0.75rem" }}
                                />
                            </label>

                            {/* Spike Kills */}
                            <label>
                                Spike Kills
                                <input
                                    type="number"
                                    value={newSpikeKills}
                                    onChange={(e) => setNewSpikeKills(Number(e.target.value))}
                                    min="0"
                                    style={{ width: "100%", marginBottom: "0.75rem" }}
                                />
                            </label>

                            {/* Spike Attempts */}
                            <label>
                                Spike Attempts
                                <input
                                    type="number"
                                    value={newSpikeAttempts}
                                    onChange={(e) => setNewSpikeAttempts(Number(e.target.value))}
                                    min="0"
                                    style={{ width: "100%", marginBottom: "0.75rem" }}
                                />
                            </label>

                            {/* Assists */}
                            <label>
                                Assists
                                <input
                                    type="number"
                                    value={newAssists}
                                    onChange={(e) => setNewAssists(Number(e.target.value))}
                                    min="0"
                                    style={{ width: "100%", marginBottom: "0.75rem" }}
                                />
                            </label>

                            {/* Setting Errors */}
                            <label>
                                Setting Errors
                                <input
                                    type="number"
                                    value={newSettingErrors}
                                    onChange={(e) => setNewSettingErrors(Number(e.target.value))}
                                    min="0"
                                    style={{ width: "100%", marginBottom: "0.75rem" }}
                                />
                            </label>

                            {/* Blocks */}
                            <label>
                                Blocks
                                <input
                                    type="number"
                                    value={newBlocks}
                                    onChange={(e) => setNewBlocks(Number(e.target.value))}
                                    min="0"
                                    style={{ width: "100%", marginBottom: "0.75rem" }}
                                />
                            </label>

                            {/* Digs */}
                            <label>
                                Digs
                                <input
                                    type="number"
                                    value={newDigs}
                                    onChange={(e) => setNewDigs(Number(e.target.value))}
                                    min="0"
                                    style={{ width: "100%", marginBottom: "0.75rem" }}
                                />
                            </label>

                            {/* Block Follows */}
                            <label>
                                Block Follows
                                <input
                                    type="number"
                                    value={newBlockFollows}
                                    onChange={(e) => setNewBlockFollows(Number(e.target.value))}
                                    min="0"
                                    style={{ width: "100%", marginBottom: "0.75rem" }}
                                />
                            </label>

                            {/* Aces */}
                            <label>
                                Aces
                                <input
                                    type="number"
                                    value={newAces}
                                    onChange={(e) => setNewAces(Number(e.target.value))}
                                    min="0"
                                    style={{ width: "100%", marginBottom: "0.75rem" }}
                                />
                            </label>

                            {/* Serving Errors */}
                            <label>
                                Serving Errors
                                <input
                                    type="number"
                                    value={newServingErrors}
                                    onChange={(e) => setNewServingErrors(Number(e.target.value))}
                                    min="0"
                                    style={{ width: "100%", marginBottom: "0.75rem" }}
                                />
                            </label>

                            {/* Misc Errors */}
                            <label>
                                Misc Errors
                                <input
                                    type="number"
                                    value={newMiscErrors}
                                    onChange={(e) => setNewMiscErrors(Number(e.target.value))}
                                    min="0"
                                    style={{ width: "100%", marginBottom: "0.75rem" }}
                                />
                            </label>

                            {/* Player ID */}
                            <label>
                                Player ID*
                                <input
                                    type="number"
                                    value={newPlayerId}
                                    onChange={(e) => setNewPlayerId(Number(e.target.value))}
                                    min="1"
                                    required
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

                            {/* Show create error from hook */}
                            {createError && (
                                <p className="error" style={{ color: "red", marginTop: "0.5rem" }}>
                                    {createError}
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* Stats Table */}
            <table className="users-table" style={{ marginTop: "1.5rem" }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Player ID</th>
                        <th>Spiking Errors</th>
                        <th>Ape Kills</th>
                        <th>Ape Attempts</th>
                        <th>Spike Kills</th>
                        <th>Spike Attempts</th>
                        <th>Assists</th>
                        <th>Setting Errors</th>
                        <th>Blocks</th>
                        <th>Digs</th>
                        <th>Block Follows</th>
                        <th>Aces</th>
                        <th>Serving Errors</th>
                        <th>Misc Errors</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {localStats.map((s) =>
                    {
                        // Helper to convert values to strings
                        const toStr = (field: EditField) => s[field].toString();
                        return (
                            <tr key={s.id}>
                                <td>{s.id}</td>

                                {/* Player ID */}
                                <td
                                    style={{ cursor: "pointer", textAlign: "center" }}
                                    onClick={() =>
                                        setEditing({
                                            id:    s.id,
                                            field: "playerId",
                                            value: s.playerId.toString(),
                                        })
                                    }
                                >
                                    {editing?.id === s.id && editing.field === "playerId" ? (
                                        <input
                                            type="number"
                                            min="1"
                                            value={editing.value}
                                            onChange={(e) =>
                                                setEditing({ ...editing, value: e.target.value })
                                            }
                                            onBlur={commitEdit}
                                            onKeyDown={(e) =>
                                            {
                                                if (e.key === "Enter")
                                                {
                                                    e.currentTarget.blur();
                                                }
                                                if (e.key === "Escape")
                                                {
                                                    setEditing(null);
                                                }
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        s.playerId
                                    )}
                                </td>

                                {/* Spiking Errors */}
                                <td
                                    style={{ cursor: "pointer", textAlign: "center" }}
                                    onClick={() =>
                                        setEditing({
                                            id:    s.id,
                                            field: "spikingErrors",
                                            value: toStr("spikingErrors"),
                                        })
                                    }
                                >
                                    {editing?.id === s.id && editing.field === "spikingErrors" ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={editing.value}
                                            onChange={(e) =>
                                                setEditing({ ...editing, value: e.target.value })
                                            }
                                            onBlur={commitEdit}
                                            onKeyDown={(e) =>
                                            {
                                                if (e.key === "Enter")
                                                {
                                                    e.currentTarget.blur();
                                                }
                                                if (e.key === "Escape")
                                                {
                                                    setEditing(null);
                                                }
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        s.spikingErrors
                                    )}
                                </td>

                                {/* Ape Kills */}
                                <td
                                    style={{ cursor: "pointer", textAlign: "center" }}
                                    onClick={() =>
                                        setEditing({
                                            id:    s.id,
                                            field: "apeKills",
                                            value: toStr("apeKills"),
                                        })
                                    }
                                >
                                    {editing?.id === s.id && editing.field === "apeKills" ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={editing.value}
                                            onChange={(e) =>
                                                setEditing({ ...editing, value: e.target.value })
                                            }
                                            onBlur={commitEdit}
                                            onKeyDown={(e) =>
                                            {
                                                if (e.key === "Enter")
                                                {
                                                    e.currentTarget.blur();
                                                }
                                                if (e.key === "Escape")
                                                {
                                                    setEditing(null);
                                                }
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        s.apeKills
                                    )}
                                </td>

                                {/* Ape Attempts */}
                                <td
                                    style={{ cursor: "pointer", textAlign: "center" }}
                                    onClick={() =>
                                        setEditing({
                                            id:    s.id,
                                            field: "apeAttempts",
                                            value: toStr("apeAttempts"),
                                        })
                                    }
                                >
                                    {editing?.id === s.id && editing.field === "apeAttempts" ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={editing.value}
                                            onChange={(e) =>
                                                setEditing({ ...editing, value: e.target.value })
                                            }
                                            onBlur={commitEdit}
                                            onKeyDown={(e) =>
                                            {
                                                if (e.key === "Enter")
                                                {
                                                    e.currentTarget.blur();
                                                }
                                                if (e.key === "Escape")
                                                {
                                                    setEditing(null);
                                                }
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        s.apeAttempts
                                    )}
                                </td>

                                {/* Spike Kills */}
                                <td
                                    style={{ cursor: "pointer", textAlign: "center" }}
                                    onClick={() =>
                                        setEditing({
                                            id:    s.id,
                                            field: "spikeKills",
                                            value: toStr("spikeKills"),
                                        })
                                    }
                                >
                                    {editing?.id === s.id && editing.field === "spikeKills" ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={editing.value}
                                            onChange={(e) =>
                                                setEditing({ ...editing, value: e.target.value })
                                            }
                                            onBlur={commitEdit}
                                            onKeyDown={(e) =>
                                            {
                                                if (e.key === "Enter")
                                                {
                                                    e.currentTarget.blur();
                                                }
                                                if (e.key === "Escape")
                                                {
                                                    setEditing(null);
                                                }
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        s.spikeKills
                                    )}
                                </td>

                                {/* Spike Attempts */}
                                <td
                                    style={{ cursor: "pointer", textAlign: "center" }}
                                    onClick={() =>
                                        setEditing({
                                            id:    s.id,
                                            field: "spikeAttempts",
                                            value: toStr("spikeAttempts"),
                                        })
                                    }
                                >
                                    {editing?.id === s.id && editing.field === "spikeAttempts" ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={editing.value}
                                            onChange={(e) =>
                                                setEditing({ ...editing, value: e.target.value })
                                            }
                                            onBlur={commitEdit}
                                            onKeyDown={(e) =>
                                            {
                                                if (e.key === "Enter")
                                                {
                                                    e.currentTarget.blur();
                                                }
                                                if (e.key === "Escape")
                                                {
                                                    setEditing(null);
                                                }
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        s.spikeAttempts
                                    )}
                                </td>

                                {/* Assists */}
                                <td
                                    style={{ cursor: "pointer", textAlign: "center" }}
                                    onClick={() =>
                                        setEditing({
                                            id:    s.id,
                                            field: "assists",
                                            value: toStr("assists"),
                                        })
                                    }
                                >
                                    {editing?.id === s.id && editing.field === "assists" ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={editing.value}
                                            onChange={(e) =>
                                                setEditing({ ...editing, value: e.target.value })
                                            }
                                            onBlur={commitEdit}
                                            onKeyDown={(e) =>
                                            {
                                                if (e.key === "Enter")
                                                {
                                                    e.currentTarget.blur();
                                                }
                                                if (e.key === "Escape")
                                                {
                                                    setEditing(null);
                                                }
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        s.assists
                                    )}
                                </td>

                                {/* Setting Errors */}
                                <td
                                    style={{ cursor: "pointer", textAlign: "center" }}
                                    onClick={() =>
                                        setEditing({
                                            id:    s.id,
                                            field: "settingErrors",
                                            value: toStr("settingErrors"),
                                        })
                                    }
                                >
                                    {editing?.id === s.id && editing.field === "settingErrors" ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={editing.value}
                                            onChange={(e) =>
                                                setEditing({ ...editing, value: e.target.value })
                                            }
                                            onBlur={commitEdit}
                                            onKeyDown={(e) =>
                                            {
                                                if (e.key === "Enter")
                                                {
                                                    e.currentTarget.blur();
                                                }
                                                if (e.key === "Escape")
                                                {
                                                    setEditing(null);
                                                }
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        s.settingErrors
                                    )}
                                </td>

                                {/* Blocks */}
                                <td
                                    style={{ cursor: "pointer", textAlign: "center" }}
                                    onClick={() =>
                                        setEditing({
                                            id:    s.id,
                                            field: "blocks",
                                            value: toStr("blocks"),
                                        })
                                    }
                                >
                                    {editing?.id === s.id && editing.field === "blocks" ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={editing.value}
                                            onChange={(e) =>
                                                setEditing({ ...editing, value: e.target.value })
                                            }
                                            onBlur={commitEdit}
                                            onKeyDown={(e) =>
                                            {
                                                if (e.key === "Enter")
                                                {
                                                    e.currentTarget.blur();
                                                }
                                                if (e.key === "Escape")
                                                {
                                                    setEditing(null);
                                                }
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        s.blocks
                                    )}
                                </td>

                                {/* Digs */}
                                <td
                                    style={{ cursor: "pointer", textAlign: "center" }}
                                    onClick={() =>
                                        setEditing({
                                            id:    s.id,
                                            field: "digs",
                                            value: toStr("digs"),
                                        })
                                    }
                                >
                                    {editing?.id === s.id && editing.field === "digs" ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={editing.value}
                                            onChange={(e) =>
                                                setEditing({ ...editing, value: e.target.value })
                                            }
                                            onBlur={commitEdit}
                                            onKeyDown={(e) =>
                                            {
                                                if (e.key === "Enter")
                                                {
                                                    e.currentTarget.blur();
                                                }
                                                if (e.key === "Escape")
                                                {
                                                    setEditing(null);
                                                }
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        s.digs
                                    )}
                                </td>

                                {/* Block Follows */}
                                <td
                                    style={{ cursor: "pointer", textAlign: "center" }}
                                    onClick={() =>
                                        setEditing({
                                            id:    s.id,
                                            field: "blockFollows",
                                            value: toStr("blockFollows"),
                                        })
                                    }
                                >
                                    {editing?.id === s.id && editing.field === "blockFollows" ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={editing.value}
                                            onChange={(e) =>
                                                setEditing({ ...editing, value: e.target.value })
                                            }
                                            onBlur={commitEdit}
                                            onKeyDown={(e) =>
                                            {
                                                if (e.key === "Enter")
                                                {
                                                    e.currentTarget.blur();
                                                }
                                                if (e.key === "Escape")
                                                {
                                                    setEditing(null);
                                                }
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        s.blockFollows
                                    )}
                                </td>

                                {/* Aces */}
                                <td
                                    style={{ cursor: "pointer", textAlign: "center" }}
                                    onClick={() =>
                                        setEditing({
                                            id:    s.id,
                                            field: "aces",
                                            value: toStr("aces"),
                                        })
                                    }
                                >
                                    {editing?.id === s.id && editing.field === "aces" ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={editing.value}
                                            onChange={(e) =>
                                                setEditing({ ...editing, value: e.target.value })
                                            }
                                            onBlur={commitEdit}
                                            onKeyDown={(e) =>
                                            {
                                                if (e.key === "Enter")
                                                {
                                                    e.currentTarget.blur();
                                                }
                                                if (e.key === "Escape")
                                                {
                                                    setEditing(null);
                                                }
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        s.aces
                                    )}
                                </td>

                                {/* Serving Errors */}
                                <td
                                    style={{ cursor: "pointer", textAlign: "center" }}
                                    onClick={() =>
                                        setEditing({
                                            id:    s.id,
                                            field: "servingErrors",
                                            value: toStr("servingErrors"),
                                        })
                                    }
                                >
                                    {editing?.id === s.id && editing.field === "servingErrors" ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={editing.value}
                                            onChange={(e) =>
                                                setEditing({ ...editing, value: e.target.value })
                                            }
                                            onBlur={commitEdit}
                                            onKeyDown={(e) =>
                                            {
                                                if (e.key === "Enter")
                                                {
                                                    e.currentTarget.blur();
                                                }
                                                if (e.key === "Escape")
                                                {
                                                    setEditing(null);
                                                }
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        s.servingErrors
                                    )}
                                </td>

                                {/* Misc Errors */}
                                <td
                                    style={{ cursor: "pointer", textAlign: "center" }}
                                    onClick={() =>
                                        setEditing({
                                            id:    s.id,
                                            field: "miscErrors",
                                            value: toStr("miscErrors"),
                                        })
                                    }
                                >
                                    {editing?.id === s.id && editing.field === "miscErrors" ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={editing.value}
                                            onChange={(e) =>
                                                setEditing({ ...editing, value: e.target.value })
                                            }
                                            onBlur={commitEdit}
                                            onKeyDown={(e) =>
                                            {
                                                if (e.key === "Enter")
                                                {
                                                    e.currentTarget.blur();
                                                }
                                                if (e.key === "Escape")
                                                {
                                                    setEditing(null);
                                                }
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        s.miscErrors
                                    )}
                                </td>

                                {/* Actions (delete if superadmin) */}
                                <td>
                                    {user?.role === "superadmin" ? (
                                        <button
                                            onClick={() => handleDelete(s.id)}
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

export default StatsPage;
