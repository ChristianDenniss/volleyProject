import React, { useState, useEffect } from 'react';
import { FaVolleyballBall, FaUserAlt, FaChartBar, FaNewspaper, FaUsers, FaCalendarAlt, FaTrophy } from 'react-icons/fa';

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
        fetch('/api/stats'),
        fetch('/api/teams'),
        fetch('/api/articles'),
        fetch('/api/players'),
        fetch('/api/seasons'),
        fetch('/api/games'),
        fetch('/api/users'),
        fetch('/api/awards')
      ]);

      if (statsResponse.ok) setStats(await statsResponse.json());
      if (teamsResponse.ok) setTeams(await teamsResponse.json());
      if (articlesResponse.ok) setArticles(await articlesResponse.json());
      if (playersResponse.ok) setPlayers(await playersResponse.json());
      if (seasonsResponse.ok) setSeasons(await seasonsResponse.json());
      if (gamesResponse.ok) setGames(await gamesResponse.json());
      if (usersResponse.ok) setUsers(await usersResponse.json());
      if (awardsResponse.ok) setAwards(await awardsResponse.json());
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
          <FaTrophy className="stat-icon" />
          <div className="stat-content">
            <h3>Total Awards</h3>
            <p className="stat-value">{totalAwards}</p>
          </div>
        </div>

        <div className="stat-card">
          <FaVolleyballBall className="stat-icon" />
          <div className="stat-content">
            <h3>Total Games</h3>
            <p className="stat-value">{totalGames}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button className="action-button" onClick={() => window.location.href = '/portal/teams'}>
            Manage Teams
          </button>
          <button className="action-button" onClick={() => window.location.href = '/portal/articles'}>
            Manage Articles
          </button>
          <button className="action-button" onClick={() => window.location.href = '/portal/seasons'}>
            Manage Seasons
          </button>
          <button className="action-button" onClick={() => window.location.href = '/portal/games'}>
            Manage Games
          </button>
          <button className="action-button" onClick={() => window.location.href = '/portal/stats'}>
            Manage Stats
          </button>
          <button className="action-button" onClick={() => window.location.href = '/portal/players'}>
            Manage Players
          </button>
          <button className="action-button" onClick={() => window.location.href = '/portal/users'}>
            Manage Users
          </button>
          <button className="action-button" onClick={() => window.location.href = '/portal/awards'}>
            Manage Awards
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="help-section">
        <h2>Portal Guide</h2>
        
        <div className="help-category">
          <h3>📊 Stats Management</h3>
          <p>Track and manage player statistics:</p>
          <ul>
            <li>Stats admin board is WIP</li>
            <li>Add new statistical entries for games (WIP)</li>
            <li>Edit or update existing statistics (WIP)</li>
            <li>Delete statistics (WIP)</li>
          </ul>
          <div className="important-note">
            <strong>Important Notes:</strong>
            <ul>
              <li>All player names must be entered in lowercase</li>
              <li>Verify statistics before submission</li>
              <li>Statistics cannot be deleted once submitted</li>
            </ul>
          </div>
        </div>

        <div className="help-category">
          <h3>📰 Articles & Content</h3>
          <p>Manage league news and content:</p>
          <ul>
            <li>Create and publish new articles</li>
            <li>Edit existing articles</li>
            <li>Manage article approval status</li>
            <li>Delete articles if needed</li>
          </ul>
          <div className="important-note">
            <strong>Important Notes:</strong>
            <ul>
              <li>Articles can be marked as approved or pending</li>
              <li>Only approved articles appear on the public site</li>
              <li>Use rich text editor for formatting</li>
            </ul>
          </div>
        </div>

        <div className="help-category">
          <h3>👥 User Management</h3>
          <p>Manage user accounts and permissions:</p>
          <ul>
            <li>View all registered users</li>
            <li>Change user roles (user, admin, superadmin)</li>
            <li>Delete user accounts if necessary</li>
            <li>Monitor user activity</li>
          </ul>
          <div className="important-note">
            <strong>Important Notes:</strong>
            <ul>
              <li>Be careful when changing user roles</li>
              <li>Superadmin has full system access</li>
              <li>Admin can manage most content</li>
              <li>Regular users have limited access</li>
            </ul>
          </div>
        </div>

        <div className="help-category">
          <h3>🏆 Awards & Recognition</h3>
          <p>Manage player awards and achievements:</p>
          <ul>
            <li>Create new awards</li>
            <li>Assign awards to players</li>
            <li>Manage award categories</li>
            <li>Track award history</li>
          </ul>
          <div className="important-note">
            <strong>Important Notes:</strong>
            <ul>
              <li>Awards are tied to specific seasons</li>
              <li>Players can receive multiple awards</li>
              <li>Award data is permanent once created</li>
            </ul>
          </div>
        </div>

        <div className="help-category">
          <h3>🏐 Team & Player Management</h3>
          <p>Manage teams and player rosters:</p>
          <ul>
            <li>Create and edit teams</li>
            <li>Add players to teams</li>
            <li>Manage player profiles</li>
            <li>Track team rosters</li>
          </ul>
          <div className="important-note">
            <strong>Important Notes:</strong>
            <ul>
              <li>Players can be on multiple teams</li>
              <li>Team rosters change by season</li>
              <li>Player stats are tied to specific games</li>
            </ul>
          </div>
        </div>

        <div className="help-category">
          <h3>📅 Season & Game Management</h3>
          <p>Manage seasons and game schedules:</p>
          <ul>
            <li>Create new seasons</li>
            <li>Schedule games</li>
            <li>Track game results</li>
            <li>Manage season timelines</li>
          </ul>
          <div className="important-note">
            <strong>Important Notes:</strong>
            <ul>
              <li>Games are tied to specific seasons</li>
              <li>Game results affect player stats</li>
              <li>Season data is permanent once created</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
      