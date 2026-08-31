import React, { useState, useEffect } from 'react';
import { FaVolleyballBall, FaUserAlt, FaChartBar, FaNewspaper, FaUsers, FaCalendarAlt, FaTrophy, FaClock } from 'react-icons/fa';
import LuvLateAvatar from '../../images/LuvLate.png';
import { BACKEND_URL } from '../../constants/api';

const dashboard = "p-[2rem] max-w-[1200px] my-0 mx-auto upto-md:p-[1rem]";

const statsGrid =
  "grid grid-cols-5 gap-[1.25rem] mb-[3rem] w-full " +
  "upto-1100:grid-cols-4 upto-lg:grid-cols-3 upto-md:grid-cols-2 upto-xs:grid-cols-1";

const statCard =
  "bg-white rounded-[10px] py-[1.25rem] px-[1rem] shadow-[0_2px_8px_rgba(0,0,0,0.1)] " +
  "flex items-center gap-[0.75rem] w-full min-w-0 min-h-[5.75rem] h-full box-border " +
  "transition-[transform] duration-200 ease-[ease] hover:[transform:translateY(-5px)] " +
  "upto-md:p-[1rem]";

const statIconWrap =
  "flex items-center justify-center shrink-0 w-[2.75rem] h-[2.75rem] " +
  "upto-md:w-[2.25rem] upto-md:h-[2.25rem]";

const statIcon = "text-[1.75rem] text-[#1e3d59] w-[1em] h-[1em] upto-md:text-[1.5rem]";

const statContent = "flex-1 min-w-0";

const statLabel =
  "text-[#1e3d59]! text-[0.8125rem] leading-[1.3] mt-0 mr-0 mb-[0.375rem] ml-0";

const statValue =
  "text-[#1e3d59]! text-[1.75rem] font-bold m-0 leading-none upto-md:text-[1.5rem]";

const quickActions = "mb-0";

const quickActionsTitle = "text-[#1e3d59] mb-[1.5rem]";

const actionButtons =
  "grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[1rem] upto-md:grid-cols-[1fr]";

const actionButton =
  "bg-[#1e3d59] text-white border-none p-[1rem] rounded-md text-[1rem] cursor-pointer " +
  "transition-colors duration-200 ease-[ease] hover:bg-[#2c5a7d]";

const quote =
  "flex items-center gap-[1.5rem] mt-[2.5rem] " +
  "upto-md:flex-col upto-md:items-start upto-md:gap-[1rem] upto-md:mt-[2rem]";

const quoteAvatar = "w-[4.5rem] h-[4.5rem] rounded-full object-cover shrink-0";

const quoteText =
  "m-0 text-[clamp(1.25rem,2.5vw,1.75rem)] leading-[1.4] font-semibold text-[#1e3d59] italic";

const backendUrl = BACKEND_URL;

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
    return <div className={dashboard}><p>Loading dashboard data...</p></div>;
  }

  return (
    <div className={dashboard}>
      {/* Quick Stats Cards */}
      <div className={statsGrid}>
        <div className={statCard}>
          <div className={statIconWrap}>
            <FaVolleyballBall className={statIcon} />
          </div>
          <div className={statContent}>
            <h3 className={statLabel}>Total Teams</h3>
            <p className={statValue}>{totalTeams}</p>
          </div>
        </div>

        <div className={statCard}>
          <div className={statIconWrap}>
            <FaUserAlt className={statIcon} />
          </div>
          <div className={statContent}>
            <h3 className={statLabel}>Total Users</h3>
            <p className={statValue}>{totalUsers}</p>
          </div>
        </div>

        <div className={statCard}>
          <div className={statIconWrap}>
            <FaChartBar className={statIcon} />
          </div>
          <div className={statContent}>
            <h3 className={statLabel}>Total Stat Entries</h3>
            <p className={statValue}>{totalStats}</p>
          </div>
        </div>

        <div className={statCard}>
          <div className={statIconWrap}>
            <FaNewspaper className={statIcon} />
          </div>
          <div className={statContent}>
            <h3 className={statLabel}>Total Articles</h3>
            <p className={statValue}>{totalArticles}</p>
          </div>
        </div>

        <div className={statCard}>
          <div className={statIconWrap}>
            <FaUsers className={statIcon} />
          </div>
          <div className={statContent}>
            <h3 className={statLabel}>Total Players</h3>
            <p className={statValue}>{totalPlayers}</p>
          </div>
        </div>

        <div className={statCard}>
          <div className={statIconWrap}>
            <FaCalendarAlt className={statIcon} />
          </div>
          <div className={statContent}>
            <h3 className={statLabel}>Total Seasons</h3>
            <p className={statValue}>{totalSeasons}</p>
          </div>
        </div>

        <div className={statCard}>
          <div className={statIconWrap}>
            <FaTrophy className={statIcon} />
          </div>
          <div className={statContent}>
            <h3 className={statLabel}>Total Awards</h3>
            <p className={statValue}>{totalAwards}</p>
          </div>
        </div>

        <div className={statCard}>
          <div className={statIconWrap}>
            <FaVolleyballBall className={statIcon} />
          </div>
          <div className={statContent}>
            <h3 className={statLabel}>Total Games</h3>
            <p className={statValue}>{totalGames}</p>
          </div>
        </div>

        <div className={statCard}>
          <div className={statIconWrap}>
            <FaClock className={statIcon} />
          </div>
          <div className={statContent}>
            <h3 className={statLabel}>Scheduled Games</h3>
            <p className={statValue}>{scheduledGames}</p>
          </div>
        </div>

        <div className={statCard}>
          <div className={statIconWrap}>
            <FaTrophy className={statIcon} />
          </div>
          <div className={statContent}>
            <h3 className={statLabel}>Completed Games</h3>
            <p className={statValue}>{completedGames}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={quickActions}>
        <h2 className={quickActionsTitle}>Quick Actions</h2>
        <div className={actionButtons}>
          <button className={actionButton} onClick={() => window.location.href = '/portal/teams'}>
            Manage Teams
          </button>
          <button className={actionButton} onClick={() => window.location.href = '/portal/articles'}>
            Manage Articles
          </button>
          <button className={actionButton} onClick={() => window.location.href = '/portal/seasons'}>
            Manage Seasons
          </button>
          <button className={actionButton} onClick={() => window.location.href = '/portal/games'}>
            Manage Games
          </button>
          <button className={actionButton} onClick={() => window.location.href = '/portal/stats'}>
            Manage Stats
          </button>
          <button className={actionButton} onClick={() => window.location.href = '/portal/players'}>
            Manage Players
          </button>
          <button className={actionButton} onClick={() => window.location.href = '/portal/users'}>
            Manage Users
          </button>
          <button className={actionButton} onClick={() => window.location.href = '/portal/awards'}>
            Manage Awards
          </button>
          <button className={actionButton} onClick={() => window.location.href = '/portal/applications'}>
            Manage Applications
          </button>
        </div>
      </div>

      <div className={quote}>
        <img
          src={LuvLateAvatar}
          alt="LuvLate"
          className={quoteAvatar}
        />
        <blockquote className={quoteText}>
          &ldquo;Every great season starts with the people behind the scenes.&rdquo;
        </blockquote>
      </div>
    </div>
  );
};

export default Dashboard;
      