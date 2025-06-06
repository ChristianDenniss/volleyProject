import React, { useState, useEffect } from "react";
import { useStats, useTeams, useArticles, usePlayers, useSeasons, useGames, useUsers } from "../../hooks/allFetch";
import { FaUsers, FaVolleyballBall, FaNewspaper, FaCalendarAlt, FaGamepad, FaChartBar, FaUserAlt } from "react-icons/fa";
import "../../styles/Dashboard.css";

const Dashboard: React.FC = () => {
  const { data: stats, loading: statsLoading } = useStats();
  const { data: teams, loading: teamsLoading } = useTeams();
  const { data: articles, loading: articlesLoading } = useArticles();
  const { data: players, loading: playersLoading } = usePlayers();
  const { data: seasons, loading: seasonsLoading } = useSeasons();
  const { data: games, loading: gamesLoading } = useGames();
  const { data: users, loading: usersLoading } = useUsers();
  
  const totalStats = stats?.length ?? 0;
  const totalTeams = teams?.length ?? 0;
  const totalArticles = articles?.length ?? 0;
  const totalPlayers = players?.length ?? 0;
  const totalSeasons = seasons?.length ?? 0;
  const totalGames = games?.length ?? 0;
  const totalUsers = users?.length ?? 0;
  const isLoading = statsLoading || teamsLoading || articlesLoading || playersLoading || seasonsLoading || gamesLoading || usersLoading;

  if (isLoading) {
    return <div className="dashboard-container"><p>Loading dashboard data...</p></div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Welcome, Admin!</h1>
      
      {/* Quick Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <FaVolleyballBall className="stat-icon" />
          <div className="stat-content">
            <h3>Total Teams</h3>
            <p className="stat-value">{totalTeams}</p>
          </div>
        </div>

        <div className="stat-card">
          <FaUserAlt  className="stat-icon" />
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-value">{totalUsers}</p>
          </div>
        </div>

        <div className="stat-card">
          <FaChartBar className="stat-icon" />
          <div className="stat-content">
            <h3>Total Stat Entries</h3>
            <p className="stat-value">{totalStats}</p>
          </div>
        </div>

        <div className="stat-card">
          <FaNewspaper className="stat-icon" />
          <div className="stat-content">
            <h3>Total Articles</h3>
            <p className="stat-value">{totalArticles}</p>
          </div>
        </div>

        <div className="stat-card">
          <FaUsers className="stat-icon" />
          <div className="stat-content">
            <h3>Total Players</h3>
            <p className="stat-value">{totalPlayers}</p>
          </div>
        </div>

        <div className="stat-card">
          <FaCalendarAlt className="stat-icon" />
          <div className="stat-content">
            <h3>Total Seasons</h3>
            <p className="stat-value">{totalSeasons}</p>
          </div>
        </div>

        <div className="stat-card">
          <FaGamepad className="stat-icon" />
          <div className="stat-content">
            <h3>Total Games</h3>
            <p className="stat-value">{totalGames}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button className="action-button" onClick={() => window.location.href = '/portal/stats'}>
            Manage Stats
          </button>
          <button className="action-button" onClick={() => window.location.href = '/portal/teams'}>
            Manage Teams
          </button>
          <button className="action-button" onClick={() => window.location.href = '/portal/games'}>
            Manage Games
          </button>
          <button className="action-button" onClick={() => window.location.href = '/portal/seasons'}>
            Manage Seasons
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="help-section">
        <h2>Getting Started</h2>
        <p>Select a section in the sidebar to begin managing your volleyball league:</p>
        <ul>
          <li>Use the <strong>Stats</strong> section to view and manage player statistics</li>
          <li>Use the <strong>Articles</strong> section to view and manage articles</li>
          <li>Use the <strong>Players</strong> section to view and manage players</li>
            <ul>
              <li>When creating <strong>Players</strong> and assigning teams, if the player already exists it will simply add the player with the matching username to the team without creating a new player, if the player does not exist it will create a brand new player and add them to the team.</li>
              <li>Please enter the players <strong>Username</strong> completely lowercase</li>
              <li>Before submitting the creation request of a player please take some time to confirm the spelling of their username is correct, and that they are not on the site under a different username</li>
            </ul>
          <li>Visit <strong>Teams</strong> to manage team rosters and information</li>
          <li>Check <strong>Games</strong> to view match results and schedules</li>
          <li>Go to <strong>Seasons</strong> to manage league seasons and tournaments</li>
          <li>Use the <strong>Users</strong> section to view and manage user accounts</li>
          
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
      