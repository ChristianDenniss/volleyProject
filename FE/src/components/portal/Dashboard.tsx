import React, { useState, useEffect } from 'react';
import { FaVolleyballBall, FaUserAlt, FaChartBar, FaNewspaper, FaUsers, FaCalendarAlt, FaTrophy, FaClock } from 'react-icons/fa';
import LuvLateAvatar from '../../images/LuvLate.png';
import '../../styles/Dashboard.css';

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const parseJson = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok || !contentType.includes('application/json')) {
    return null;
  }
  return response.json();
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [awardsLoading, setAwardsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [
        statsResponse,
        teamsResponse,
        articlesResponse,
        playersResponse,
        seasonsResponse,
        gamesResponse,
        usersResponse,
        awardsResponse
      ] = await Promise.all([
        fetch(`${backendUrl}/api/stats`),
        fetch(`${backendUrl}/api/teams`),
        fetch(`${backendUrl}/api/articles`),
        fetch(`${backendUrl}/api/players`),
        fetch(`${backendUrl}/api/seasons`),
        fetch(`${backendUrl}/api/games`),
        fetch(`${backendUrl}/api/users`),
        fetch(`${backendUrl}/api/awards`)
      ]);

      const [
        statsJson,
        teamsJson,
        articlesJson,
        playersJson,
        seasonsJson,
        gamesJson,
        usersJson,
        awardsJson
      ] = await Promise.all([
        parseJson(statsResponse),
        parseJson(teamsResponse),
        parseJson(articlesResponse),
        parseJson(playersResponse),
        parseJson(seasonsResponse),
        parseJson(gamesResponse),
        parseJson(usersResponse),
        parseJson(awardsResponse)
      ]);

      if (statsJson) setStats(statsJson.data ?? statsJson);
      if (teamsJson) setTeams(teamsJson.data ?? teamsJson);
      if (articlesJson) setArticles(articlesJson.data ?? articlesJson);
      if (playersJson) setPlayers(playersJson.data ?? playersJson);
      if (seasonsJson) setSeasons(seasonsJson.data ?? seasonsJson);
      if (gamesJson) setGames(gamesJson.data ?? gamesJson);
      if (usersJson) setUsers(usersJson.data ?? usersJson);
      if (awardsJson) setAwards(awardsJson.data ?? awardsJson);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setStatsLoading(false);
      setTeamsLoading(false);
      setArticlesLoading(false);
      setPlayersLoading(false);
      setSeasonsLoading(false);
      setGamesLoading(false);
      setUsersLoading(false);
      setAwardsLoading(false);
    }
  };

  const totalTeams = teams?.length ?? 0;
  const totalSeasons = seasons?.length ?? 0;
  const totalGames = games?.length ?? 0;
  const scheduledGames = games?.filter((g: any) => g.status === 'scheduled').length ?? 0;
  const completedGames = games?.filter((g: any) => g.status === 'completed').length ?? 0;
  const totalUsers = users?.length ?? 0;
  const totalAwards = awards?.length ?? 0;
  const totalStats = stats?.length ?? 0;
  const totalArticles = articles?.length ?? 0;
  const totalPlayers = players?.length ?? 0;
  const isLoading = statsLoading || teamsLoading || articlesLoading || playersLoading || seasonsLoading || gamesLoading || usersLoading || awardsLoading;

  if (isLoading) {
    return <div className="dashboard-container"><p>Loading dashboard data...</p></div>;
  }

  return (
    <div className="dashboard-container">
      {/* Quick Stats Cards */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="stat-icon-wrap">
            <FaVolleyballBall className="stat-icon" />
          </div>
          <div className="stat-content">
            <h3>Total Teams</h3>
            <p className="stat-value">{totalTeams}</p>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon-wrap">
            <FaUserAlt className="stat-icon" />
          </div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-value">{totalUsers}</p>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon-wrap">
            <FaChartBar className="stat-icon" />
          </div>
          <div className="stat-content">
            <h3>Total Stat Entries</h3>
            <p className="stat-value">{totalStats}</p>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon-wrap">
            <FaNewspaper className="stat-icon" />
          </div>
          <div className="stat-content">
            <h3>Total Articles</h3>
            <p className="stat-value">{totalArticles}</p>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon-wrap">
            <FaUsers className="stat-icon" />
          </div>
          <div className="stat-content">
            <h3>Total Players</h3>
            <p className="stat-value">{totalPlayers}</p>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon-wrap">
            <FaCalendarAlt className="stat-icon" />
          </div>
          <div className="stat-content">
            <h3>Total Seasons</h3>
            <p className="stat-value">{totalSeasons}</p>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon-wrap">
            <FaTrophy className="stat-icon" />
          </div>
          <div className="stat-content">
            <h3>Total Awards</h3>
            <p className="stat-value">{totalAwards}</p>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon-wrap">
            <FaVolleyballBall className="stat-icon" />
          </div>
          <div className="stat-content">
            <h3>Total Games</h3>
            <p className="stat-value">{totalGames}</p>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon-wrap">
            <FaClock className="stat-icon" />
          </div>
          <div className="stat-content">
            <h3>Scheduled Games</h3>
            <p className="stat-value">{scheduledGames}</p>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon-wrap">
            <FaTrophy className="stat-icon" />
          </div>
          <div className="stat-content">
            <h3>Completed Games</h3>
            <p className="stat-value">{completedGames}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="dashboard-action-buttons">
          <button className="dashboard-action-button" onClick={() => window.location.href = '/portal/teams'}>
            Manage Teams
          </button>
          <button className="dashboard-action-button" onClick={() => window.location.href = '/portal/articles'}>
            Manage Articles
          </button>
          <button className="dashboard-action-button" onClick={() => window.location.href = '/portal/seasons'}>
            Manage Seasons
          </button>
          <button className="dashboard-action-button" onClick={() => window.location.href = '/portal/games'}>
            Manage Games
          </button>
          <button className="dashboard-action-button" onClick={() => window.location.href = '/portal/stats'}>
            Manage Stats
          </button>
          <button className="dashboard-action-button" onClick={() => window.location.href = '/portal/players'}>
            Manage Players
          </button>
          <button className="dashboard-action-button" onClick={() => window.location.href = '/portal/users'}>
            Manage Users
          </button>
          <button className="dashboard-action-button" onClick={() => window.location.href = '/portal/awards'}>
            Manage Awards
          </button>
          <button className="dashboard-action-button" onClick={() => window.location.href = '/portal/applications'}>
            Manage Applications
          </button>
        </div>
      </div>

      <div className="dashboard-quote">
        <img
          src={LuvLateAvatar}
          alt="LuvLate"
          className="dashboard-quote-avatar"
        />
        <blockquote className="dashboard-quote-text">
          &ldquo;Every great season starts with the people behind the scenes.&rdquo;
        </blockquote>
      </div>
    </div>
  );
};

export default Dashboard;
      