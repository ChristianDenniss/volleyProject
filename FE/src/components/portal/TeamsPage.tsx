// src/pages/TeamsPage.tsx
import React from "react";
import { useTeams } from "../../hooks/allFetch";
import type { Team } from "../../types/interfaces";
import "../../styles/UsersPage.css";  // reuse table & text-muted styles

const TeamsPage: React.FC = () => {
  const { data: teams, loading, error } = useTeams();

  if (loading) return <p>Loading teams…</p>;
  if (error)   return <p>Error: {error}</p>;

  return (
    <div className="portal-main">
      <h1 className="users-title">Teams</h1>
      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Placement</th>
            <th>Season ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {teams?.map((t: Team) => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{t.name}</td>
              <td>{t.placement ?? "N/A"}</td>
              <td>{t.season.seasonNumber}</td>
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

export default TeamsPage;
