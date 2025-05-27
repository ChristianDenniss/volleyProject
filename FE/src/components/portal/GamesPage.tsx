// src/pages/GamesPage.tsx
import React, { useState, useEffect } from "react";
import { useGames }                  from "../../hooks/allFetch";
import { useGameMutations }          from "../../hooks/allPatch";
import { useCreateGame }             from "../../hooks/allCreate";
import type { Game }                 from "../../types/interfaces";
import "../../styles/GamesPage.css";

type EditField =
  | "name"
  | "season"
  | "stage"
  | "team1Score"
  | "team2Score"
  | "date"
  | "videoUrl";

interface EditingState {
  id:    number;
  field: EditField;
  value: string;
}

const GamesPage: React.FC = () => {
  const { data: games, loading, error } = useGames();
  const { patchGame }                   = useGameMutations();
  const { createGame }                  = useCreateGame();
  const [ localGames, setLocalGames ]   = useState<Game[]>([]);
  const [ editing, setEditing ]         = useState<EditingState | null>(null);

  useEffect(() => {
    if (games) setLocalGames(games);
  }, [games]);

  // Create handler
  const handleCreate = async () => {
    // Replace defaults as needed or prompt user for input
    const payload = {
      name:       "New Game",
      seasonId:   localGames[0]?.season.id || 1,
      stage:      "",
      team1Score: 0,
      team2Score: 0,
      date:       new Date(),
      videoUrl:   null,
    };
    try {
      const newGame = await createGame(payload);
      setLocalGames(prev => [newGame, ...prev]);
    } catch (err: any) {
      console.error(err);
      alert("Failed to create game:\n" + err.message);
    }
  };

  // Commit inline edits
  const commitEdit = async () => {
    if (!editing) return;
    const { id, field, value } = editing;
    const orig = localGames.find(g => g.id === id);
    if (!orig) {
      setEditing(null);
      return;
    }

    let origValue: string;
    switch (field) {
      case "name":       origValue = orig.name; break;
      case "season":     origValue = orig.season.seasonNumber.toString(); break;
      case "stage":      origValue = orig.stage; break;
      case "team1Score": origValue = orig.team1Score.toString(); break;
      case "team2Score": origValue = orig.team2Score.toString(); break;
      case "date":       origValue = new Date(orig.date).toISOString().slice(0,10); break;
      default:           origValue = orig.videoUrl ?? "";
    }
    if (value === origValue) {
      setEditing(null);
      return;
    }

    const labelMap: Record<EditField,string> = {
      name: "Title",
      season: "Season",
      stage: "Stage",
      team1Score: "Team 1 Score",
      team2Score: "Team 2 Score",
      date: "Date",
      videoUrl: "Video URL",
    };
    if (!window.confirm(`Change ${labelMap[field]} from "${origValue}" to "${value}"?`)) {
      setEditing(null);
      return;
    }

    const payload: Partial<Game> & Record<string,any> = {};
    switch (field) {
      case "name":       payload.name       = value; break;
      case "season":     payload.seasonId   = Number(value); break;
      case "stage":      payload.stage      = value; break;
      case "team1Score": payload.team1Score = Number(value); break;
      case "team2Score": payload.team2Score = Number(value); break;
      case "date":       payload.date       = new Date(value); break;
      case "videoUrl":   payload.videoUrl   = value || null; break;
    }
    (payload as any).id = id;

    try {
      const updated = await patchGame(id, payload);
      setLocalGames(prev =>
        prev.map(g =>
          g.id === id ? { ...g, ...updated } : g
        )
      );
    } catch (err: any) {
      console.error(err);
      alert("Failed to save changes:\n" + err.message);
    } finally {
      setEditing(null);
    }
  };

  if (loading) return <p>Loading games…</p>;
  if (error)   return <p>Error: {error}</p>;

  return (
    <div className="portal-main">
      <h1 className="users-title">
        Games
        <button className="create-btn" onClick={handleCreate}>
          + Create Game
        </button>
      </h1>

      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Season</th>
            <th>Stage</th>
            <th>Team1 Score</th>
            <th>Team2 Score</th>
            <th>Date</th>
            <th>Video URL</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {localGames.map(g => {
            const dateStr = new Date(g.date).toISOString().slice(0, 10);
            return (
              <tr key={g.id}>
                <td>{g.id}</td>

                {/* Title */}
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() => setEditing({ id: g.id, field: "name", value: g.name })}
                >
                  {editing?.id === g.id && editing.field === "name" ? (
                    <input
                      type="text"
                      value={editing.value}
                      onChange={e => setEditing({ ...editing, value: e.target.value })}
                      onBlur={commitEdit}
                      onKeyDown={e => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") setEditing(null);
                      }}
                      autoFocus
                    />
                  ) : g.name}
                </td>

                {/* Season */}
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() => setEditing({
                    id: g.id,
                    field: "season",
                    value: g.season.seasonNumber.toString()
                  })}
                >
                  {editing?.id === g.id && editing.field === "season" ? (
                    <input
                      type="number"
                      min="1"
                      value={editing.value}
                      onChange={e => setEditing({ ...editing, value: e.target.value })}
                      onBlur={commitEdit}
                      onKeyDown={e => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") setEditing(null);
                      }}
                      autoFocus
                    />
                  ) : g.season.seasonNumber}
                </td>

                {/* Stage */}
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() => setEditing({ id: g.id, field: "stage", value: g.stage })}
                >
                  {editing?.id === g.id && editing.field === "stage" ? (
                    <input
                      type="text"
                      value={editing.value}
                      onChange={e => setEditing({ ...editing, value: e.target.value })}
                      onBlur={commitEdit}
                      onKeyDown={e => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") setEditing(null);
                      }}
                      autoFocus
                    />
                  ) : g.stage}
                </td>

                {/* Team1 Score */}
                <td
                  style={{ cursor: "pointer", textAlign: "center" }}
                  onClick={() => setEditing({
                    id: g.id,
                    field: "team1Score",
                    value: g.team1Score.toString()
                  })}
                >
                  {editing?.id === g.id && editing.field === "team1Score" ? (
                    <input
                      type="number"
                      min="0"
                      value={editing.value}
                      onChange={e => setEditing({ ...editing, value: e.target.value })}
                      onBlur={commitEdit}
                      onKeyDown={e => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") setEditing(null);
                      }}
                      autoFocus
                    />
                  ) : g.team1Score}
                </td>

                {/* Team2 Score */}
                <td
                  style={{ cursor: "pointer", textAlign: "center" }}
                  onClick={() => setEditing({
                    id: g.id,
                    field: "team2Score",
                    value: g.team2Score.toString()
                  })}
                >
                  {editing?.id === g.id && editing.field === "team2Score" ? (
                    <input
                      type="number"
                      min="0"
                      value={editing.value}
                      onChange={e => setEditing({ ...editing, value: e.target.value })}
                      onBlur={commitEdit}
                      onKeyDown={e => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") setEditing(null);
                      }}
                      autoFocus
                    />
                  ) : g.team2Score}
                </td>

                {/* Date */}
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() => setEditing({ id: g.id, field: "date", value: dateStr })}
                >
                  {editing?.id === g.id && editing.field === "date" ? (
                    <input
                      type="date"
                      value={editing.value}
                      onChange={e => setEditing({ ...editing, value: e.target.value })}
                      onBlur={commitEdit}
                      onKeyDown={e => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") setEditing(null);
                      }}
                      autoFocus
                    />
                  ) : new Date(g.date).toLocaleDateString()}
                </td>

                {/* Video URL */}
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() => setEditing({ id: g.id, field: "videoUrl", value: g.videoUrl ?? "" })}
                >
                  {editing?.id === g.id && editing.field === "videoUrl" ? (
                    <input
                      type="text"
                      value={editing.value}
                      onChange={e => setEditing({ ...editing, value: e.target.value })}
                      onBlur={commitEdit}
                      onKeyDown={e => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") setEditing(null);
                      }}
                      autoFocus
                    />
                  ) : g.videoUrl ?? <span className="text-muted">None</span>}
                </td>

                {/* Actions */}
                <td><span className="text-muted">—</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default GamesPage;
