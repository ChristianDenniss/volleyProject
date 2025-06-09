import { useStats, useTeams, useArticles, usePlayers, useSeasons, useGames, useUsers, useAwards } from "../../hooks/allFetch";
import { FaUsers, FaVolleyballBall, FaNewspaper, FaCalendarAlt, FaGamepad, FaChartBar, FaUserAlt, FaTrophy } from "react-icons/fa";
import "../../styles/Dashboard.css";

const Dashboard: React.FC = () => {
  const { data: stats, loading: statsLoading } = useStats();
  const { data: teams, loading: teamsLoading } = useTeams();
  const { data: articles, loading: articlesLoading } = useArticles();
  const { data: players, loading: playersLoading } = usePlayers();
  const { data: seasons, loading: seasonsLoading } = useSeasons();
  const { data: games, loading: gamesLoading } = useGames();
  const { data: users, loading: usersLoading } = useUsers();
  const { data: awards, loading: awardsLoading } = useAwards();
  
  const totalStats = stats?.length ?? 0;
  const totalTeams = teams?.length ?? 0;
  const totalArticles = articles?.length ?? 0;
  const totalPlayers = players?.length ?? 0;
  const totalSeasons = seasons?.length ?? 0;
  const totalGames = games?.length ?? 0;
  const totalUsers = users?.length ?? 0;
  const totalAwards = awards?.length ?? 0;
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
          <FaGamepad className="stat-icon" />
          <div className="stat-content">
            <h3>Total Games</h3>
            <p className="stat-value">{totalGames}</p>
          </div>
        </div>

        <div className="stat-card">
          <FaTrophy className="stat-icon" />
          <div className="stat-content">
            <h3>Total Awards</h3>
            <p className="stat-value">{totalAwards}</p>
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
          <button className="action-button" onClick={() => window.location.href = '/portal/articles'}>
            Manage Articles
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
            <li>View detailed player performance metrics</li>
            <li>Add new statistical entries for games</li>
            <li>Edit or update existing statistics</li>
            <li>Generate performance reports</li>
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
            <li>Manage article visibility and scheduling</li>
            <li>Add images and media to articles</li>
          </ul>
          <div className="important-note">
            <strong>Important Notes:</strong>
            <ul>
              <li>All player and team names must be entered in lowercase</li>
              <li>Articles can be edited after publishing</li>
              <li>Images should be optimized before upload</li>
            </ul>
          </div>
        </div>

        <div className="help-category">
          <h3>👥 Player Management</h3>
          <p>Handle player information and team assignments:</p>
          <ul>
            <li>Create new player profiles</li>
            <li>Assign players to teams</li>
            <li>Update player information</li>
            <li>View player history and statistics</li>
          </ul>
          <div className="important-note">
            <strong>Important Notes:</strong>
            <ul>
              <li>All usernames must be entered in lowercase</li>
              <li>Existing players will be added to teams without creating duplicates</li>
              <li>Verify username spelling before submission</li>
              <li>Check for existing accounts before creating new players</li>
            </ul>
          </div>
        </div>

        <div className="help-category">
          <h3>🏆 Awards & Recognition</h3>
          <p>Manage player and team achievements:</p>
          <ul>
            <li>Create and assign awards</li>
            <li>Track player achievements</li>
            <li>Manage seasonal awards</li>
            <li>View award history</li>
          </ul>
          <div className="important-note">
            <strong>Important Notes:</strong>
            <ul>
              <li>All player and team names must be entered in lowercase</li>
              <li>Awards cannot be deleted once assigned</li>
              <li>Verify recipient names before submission</li>
            </ul>
          </div>
        </div>

        <div className="help-category">
          <h3>🏐 Team Management</h3>
          <p>Handle team operations:</p>
          <ul>
            <li>Create and manage team rosters</li>
            <li>Update team information</li>
            <li>Track team statistics</li>
            <li>Manage team assignments</li>
          </ul>
          <div className="important-note">
            <strong>Important Notes:</strong>
            <ul>
              <li>All team names must be entered in lowercase</li>
              <li>Verify team name spelling before submission</li>
              <li>Check for existing teams before creating new ones</li>
              <li>Team names cannot be changed after creation</li>
            </ul>
          </div>
        </div>

        <div className="help-category">
          <h3>�� Game Management</h3>
          <p>Handle match operations:</p>
          <ul>
            <li>Schedule new games</li>
            <li>Record match results</li>
            <li>Update game statistics</li>
            <li>View game history</li>
          </ul>
          <div className="important-note">
            <strong>Important Notes:</strong>
            <ul>
              <li>All team names must be entered in lowercase</li>
              <li>Game results cannot be deleted once submitted</li>
              <li>Verify team names and scores before submission</li>
            </ul>
          </div>
        </div>

        <div className="help-category">
          <h3>📅 Season Management</h3>
          <p>Organize league seasons:</p>
          <ul>
            <li>Create new seasons</li>
            <li>Set season schedules</li>
            <li>Manage tournament brackets</li>
            <li>Track season standings</li>
          </ul>
          <div className="important-note">
            <strong>Important Notes:</strong>
            <ul>
              <li>All team names must be entered in lowercase</li>
              <li>Season schedules cannot be modified after games begin</li>
              <li>Verify team assignments before season start</li>
            </ul>
          </div>
        </div>

        <div className="help-category">
          <h3>👤 User Management</h3>
          <p>Handle user accounts:</p>
          <ul>
            <li>Create new user accounts</li>
            <li>Manage user permissions</li>
            <li>Update user information</li>
            <li>Handle account access</li>
          </ul>
          <div className="important-note">
            <strong>Important Notes:</strong>
            <ul>
              <li>All usernames must be entered in lowercase</li>
              <li>User permissions should be carefully assigned</li>
              <li>Verify user information before submission</li>
              <li>Check for existing accounts before creating new ones</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
      