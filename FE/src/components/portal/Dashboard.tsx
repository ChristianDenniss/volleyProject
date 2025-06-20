import { useStats, useSkinnyTeams, useArticles, usePlayers, useSkinnySeasons, useSkinnyGames, useUsers, useSkinnyAwards } from "../../hooks/allFetch";
import { FaUsers, FaVolleyballBall, FaNewspaper, FaCalendarAlt, FaGamepad, FaChartBar, FaUserAlt, FaTrophy } from "react-icons/fa";
import "../../styles/Dashboard.css";

const Dashboard: React.FC = () => {
  const { data: stats, loading: statsLoading } = useStats();
  const { data: teams, loading: teamsLoading } = useSkinnyTeams();
  const { data: articles, loading: articlesLoading } = useArticles();
  const { data: players, loading: playersLoading } = usePlayers();
  const { data: seasons, loading: seasonsLoading } = useSkinnySeasons();
  const { data: games, loading: gamesLoading } = useSkinnyGames();
  const { data: users, loading: usersLoading } = useUsers();
  const { data: awards, loading: awardsLoading } = useSkinnyAwards();
  
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
            <li>Review pending articles for approval or rejection</li>
            <li>Click the article box to drop down its contents and confirm appropriate</li>
            <li>Hide previous approved articles</li>
            <li>Show previouslt rejected articles</li>
            <li>Change article visibility</li>
          </ul>
          <div className="important-note">
            <strong>Important Notes:</strong>
            <ul>
              <li>You must click the article box to drop down its contents</li>
              <li>Articles can only be created in the articles page</li>
              <li>make sure image is approved before publishing</li>
            </ul>
          </div>
        </div>

        <div className="help-category">
          <h3>👥 Player Management</h3>
          <p>Handle player information and team assignments:</p>
          <ul>
            <li>Create new players</li>
            <li>Assign players to teams</li>
            <li>Update player information like posistion</li>
            <li>Delete players</li>
            <li>Delete players from teams (WIP)</li>
          </ul>
          <div className="important-note">
            <strong>Important Notes:</strong>
            <ul>
              <li>All usernames must be entered in lowercase</li>
              <li>Existing players will be added to teams without creating duplicates</li>
              <li>Verify username spelling before submission</li>
              <li>Check for existing player on the website before creating new player</li>
              <li>Team names must be entered in lowercase</li>
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
            <li>Delete awards</li>
            <li>Edit award information like description</li>
            <li>View award history</li>
          </ul>
          <div className="important-note">
            <strong>Important Notes:</strong>
            <ul>
              <li>All players must be entered in lowercase</li>
              <li>One award type PER season</li>
              <li>Verify recipient names before submission</li>
            </ul>
          </div>
        </div>

        <div className="help-category">
          <h3>🏐 Team Management (WIP)</h3>
          <p>Handle team operations:</p>
          <ul>
            <li>Create and manage team player rosters (WIP)</li>
            <li>Update team information (WIP)</li>
            <li>Track team statistics (WIP)</li>
            <li>Manage team games (WIP)</li>
          </ul>
          <div className="important-note">
            <strong>Important Notes:</strong>
            <ul>
              <li>All team names must be entered in lowercase</li>
              <li>Verify team name spelling before submission</li>
              <li>Check for existing teams before creating new ones</li>
              <li>Team names must be unique</li>
              <li>Avoid changing team names to be safe</li>
            </ul>
          </div>
        </div>

        <div className="help-category">
          <h3>🏐 Game Management (WIP)</h3>
          <p>Handle match operations:</p>
          <ul>
            <li>Schedule new games (WIP)</li>
            <li>Record match results</li>
            <li>Delete games</li>
            <li>Edit game information like date, name, time and scores</li>
            <li>Assign teams to games (WIP)</li>
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
            <li>Set season theme</li>
            <li>Set season number</li>
          </ul>
          <div className="important-note">
            <strong>Important Notes:</strong>
            <ul>
              <li>Please make sure season number is correct, unique, and non-negative </li>
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
      