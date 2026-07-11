// src/pages/SeasonsPage.tsx

import React, { useState, useEffect } from "react";
import { useSkinnySeasons }                  from "../../hooks/allFetch";
import { useSeasonMutations }          from "../../hooks/allPatch";
import { useCreateSeasons }            from "../../hooks/allCreate";
import { useDeleteSeasons }            from "../../hooks/allDelete";
import { useAuth }                     from "../../context/authContext";
import type { Season }                 from "../../types/interfaces";
import Modal                           from "../ui/Modal";
import Table                           from "../ui/Table";
import "../../styles/SeasonsPage.css";

type EditField = "theme" | "image" | "startDate" | "endDate";
interface EditingState {
    id:    number;
    field: EditField;
    value: string; // "YYYY-MM-DD" for dates, text otherwise
}

// Table<T> constrains T to Record<string, unknown>, which plain domain
// interfaces like Season don't structurally satisfy (no index signature).
// Narrow the shared component to a Season-specific alias once here so the
// column/row definitions below stay fully typed against Season.
const SeasonTable = Table as unknown as React.ComponentType<{
    columns: {
        key:     string;
        header:  string;
        render?: (row: Season) => React.ReactNode;
    }[];
    rows:   Season[];
    rowKey: (row: Season) => string | number;
}>;

const SeasonsPage: React.FC = () =>
{
    // Fetch existing seasons
    const { data: seasons, loading, error } = useSkinnySeasons({ page: 1, limit: 100 });

    // Patch (edit) existing seasons
    const { patchSeason }                   = useSeasonMutations();

    // Create new season
    const { createSeason, loading: creating } = useCreateSeasons();

    // Delete a season
    const { deleteItem: deleteSeason, loading: deleting, error: deleteError } = useDeleteSeasons();

    // Read current user for permission check
    const { user } = useAuth();

    // Local copy of seasons for inline edits and appending new ones
    const [ localSeasons, setLocalSeasons ] = useState<Season[]>([]);

    // Track which field is being edited
    const [ editing, setEditing ]           = useState<EditingState | null>(null);

    // Control modal visibility
    const [ isModalOpen, setIsModalOpen ]   = useState<boolean>(false);

    // Form state for creating a new season
    const [ newSeasonNumber, setNewSeasonNumber ] = useState<number>(0);
    const [ newTheme, setNewTheme ]               = useState<string>("");
    const [ newImage, setNewImage ]               = useState<string>("");
    const [ newStartDate, setNewStartDate ]       = useState<string>("");
    const [ newEndDate, setNewEndDate ]           = useState<string>("");

    // Form-level error message
    const [ formError, setFormError ]             = useState<string>("");

    useEffect(() =>
    {
        if (seasons)
        {
            setLocalSeasons(seasons);
        }
    }, [seasons]);

    // Commit inline edits for existing seasons
    const commitEdit = async () =>
    {
        if (!editing) return;

        const { id, field, value } = editing;

        // Find original in localSeasons
        const orig = localSeasons.find((s) => s.id === id);
        if (!orig)
        {
            setEditing(null);
            return;
        }

        // Derive original string for comparison
        let origValue: string;
        if (field === "theme")         origValue = orig.theme;
        else if (field === "image")     origValue = orig.image ?? "";
        else if (field === "startDate") origValue = new Date(orig.startDate).toISOString().slice(0, 10);
        else                            origValue = orig.endDate
                                             ? new Date(orig.endDate).toISOString().slice(0, 10)
                                             : "";

        // If reverted to original, cancel
        if (value === origValue)
        {
            setEditing(null);
            return;
        }

        const label =
            field === "theme"     ? "theme" :
            field === "image"     ? "image URL" :
            field === "startDate" ? "start date" :
                                     "end date";

        if (!window.confirm(`Change ${label} from "${origValue}" to "${value}"?`))
        {
            setEditing(null);
            return;
        }

        // Build payload for patch
        const payload: Partial<Season> = {};
        if (field === "theme")         payload.theme     = value;
        else if (field === "image")     payload.image     = value !== "" ? value : undefined;
        else if (field === "startDate") payload.startDate = new Date(value);
        else                            payload.endDate   = value !== "" ? new Date(value) : undefined;

        try
        {
            // Send patch request
            const updated = await patchSeason(id, payload);

            // Update local state
            setLocalSeasons((prev) =>
                prev.map((s) =>
                    s.id === id
                        ? {
                              ...s,
                              theme:     updated.theme,
                              image:     updated.image,
                              startDate: updated.startDate,
                              endDate:   updated.endDate,
                          }
                        : s
                )
            );
        }
        catch (err: any)
        {
            console.error(err);
            alert("Failed to save changes:\n" + err.message);
        }
        finally
        {
            setEditing(null);
        }
    };

    // Handler to open the modal
    const openModal = () =>
    {
        setIsModalOpen(true);
        setFormError("");
        setNewSeasonNumber(0);
        setNewTheme("");
        setNewImage("");
        setNewStartDate("");
        setNewEndDate("");
    };

    // Handler to close the modal
    const closeModal = () =>
    {
        setIsModalOpen(false);
        setFormError("");
    };

    // Handler to create a new season
    const handleCreate = async (e: React.FormEvent) =>
    {
        e.preventDefault();

        // Validate required fields
        if (
            newSeasonNumber <= 0 ||
            newTheme.trim() === "" ||
            newStartDate.trim() === ""
        )
        {
            setFormError("Season number, theme, and start date are required.");
            return;
        }

        // Build payload with full ISO timestamps
        const payload = {
            seasonNumber: newSeasonNumber,
            theme:        newTheme,
            image:        newImage !== "" ? newImage : undefined,
            startDate:    new Date(newStartDate).toISOString(),
            endDate:      newEndDate !== "" ? new Date(newEndDate).toISOString() : undefined,
        };

        try
        {
            // Call createSeason, which returns the newly created Season
            const created = await createSeason(payload);

            if (created)
            {
                // Prepend to local state so it appears at the top
                setLocalSeasons((prev) => [created, ...prev]);

                // Close modal on success
                closeModal();
            }
        }
        catch (err)
        {
            // Error is already handled inside createSeason hook
        }
    };

    // Handler to delete a season (only if user is superadmin)
    const handleDelete = async (id: number) =>
    {
        if (user?.role !== "superadmin") return;

        if (!window.confirm("Are you sure you want to delete this season?")) return;

        try
        {
            const wasDeleted = await deleteSeason(id.toString());
            if (wasDeleted)
            {
                setLocalSeasons((prev) => prev.filter((s) => s.id !== id));
            }
        }
        catch (err)
        {
            console.error(err);
            // deleteError will be displayed below
        }
    };

    // Column definitions for the shared Table component, reproducing the
    // exact per-cell rendering (inline edit, permission checks, etc.) that
    // previously lived in the hand-rolled <table> markup below.
    const columns = [
        {
            key:    "seasonNumber",
            header: "Season #",
            render: (row: Season) => row.seasonNumber,
        },
        {
            key:    "theme",
            header: "Theme",
            render: (row: Season) => (
                <div
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                        setEditing({ id: row.id, field: "theme", value: row.theme })
                    }
                >
                    {editing?.id === row.id && editing.field === "theme" ? (
                        <input
                            type="text"
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
                        row.theme
                    )}
                </div>
            ),
        },
        {
            key:    "image",
            header: "Image URL",
            render: (row: Season) => (
                <div
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                        setEditing({ id: row.id, field: "image", value: row.image ?? "" })
                    }
                >
                    {editing?.id === row.id && editing.field === "image" ? (
                        <input
                            type="text"
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
                    ) : row.image ? (
                        row.image
                    ) : (
                        <span className="text-muted">None</span>
                    )}
                </div>
            ),
        },
        {
            key:    "startDate",
            header: "Start Date",
            render: (row: Season) =>
            {
                const startStr = new Date(row.startDate).toISOString().slice(0, 10);

                return (
                    <div
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                            setEditing({ id: row.id, field: "startDate", value: startStr })
                        }
                    >
                        {editing?.id === row.id && editing.field === "startDate" ? (
                            <input
                                type="date"
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
                            new Date(row.startDate).toLocaleDateString()
                        )}
                    </div>
                );
            },
        },
        {
            key:    "endDate",
            header: "End Date",
            render: (row: Season) =>
            {
                const endStr = row.endDate
                    ? new Date(row.endDate).toISOString().slice(0, 10)
                    : "";

                return (
                    <div
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                            setEditing({ id: row.id, field: "endDate", value: endStr })
                        }
                    >
                        {editing?.id === row.id && editing.field === "endDate" ? (
                            <input
                                type="date"
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
                        ) : row.endDate ? (
                            new Date(row.endDate).toLocaleDateString()
                        ) : (
                            "Ongoing"
                        )}
                    </div>
                );
            },
        },
        {
            key:    "actions",
            header: "Actions",
            render: (row: Season) => (
                <>
                    {user?.role === "superadmin" ? (
                        <button
                            onClick={() => handleDelete(row.id)}
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
                        <p className="error" style={{ color: "red" }}>
                            {deleteError}
                        </p>
                    )}
                </>
            ),
        },
    ];

    if (loading) return <p>Loading seasons…</p>;
    if (error)   return <p>Error: {error}</p>;

    return (
        <div className="portal-main">
            <h1 className="users-title">Seasons</h1>

            {/* Create Season Button */}
            <button
                onClick={openModal}
                className="create-button"
            >
                Create Season
            </button>

            {/* Create Season Modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title="New Season">
                {/* Form-level Error */}
                {formError && (
                    <p
                        className="error"
                        style={{ color: "red", marginBottom: "0.5rem" }}
                    >
                        {formError}
                    </p>
                )}

                {/* Create Form */}
                <form onSubmit={handleCreate}>
                    {/* Season Number */}
                    <label>
                        Season Number*
                        <input
                            type="number"
                            value={newSeasonNumber}
                            onChange={(e) =>
                                setNewSeasonNumber(Number(e.target.value))
                            }
                            required
                            style={{ width: "100%", marginBottom: "0.75rem" }}
                        />
                    </label>

                    {/* Theme */}
                    <label>
                        Theme*
                        <input
                            type="text"
                            value={newTheme}
                            onChange={(e) => setNewTheme(e.target.value)}
                            required
                            style={{ width: "100%", marginBottom: "0.75rem" }}
                        />
                    </label>

                    {/* Image URL */}
                    <label>
                        Image URL
                        <input
                            type="text"
                            value={newImage}
                            onChange={(e) => setNewImage(e.target.value)}
                            style={{ width: "100%", marginBottom: "0.75rem" }}
                        />
                    </label>

                    {/* Start Date */}
                    <label>
                        Start Date*
                        <input
                            type="date"
                            value={newStartDate}
                            onChange={(e) => setNewStartDate(e.target.value)}
                            required
                            style={{ width: "100%", marginBottom: "0.75rem" }}
                        />
                    </label>

                    {/* End Date */}
                    <label>
                        End Date
                        <input
                            type="date"
                            value={newEndDate}
                            onChange={(e) => setNewEndDate(e.target.value)}
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
                </form>
            </Modal>

            {/* Seasons Table */}
            <SeasonTable
                columns={columns}
                rows={localSeasons}
                rowKey={(row) => row.id}
            />
        </div>
    );
};

export default SeasonsPage;
