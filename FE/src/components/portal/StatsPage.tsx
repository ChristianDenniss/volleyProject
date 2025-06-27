// src/pages/StatsPage.tsx

import React, { useState, useEffect } from "react";
import { useStats }                  from "../../hooks/allFetch";
import { useStatsMutations }          from "../../hooks/allPatch";
import { useCreateStats }            from "../../hooks/allCreate";
import { useDeleteStats }            from "../../hooks/allDelete";
import { useCSVUpload }              from "../../hooks/allCreate";
import { useAuth }                   from "../../context/authContext";
import { usePlayers }                from "../../hooks/allFetch";
import type { Stats }                from "../../types/interfaces";
import { handleFileUpload } from "../../utils/csvUploadUtils";
import "../../styles/UsersPage.css"; // reuse table & text-muted styles
import "../../styles/GamesPage.css"; // reuse table & text-muted styles
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
    "Winners Bracket; Quarter Finals",
    "Winners Bracket; Semi Finals",
    "Winners Bracket; Finals",
    "Losers Bracket; Round 1",
    "Losers Bracket; Round 2",
    "Losers Bracket; Quarter Finals",
    "Losers Bracket; Semi Finals",
    "Losers Bracket; Finals",
    "Grand Finals",
    "Consolation Finals",
    "Play-in Round",
    "Group Stage",
    "Qualifiers"
];

const StatsPage: React.FC = () =>
{
    // Retrieve stats list from API
    const { data: stats, loading, error } = useStats();

    // Retrieve players list for the dropdown
    const { data: players } = usePlayers();

    // Destructure mutation functions for patching stats
    const { patchStats }                 = useStatsMutations();

    // Destructure creation hook for new stats
    const { createStats, loading: creating, error: createError } = useCreateStats();

    // Destructure deletion hook for stats
    const { deleteItem: deleteStat, loading: deleting, error: deleteError } = useDeleteStats();

    // Destructure CSV upload hook
    const { uploadCSV, error: csvUploadError } = useCSVUpload();

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
    const [ newPlayerName, setNewPlayerName ]       = useState<string>("");
    const [ newGameId, setNewGameId ]               = useState<number>(0);
    const [ formError, setFormError ]               = useState<string>("");

    // CSV Upload modal state
    const [ isCSVModalOpen, setIsCSVModalOpen ] = useState<boolean>(false);
    const [ csvPreview, setCsvPreview ] = useState<any>(null);
    const [ csvParseError, setCsvParseError ] = useState<string>("");

    // Add state for stage modal
    const [isStageModalOpen, setIsStageModalOpen] = useState(false);
    const [stageInput, setStageInput] = useState("");
    const [pendingCSV, setPendingCSV] = useState<any>(null);
    const [gameCreationError, setGameCreationError] = useState("");

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
    };

    const closeCSVModal = () => {
        setIsCSVModalOpen(false);
        setCsvPreview(null);
        setCsvParseError("");
    };

    // Update handleFileUpload to trigger stage modal after parsing
    const handleFileUploadWrapper = (e: React.ChangeEvent<HTMLInputElement>, setCsvPreview: any, setCsvParseError: any) => {
        handleFileUpload(e, () => {}, () => {}, setCsvPreview, setCsvParseError);
        // If CSV is parsed, open stage modal
        setTimeout(() => {
            if (csvPreview) {
                setPendingCSV(csvPreview);
                setIsStageModalOpen(true);
            }
        }, 100);
    };

    // Handle stage modal submit
    const handleStageSubmit = async () => {
        if (!stageInput.trim()) return;
        if (!pendingCSV) return;
        // Prepare gameData
        const gameData = {
            ...pendingCSV.gameData,
            stage: stageInput.trim(),
            name: `${pendingCSV.teamNames[0]} vs. ${pendingCSV.teamNames[1]} (Season ${pendingCSV.seasonId})`,
            team1Score: pendingCSV.gameData.team1Score || 0,
            team2Score: pendingCSV.gameData.team2Score || 0,
            videoUrl: "",
            date: new Date().toISOString(),
        };
        // Try to create the game
        try {
            const result = await uploadCSV({ gameData, statsData: pendingCSV.statsData });
            if (!result) throw new Error("Game creation failed");
            setLocalStats(prev => [...result.stats, ...prev]);
            setIsStageModalOpen(false);
            setPendingCSV(null);
            setStageInput("");
            setGameCreationError("");
            closeCSVModal();
            alert(`Successfully uploaded game and ${result.stats.length} stats records!`);
        } catch (err: any) {
            setGameCreationError("Game creation failed, exiting creation");
            setIsStageModalOpen(false);
            setPendingCSV(null);
            setStageInput("");
            closeCSVModal();
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

            {/* Buttons for creating stats */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button className="create-button" onClick={openModal}>
                    Create Stat
                </button>
                <button className="create-button" onClick={openCSVModal}>
                    Upload CSV
                </button>
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
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}>
                        {/* Close button */}
                        <button
                            onClick={closeCSVModal}
                            className="modal-close"
                        >
                            ×
                        </button>

                        <h2 className="modal-title">Upload CSV</h2>

                        {/* Display CSV upload errors */}
                        {csvParseError && (
                            <p className="modal-error">
                                {csvParseError}
                            </p>
                        )}

                        {csvUploadError && (
                            <p className="modal-error">
                                {csvUploadError}
                            </p>
                        )}

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
                                    <h4>Game Data</h4>
                                    <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                                    <p><strong>Season ID:</strong> {csvPreview.gameData.seasonId}</p>
                                    <p><strong>Teams:</strong> {csvPreview.gameData.teamNames.join(' vs ')}</p>
                                    <p><strong>Team 1 Score:</strong> {csvPreview.gameData.team1Score}</p>
                                    <p><strong>Team 2 Score:</strong> {csvPreview.gameData.team2Score}</p>
                                    
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
                            >
                                Cancel
                            </button>
                            {csvPreview && (
                                <button
                                    onClick={() => {
                                        setPendingCSV(csvPreview);
                                        setIsStageModalOpen(true);
                                    }}
                                    className="create-button"
                                >
                                    Create Game
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Stage Modal */}
            {isStageModalOpen && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '400px' }}>
                        <h2 className="modal-title">Select Match Stage</h2>
                        <label>
                            Stage*
                            <select
                                value={stageInput}
                                onChange={e => setStageInput(e.target.value)}
                                style={{ width: '100%', marginBottom: '1rem', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
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
                                }} 
                                className="create-button"
                                style={{ background: '#dc3545', color: 'white' }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleStageSubmit} 
                                className="create-button" 
                                disabled={!stageInput.trim()}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {gameCreationError && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2 className="modal-title">Error</h2>
                        <p className="modal-error">{gameCreationError}</p>
                        <button onClick={() => setGameCreationError("")} className="create-button">Close</button>
                    </div>
                </div>
            )}

            {/* Stats Table */}
            <table className="stats-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th className="small-column">Game ID</th>
                        <th className="small-column">Player ID</th>
                        <th className="small-column">Spiking Errors</th>
                        <th className="small-column">Ape Kills</th>
                        <th className="small-column">Ape Attempts</th>
                        <th className="small-column">Spike Kills</th>
                        <th className="small-column">Spike Attempts</th>
                        <th className="small-column">Assists</th>
                        <th className="small-column">Setting Errors</th>
                        <th className="small-column">Blocks</th>
                        <th className="small-column">Digs</th>
                        <th className="small-column">Block Follows</th>
                        <th className="small-column">Aces</th>
                        <th className="small-column">Serving Errors</th>
                        <th className="small-column">Misc Errors</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {localStats.map((s) =>
                    {
                        // Helper to convert values to strings
                        const toStr = (field: EditField) => {
                            switch (field) {
                                case "playerId": return s.player.id.toString();
                                case "gameId": return s.game.id.toString();
                                default: return s[field].toString();
                            }
                        };
                        return (
                            <tr key={s.id}>
                                <td>{s.id}</td>

                                {/* Game ID (editable) */}
                                <td
                                    className="small-column"
                                    style={{ cursor: "pointer" }}
                                    onClick={() =>
                                        setEditing({
                                            id:    s.id,
                                            field: "gameId",
                                            value: s.game.id.toString(),
                                        })
                                    }
                                >
                                    {editing?.id === s.id && editing.field === "gameId" ? (
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
                                        s.game.id
                                    )}
                                </td>

                                {/* Player ID (editable) */}
                                <td
                                    className="small-column"
                                    style={{ cursor: "pointer" }}
                                    onClick={() =>
                                        setEditing({
                                            id:    s.id,
                                            field: "playerId",
                                            value: s.player.id.toString(),
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
                                        s.player.id
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
