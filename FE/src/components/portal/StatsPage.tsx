// src/pages/StatsPage.tsx

import React, { useState, useEffect } from "react";
import { useStats }                  from "../../hooks/allFetch";
import { useStatsMutations }          from "../../hooks/allPatch";
import { useCreateStats }            from "../../hooks/allCreate";
import { useDeleteStats }            from "../../hooks/allDelete";
import { useCSVUpload, useAddStatsToExistingGame } from "../../hooks/allCreate";
import { useAuth }                   from "../../context/authContext";
import { usePlayers }                from "../../hooks/allFetch";
import type { Stats }                from "../../types/interfaces";
import { handleFileUpload } from "../../utils/csvUploadUtils";
import SearchBar from "../Searchbar";
import Pagination from "../Pagination";
import Table, { type TableColumn } from "../ui/Table";
import "../ui/ui.css";
import "../../styles/GamesPage.css"; // reuse table & text-muted styles
import "../../styles/PortalPlayersPage.css"; // portal-specific styles
import "../../styles/StatsPage.css"; // import new styles

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
    | "playerId"
    | "gameId";

interface EditingState {
    id:    number;
    field: EditField;
    value: string;
}

// Common stage options for dropdown
const STAGE_OPTIONS = [
    "Winners Bracket; Round of 16",
    "Winners Bracket; Quarterfinals",
    "Winners Bracket; Semifinals",
    "Winners Bracket; Finals",
    "Losers Bracket; Round 1",
    "Losers Bracket; Round 2",
    "Losers Bracket; Round 3",
    "Losers Bracket; Quarterfinals",
    "Losers Bracket; Semifinals",
    "Losers Bracket; Finals",
    "Grand Finals",
    "Grand Finals; Bracket Reset",
    "3rd Place Match",
    "Single Elimination; Round of 16",
    "Single Elimination; Quarterfinals",
    "Single Elimination; Semifinals",
    "Single Elimination; Finals",

];

const STATS_PER_PAGE = 10;

const StatsPage: React.FC = () =>
{
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);

    const { data: stats, total, totalPages, loading, error, refetch } = useStats({
        page: currentPage,
        limit: STATS_PER_PAGE,
        search: searchQuery || undefined,
    });
    const { data: players } = usePlayers({ page: 1, limit: 100 });

    // Destructure mutation functions for patching stats
    const { patchStats }                 = useStatsMutations();

    // Destructure creation hook for new stats
    const { createStats, loading: creating, error: createError } = useCreateStats();

    // Destructure deletion hook for stats
    const { deleteItem: deleteStat, loading: deleting, error: deleteError } = useDeleteStats();

    // Destructure CSV upload hook
    const { uploadCSV, loading: csvUploadLoading, error: csvUploadError } = useCSVUpload(showErrorModal);

    // Destructure add stats to existing game hook
    const { addStatsToGame, loading: addStatsLoading, error: addStatsError } = useAddStatsToExistingGame(showErrorModal);

    // Debug logging for error states
    useEffect(() => {
        if (csvUploadError) {
            console.log('CSV Upload Error State Changed:', csvUploadError);
        }
    }, [csvUploadError]);

    useEffect(() => {
        if (addStatsError) {
            console.log('Add Stats Error State Changed:', addStatsError);
        }
    }, [addStatsError]);

    // Retrieve current user (for permission checks)
    const { user }                      = useAuth();

    // Local copy of stats for inline editing and immediate UI updates
    const [ localStats, setLocalStats ] = useState<Stats[]>([]);

    // Track which cell is being edited
    const [ editing, setEditing ]       = useState<EditingState | null>(null);

    // Search and pagination state

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
    const [ newPlayerName, setNewPlayerName ]       = useState<string>("");
    const [ newGameId, setNewGameId ]               = useState<number>(0);
    const [ formError, setFormError ]               = useState<string>("");

    // CSV Upload modal state
    const [ isCSVModalOpen, setIsCSVModalOpen ] = useState<boolean>(false);
    const [ csvPreview, setCsvPreview ] = useState<any>(null);
    const [ csvParseError, setCsvParseError ] = useState<string>("");
    const [ csvUploadMode, setCsvUploadMode ] = useState<'create' | 'add'>('create');
    const [ existingGameId, setExistingGameId ] = useState<string>("");

    // Add state for stage modal
    const [isStageModalOpen, setIsStageModalOpen] = useState(false);
    const [stageInput, setStageInput] = useState("");
    const [pendingCSV, setPendingCSV] = useState<any>(null);
    const [gameCreationError, setGameCreationError] = useState("");

    // Add state for missing players error modal
    const [missingPlayersError, setMissingPlayersError] = useState<string | null>(null);

    // Add state for generic failure modal
    const [failureModal, setFailureModal] = useState<string | null>(null);

    // Debug logging for failure modal state
    useEffect(() => {
        if (failureModal) {
            console.log('Failure Modal State Changed:', failureModal);
        }
    }, [failureModal]);

    // Open stage modal automatically when csvPreview is set
    useEffect(() => {
        if (csvPreview) {
            setPendingCSV(csvPreview);
            setIsStageModalOpen(true);
        }
    }, [csvPreview]);

    // Helper to show error modal with any error object
    function showErrorModal(err: any) {
        let errorMsg = '';
        if (typeof err === 'string') {
            errorMsg = err;
        } else if (err?.message) {
            errorMsg = err.message;
        } else if (err?.error) {
            errorMsg = err.error;
        } else if (err?.response?.data?.error) {
            errorMsg = err.response.data.error;
        } else if (err?.response?.data?.message) {
            errorMsg = err.response.data.message;
        } else {
            errorMsg = 'Unknown error occurred';
        }
        console.error('CSV Upload Error:', err);
        setFailureModal(errorMsg);
    }

    // Initialize localStats when data is fetched
    useEffect(() =>
    {
        setLocalStats(stats);
    }, [stats]);

    // Handle search
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1); // Reset to first page when searching
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery("");
        setCurrentPage(1);
    };

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

        let origValue: string;
        switch (field) {
            case "spikingErrors": origValue = orig.spikingErrors.toString(); break;
            case "apeKills": origValue = orig.apeKills.toString(); break;
            case "apeAttempts": origValue = orig.apeAttempts.toString(); break;
            case "spikeKills": origValue = orig.spikeKills.toString(); break;
            case "spikeAttempts": origValue = orig.spikeAttempts.toString(); break;
            case "assists": origValue = orig.assists.toString(); break;
            case "settingErrors": origValue = orig.settingErrors.toString(); break;
            case "blocks": origValue = orig.blocks.toString(); break;
            case "digs": origValue = orig.digs.toString(); break;
            case "blockFollows": origValue = orig.blockFollows.toString(); break;
            case "aces": origValue = orig.aces.toString(); break;
            case "servingErrors": origValue = orig.servingErrors.toString(); break;
            case "miscErrors": origValue = orig.miscErrors.toString(); break;
            case "playerId": origValue = orig.player.id.toString(); break;
            case "gameId": origValue = orig.game.id.toString(); break;
            default: origValue = "";
        }

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
            gameId:        "Game ID",
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
        switch (field) {
            case "spikingErrors": payload.spikingErrors = Number(value); break;
            case "apeKills": payload.apeKills = Number(value); break;
            case "apeAttempts": payload.apeAttempts = Number(value); break;
            case "spikeKills": payload.spikeKills = Number(value); break;
            case "spikeAttempts": payload.spikeAttempts = Number(value); break;
            case "assists": payload.assists = Number(value); break;
            case "settingErrors": payload.settingErrors = Number(value); break;
            case "blocks": payload.blocks = Number(value); break;
            case "digs": payload.digs = Number(value); break;
            case "blockFollows": payload.blockFollows = Number(value); break;
            case "aces": payload.aces = Number(value); break;
            case "servingErrors": payload.servingErrors = Number(value); break;
            case "miscErrors": payload.miscErrors = Number(value); break;
            case "playerId": payload.playerId = Number(value); break;
            case "gameId": payload.gameId = Number(value); break;
        }

        try
        {
            // Send patch request
            const updated = await patchStats(id, payload);

            // Update local state with updated record
            setLocalStats((prev) =>
                prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
            );
            refetch();
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
            setLocalStats((prev) => prev.filter((s) => s.id !== id));
            refetch();
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
        setNewPlayerName("");
        setNewGameId(0);
    };

    // Close create modal and reset form error
    const closeModal = () =>
    {
        setIsModalOpen(false);
        setFormError("");
    };

    // CSV Upload functions
    const openCSVModal = () => {
        setIsCSVModalOpen(true);
        setCsvPreview(null);
        setCsvParseError("");
        setGameCreationError("");
    };

    const closeCSVModal = () => {
        setIsCSVModalOpen(false);
        setCsvPreview(null);
        setCsvParseError("");
        setGameCreationError("");
        setFailureModal(null);
        setMissingPlayersError(null);
    };

    // Update handleFileUploadWrapper to only handle file upload
    const handleFileUploadWrapper = (e: React.ChangeEvent<HTMLInputElement>, setCsvPreview: any, setCsvParseError: any) => {
        handleFileUpload(e, () => {}, () => {}, setCsvPreview, setCsvParseError, showErrorModal);
    };

    // Handle stage modal submit
    const handleStageSubmit = async () => {
        if (!pendingCSV) return;
        
        if (csvUploadMode === 'create') {
            // Create new game mode
            if (!stageInput.trim()) return;
            
            // Prepare gameData
            const gameData = {
                ...pendingCSV.gameData,
                stage: stageInput.trim(),
                name: `${pendingCSV.teamNames[0]} vs. ${pendingCSV.teamNames[1]} S${pendingCSV.seasonId}`,
                team1Score: pendingCSV.gameData.team1Score || 0,
                team2Score: pendingCSV.gameData.team2Score || 0,
                videoUrl: "",
                date: new Date().toISOString(),
            };
            
            // Try to create the game
            try {
                const result = await uploadCSV({ gameData, statsData: pendingCSV.statsData });
                if (!result) {
                    // Error is already handled by the hook and shown via showErrorModal
                    return;
                }
                setLocalStats(prev => [...result.stats, ...prev]);
                refetch();
                setIsStageModalOpen(false);
                setPendingCSV(null);
                setStageInput("");
                closeCSVModal();
                alert(`Successfully uploaded game and ${result.stats.length} stats records!`);
            } catch (err: any) {
                showErrorModal(err);
                setIsStageModalOpen(false);
                setPendingCSV(null);
                setStageInput("");
            }
        } else {
            // Add to existing game mode
            if (!existingGameId || isNaN(Number(existingGameId)) || Number(existingGameId) < 1) {
                showErrorModal({ message: "Please enter a valid Game ID (a positive number)." });
                return;
            }
            
            try {
                const result = await addStatsToGame(Number(existingGameId), pendingCSV.statsData);
                if (!result) {
                    // Error is already handled by the hook and shown via showErrorModal
                    return;
                }
                setLocalStats(prev => [...result, ...prev]);
                refetch();
                setIsStageModalOpen(false);
                setPendingCSV(null);
                setExistingGameId("");
                setGameCreationError("");
                closeCSVModal();
                alert(`Successfully added ${result.length} stats records to game ${existingGameId}!`);
            } catch (err: any) {
                showErrorModal(err);
                setIsStageModalOpen(false);
                setPendingCSV(null);
                setExistingGameId("");
            }
        }
    };

    // Create new stats record handler
    const handleCreate = async (e: React.FormEvent) =>
    {
        e.preventDefault();

        // Validate required fields
        if (!newPlayerName || newGameId <= 0) {
            setFormError("Player name and Game ID are required.");
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
            playerName:    newPlayerName,
            gameId:        newGameId,
        };

        try
        {
            // Call hook to create stats record
            const created = await createStats(payload);
            if (created)
            {
                // Prepend new record to local state
                setLocalStats((prev) => [created, ...prev]);
                refetch();
                closeModal();
            }
        }
        catch
        {
            // Creation errors are shown by the hook
        }
    };

    // Renders an inline-editable stat cell (click to edit, blur/Enter to commit, Escape to cancel)
    const renderEditableCell = (
        s: Stats,
        field: EditField,
        options?: { center?: boolean }
    ): React.ReactNode =>
    {
        // Convert the current field's value to a string for the edit input
        const getValue = (): string => {
            switch (field) {
                case "playerId": return s.player.id.toString();
                case "gameId": return s.game.id.toString();
                default: return s[field].toString();
            }
        };

        // Determine the display value shown when not editing
        const getDisplay = (): React.ReactNode => {
            switch (field) {
                case "playerId": return s.player.id;
                case "gameId": return s.game.id;
                default: return s[field];
            }
        };

        const isEditing = editing?.id === s.id && editing.field === field;

        return (
            <span
                style={{
                    cursor: "pointer",
                    display: "inline-block",
                    width: "100%",
                    ...(options?.center ? { textAlign: "center" } : {}),
                }}
                onClick={() =>
                    setEditing({
                        id:    s.id,
                        field,
                        value: getValue(),
                    })
                }
            >
                {isEditing ? (
                    <input
                        type="text"
                        value={editing!.value}
                        onChange={(e) =>
                            setEditing({ ...editing!, value: e.target.value })
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
                    getDisplay()
                )}
            </span>
        );
    };

    // Column definitions for the shared Table component
    const columns: TableColumn<Stats>[] = [
        { key: "id", header: "ID", render: (row) => row.id },
        { key: "gameId", header: "Game ID", render: (row) => renderEditableCell(row, "gameId") },
        { key: "playerId", header: "Player ID", render: (row) => renderEditableCell(row, "playerId") },
        { key: "spikingErrors", header: "Spiking Errors", render: (row) => renderEditableCell(row, "spikingErrors", { center: true }) },
        { key: "apeKills", header: "Ape Kills", render: (row) => renderEditableCell(row, "apeKills", { center: true }) },
        { key: "apeAttempts", header: "Ape Attempts", render: (row) => renderEditableCell(row, "apeAttempts", { center: true }) },
        { key: "spikeKills", header: "Spike Kills", render: (row) => renderEditableCell(row, "spikeKills", { center: true }) },
        { key: "spikeAttempts", header: "Spike Attempts", render: (row) => renderEditableCell(row, "spikeAttempts", { center: true }) },
        { key: "assists", header: "Assists", render: (row) => renderEditableCell(row, "assists", { center: true }) },
        { key: "settingErrors", header: "Setting Errors", render: (row) => renderEditableCell(row, "settingErrors", { center: true }) },
        { key: "blocks", header: "Blocks", render: (row) => renderEditableCell(row, "blocks", { center: true }) },
        { key: "digs", header: "Digs", render: (row) => renderEditableCell(row, "digs", { center: true }) },
        { key: "blockFollows", header: "Block Follows", render: (row) => renderEditableCell(row, "blockFollows", { center: true }) },
        { key: "aces", header: "Aces", render: (row) => renderEditableCell(row, "aces", { center: true }) },
        { key: "servingErrors", header: "Serving Errors", render: (row) => renderEditableCell(row, "servingErrors", { center: true }) },
        { key: "miscErrors", header: "Misc Errors", render: (row) => renderEditableCell(row, "miscErrors", { center: true }) },
        {
            key: "actions",
            header: "Actions",
            render: (row) => (
                <>
                    {user?.role === "superadmin" ? (
                        <button
                            onClick={() => handleDelete(row.id)}
                            disabled={deleting}
                            className="delete-button"
                        >
                            Delete
                        </button>
                    ) : (
                        <span className="text-muted">No permission</span>
                    )}
                    {deleteError && (
                        <p className="modal-error">
                            {deleteError}
                        </p>
                    )}
                </>
            ),
        },
    ];

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
            {/* Search and Controls */}
            <div className="players-controls">
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="create-button" onClick={openModal}>
                        Create Stat
                    </button>
                    <button className="create-button" onClick={openCSVModal}>
                        Upload CSV
                    </button>
                </div>
                <div className="players-controls-right">
                    <SearchBar onSearch={handleSearch} placeholder="Search stats..." />
                    {searchQuery && (
                        <button
                            type="button"
                            className="ui-btn ui-btn-secondary"
                            onClick={clearFilters}
                        >
                            Reset
                        </button>
                    )}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        {/* Close button */}
                        <button
                            onClick={closeModal}
                            className="modal-close"
                        >
                            ×
                        </button>

                        <h2 className="modal-title">New Stat</h2>

                        {/* Display form validation error */}
                        {formError && (
                            <p className="modal-error">
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
                                />
                            </label>

                            {/* Player Name (dropdown) */}
                            <label>
                                Player Name*
                                <select
                                    value={newPlayerName}
                                    onChange={(e) => setNewPlayerName(e.target.value)}
                                    required
                                >
                                    <option value="">Select a player</option>
                                    {players?.map((player) => (
                                        <option key={player.id} value={player.name}>
                                            {player.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {/* Game ID */}
                            <label>
                                Game ID*
                                <input
                                    type="number"
                                    value={newGameId}
                                    onChange={(e) => setNewGameId(Number(e.target.value))}
                                    min="1"
                                    required
                                />
                            </label>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={creating}
                                className="create-button"
                            >
                                {creating ? "Creating…" : "Submit"}
                            </button>
                            {createError && (
                                <p className="modal-error">
                                    {createError}
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* CSV Upload Modal */}
            {isCSVModalOpen && (
                <div className="csv-modal-overlay">
                    <div className="csv-modal" style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}>
                        {/* Close button */}
                        <button
                            onClick={closeCSVModal}
                            className="csv-modal-close"
                        >
                            ×
                        </button>

                        <h2 className="csv-modal-title">Upload CSV</h2>

                        {/* Display CSV upload errors */}
                        {csvParseError && (
                            <p className="csv-modal-error">
                                {csvParseError}
                            </p>
                        )}

                        {csvUploadError && (
                            <p className="csv-modal-error">
                                CSV Upload Error: {csvUploadError}
                            </p>
                        )}

                        {addStatsError && (
                            <p className="csv-modal-error">
                                Add Stats Error: {addStatsError}
                            </p>
                        )}

                        {/* Debug info */}
                        {(csvUploadError || addStatsError) && (
                            <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                                Debug: Check the browser console for more details
                            </p>
                        )}

                        {/* Upload Mode Selection */}
                        <div style={{ marginBottom: '20px' }}>
                            <h3>Upload Mode:</h3>
                            <div style={{ display: 'flex', gap: '30px', marginBottom: '10px', alignItems: 'center' }}>
                                <label style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                                    <input
                                        type="radio"
                                        name="uploadMode"
                                        value="create"
                                        checked={csvUploadMode === 'create'}
                                        onChange={(e) => setCsvUploadMode(e.target.value as 'create' | 'add')}
                                    />
                                    Create New Game + Stats
                                </label>
                                <label style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                                    <input
                                        type="radio"
                                        name="uploadMode"
                                        value="add"
                                        checked={csvUploadMode === 'add'}
                                        onChange={(e) => setCsvUploadMode(e.target.value as 'create' | 'add')}
                                    />
                                    Add Stats to Existing Game
                                </label>
                            </div>
                            {csvUploadMode === 'add' && (
                                <div style={{ marginTop: '10px' }}>
                                    <label>
                                        Existing Game ID*
                                        <input
                                            type="text"
                                            value={existingGameId}
                                            onChange={(e) => setExistingGameId(e.target.value)}
                                            placeholder="Enter game ID"
                                            style={{ width: '100%', marginTop: '5px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                        />
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* File upload section */}
                        <div style={{ marginBottom: '20px' }}>
                            <label>
                                Select CSV File
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => handleFileUploadWrapper(e, setCsvPreview, setCsvParseError)}
                                    style={{ marginTop: '5px' }}
                                />
                            </label>
                        </div>

                        {/* CSV Preview */}
                        {csvPreview && (
                            <div style={{ marginBottom: '20px' }}>
                                <h3>Preview:</h3>
                                <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
                                    {csvUploadMode === 'create' ? (
                                        <>
                                            <h4>Game Data</h4>
                                            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                                            <p><strong>Season ID:</strong> {csvPreview.gameData.seasonId}</p>
                                            <p><strong>Teams:</strong> {csvPreview.gameData.teamNames.join(' vs ')}</p>
                                            <p><strong>Team 1 Score:</strong> {csvPreview.gameData.team1Score}</p>
                                            <p><strong>Team 2 Score:</strong> {csvPreview.gameData.team2Score}</p>
                                        </>
                                    ) : (
                                        <>
                                            <h4>Adding to Game ID: {existingGameId}</h4>
                                            <p><strong>Season ID:</strong> {csvPreview.gameData.seasonId}</p>
                                            <p><strong>Teams:</strong> {csvPreview.gameData.teamNames.join(' vs ')}</p>
                                        </>
                                    )}
                                    
                                    <h4>Stats Data ({csvPreview.statsData.length} players)</h4>
                                    <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                                        {csvPreview.statsData.map((stat: any, index: number) => (
                                            <div key={index} style={{ marginBottom: '10px', padding: '5px', background: 'white', borderRadius: '3px' }}>
                                                <strong>{stat.playerName}</strong><br/>
                                                Spiking Errors: {stat.spikingErrors} | Ape Kills: {stat.apeKills} | Ape Attempts: {stat.apeAttempts} | Spike Kills: {stat.spikeKills} | Spike Attempts: {stat.spikeAttempts} | Assists: {stat.assists} | Setting Errors: {stat.settingErrors} | Blocks: {stat.blocks} | Digs: {stat.digs} | Block Follows: {stat.blockFollows} | Aces: {stat.aces} | Serving Errors: {stat.servingErrors} | Misc Errors: {stat.miscErrors}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={closeCSVModal}
                                className="create-button"
                                style={{ background: '#dc3545', color: 'white' }}
                                disabled={csvUploadLoading || addStatsLoading}
                            >
                                Cancel
                            </button>
                            {csvPreview && (
                                <button
                                    onClick={() => {
                                        setPendingCSV(csvPreview);
                                        if (csvUploadMode === 'create') {
                                            setIsStageModalOpen(true);
                                        } else {
                                            // For add mode, directly submit if game ID is provided
                                            if (existingGameId) {
                                                handleStageSubmit();
                                            } else {
                                                alert('Please enter a valid Game ID');
                                            }
                                        }
                                    }}
                                    className="create-button"
                                    disabled={csvUploadLoading || addStatsLoading || (csvUploadMode === 'add' && !existingGameId)}
                                >
                                    {csvUploadLoading || addStatsLoading ? 'Processing...' : 
                                     csvUploadMode === 'create' ? 'Create Game' : 'Add Stats'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Stage Modal */}
            {isStageModalOpen && csvUploadMode === 'create' && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '400px' }}>
                        <h2 className="modal-title">Select Match Stage</h2>
                        <label>
                            Stage*
                            <select
                                value={stageInput}
                                onChange={e => setStageInput(e.target.value)}
                                style={{ width: '100%', marginBottom: '1rem', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', maxHeight: '160px' }}
                                required
                            >
                                <option value="">Select a stage</option>
                                {STAGE_OPTIONS.map(stage => (
                                    <option key={stage} value={stage}>
                                        {stage}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => { 
                                    setIsStageModalOpen(false); 
                                    setStageInput(""); 
                                    setPendingCSV(null); 
                                    setFailureModal(null);
                                    setGameCreationError("");
                                }} 
                                className="create-button"
                                style={{ background: '#dc3545', color: 'white' }}
                                disabled={csvUploadLoading}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleStageSubmit} 
                                className="create-button" 
                                disabled={!stageInput.trim() || csvUploadLoading}
                            >
                                {csvUploadLoading ? 'Creating...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {gameCreationError && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '400px' }}>
                        <h2 className="modal-title">Error</h2>
                        <p className="modal-error">{gameCreationError}</p>
                        <button onClick={() => setGameCreationError("")} className="create-button">Close</button>
                    </div>
                </div>
            )}

            {/* Missing Players Error Modal */}
            {missingPlayersError && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '400px' }}>
                        <h2 className="modal-title">Missing Players</h2>
                        <p className="modal-error">{missingPlayersError}</p>
                        <button onClick={() => setMissingPlayersError(null)} className="create-button">Close</button>
                    </div>
                </div>
            )}

            {/* Generic Failure Modal */}
            {failureModal && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '400px' }}>
                        <h2 className="modal-title">Upload Failed</h2>
                        <p className="modal-error">{failureModal}</p>
                        <button onClick={() => setFailureModal(null)} className="create-button">Close</button>
                    </div>
                </div>
            )}

            {/* Results Counter */}
            <div className="results-counter" style={{ marginBottom: '1rem' }}>
                {total > 0 ? (
                    `Showing ${((currentPage - 1) * STATS_PER_PAGE) + 1}-${Math.min(currentPage * STATS_PER_PAGE, total)} of ${total} stats`
                ) : (
                    'No stats found'
                )}
            </div>

            {/* Stats Table */}
            <Table
                columns={columns}
                rows={localStats}
                rowKey={(row) => row.id}
            />
        </div>
    );
};

export default StatsPage;
