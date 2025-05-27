// src/pages/PlayersPage.tsx
import React from "react";
import { usePlayers } from "../../hooks/allFetch";
import type { Player } from "../../types/interfaces";
import "../../styles/UsersPage.css"; // reuse same table styling

const PlayersPage: React.FC = () => {
  const { data: players, loading, error } = usePlayers();

  if (loading) return <p>Loading players…</p>;
  if (error)   return <p>Error: {error}</p>;

  return (
    <div className="portal-main">
      <h1 className="users-title">Players</h1>
      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Position</th>
            <th>Teams</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {players?.map((p: Player) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.position}</td>
              <td>{p.teams?.map(team => team.name).join(", ") || "No teams"}</td>
              <td>
                <span className="text-muted">No actions available</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlayersPage;
