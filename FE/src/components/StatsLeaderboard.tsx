import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { usePlayers } from "../hooks/allFetch";
import { Player, Stats } from "../types/interfaces";
import "../styles/StatsLeaderboard.css";
import SearchBar from "./Searchbar";
import Pagination from "./Pagination";
import SeasonFilter from "./SeasonFilterBar";
import { Link } from 'react-router-dom';

type StatCategory = 
  | 'spikeKills' 
  | 'spikeAttempts'
  | 'apeKills'
  | 'apeAttempts'
  | 'spikingErrors'
  | 'digs'
  | 'blocks'
  | 'assists'
  | 'aces'
  | 'settingErrors'
  | 'blockFollows'
  | 'servingErrors'
  | 'miscErrors'
  // Calculated columns:
  | 'totalAttempts'
  | 'totalKills'
  | 'totalSpike%'
  | 'Spike%'
  | 'Ape%'
  | 'totalReceives'
  | 'PRF'
  | 'totalErrors'
  | 'plusMinus';

type StatType = 'total' | 'perGame' | 'perSet';
type ViewType = 'player' | 'team';

interface TeamStatsData {
  id: string;
  name: string;
  season: number | null;
  players: Player[];
  stats: any[];
  totalStats: Record<StatCategory, number>;
  gamesPlayed: number;
  totalSets: number;
}

type DisplayData = Player | TeamStatsData;

const StatsLeaderboard: React.FC = () => {
  const { data: players, error } = usePlayers();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sortColumn, setSortColumn] = useState<StatCategory | 'name'>('totalKills');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [statType, setStatType] = useState<StatType>('total');
  const [viewType, setViewType] = useState<ViewType>('player');
  const [visibleStats, setVisibleStats] = useState<Record<StatCategory, boolean>>({
    spikeKills: false,
    spikeAttempts: false,
    apeKills: false,
    apeAttempts: false,
    spikingErrors: false,
    digs: false,
    blocks: true,
    assists: true,
    aces: true,
    settingErrors: false,
    blockFollows: false,
    servingErrors: false,
    miscErrors: false,
    // Calculated columns
    totalAttempts: true,
    totalKills: true,
    'totalSpike%': true,
    'Spike%': false,
    'Ape%': false,
    totalReceives: true,
    PRF: false,
    totalErrors: true,
    plusMinus: false,
  });
  const playersPerPage = 25;
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (showFilterMenu && filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "absolute",
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        minWidth: 400,
        zIndex: 1000,
      });
    }
  }, [showFilterMenu]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleSeasonChange = (season: number | null) => {
    setSelectedSeason(season);
    setCurrentPage(1);
  };

  const handleSort = (stat: StatCategory | 'name') => {
    if (sortColumn === stat) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(stat);
      setSortDirection('desc');
    }
  };

  const toggleStatVisibility = (stat: StatCategory) => {
    setVisibleStats(prev => ({
      ...prev,
      [stat]: !prev[stat]
    }));
  };

  const toggleAllStats = () => {
    const allVisible = Object.values(visibleStats).every(v => v);
    setVisibleStats(prev => 
      Object.keys(prev).reduce((acc, key) => ({
        ...acc,
        [key]: !allVisible
      }), {} as Record<StatCategory, boolean>)
    );
  };

  const getPlayerStat = (player: Player, stat: StatCategory): number => {
    if (!player.stats || player.stats.length === 0) return 0;
    const relevantStats = selectedSeason === null
      ? player.stats
      : player.stats.filter(statRecord => statRecord.game?.season?.seasonNumber === selectedSeason);
    if (relevantStats.length === 0) return 0;
    const sum = (key: keyof Stats) => relevantStats.reduce((total, statRecord) => {
      const value = statRecord[key];
      return total + (typeof value === 'number' ? value : 0);
    }, 0);
    
    let totalStat = 0;
    switch (stat) {
      case 'totalAttempts':
        totalStat = sum('apeAttempts') + sum('spikeAttempts');
        break;
      case 'totalKills':
        totalStat = sum('apeKills') + sum('spikeKills');
        break;
      case 'totalSpike%': {
        const attempts = sum('apeAttempts') + sum('spikeAttempts');
        const kills = sum('apeKills') + sum('spikeKills');
        totalStat = attempts > 0 ? kills / attempts : 0;
        break;
      }
      case 'totalReceives':
        totalStat = sum('digs') + sum('blockFollows');
        break;
      case 'PRF':
        totalStat = sum('apeKills') + sum('spikeKills') + sum('aces') + sum('assists');
        break;
      case 'totalErrors':
        totalStat = sum('miscErrors') + sum('spikingErrors') + sum('settingErrors') + sum('servingErrors');
        break;
      case 'plusMinus': {
        const prf = sum('apeKills') + sum('spikeKills') + sum('aces') + sum('assists');
        const lrf = sum('miscErrors') + sum('spikingErrors') + sum('settingErrors') + sum('servingErrors');
        totalStat = prf - lrf;
        break;
      }
      case 'Spike%': {
        const attempts = sum('spikeAttempts');
        const kills = sum('spikeKills');
        totalStat = attempts > 0 ? kills / attempts : 0;
        break;
      }
      case 'Ape%': {
        const attempts = sum('apeAttempts');
        const kills = sum('apeKills');
        totalStat = attempts > 0 ? kills / attempts : 0;
        break;
      }
      default:
        totalStat = (stat in relevantStats[0]) ? sum(stat as keyof Stats) : 0;
    }

    if (statType === 'total') {
      return totalStat;
    }

    if (statType === 'perGame') {
      // Get unique games to count games played
      const uniqueGames = new Set(relevantStats.map(statRecord => statRecord.game?.id));
      const gamesPlayed = uniqueGames.size;
      return gamesPlayed > 0 ? totalStat / gamesPlayed : 0;
    }

    if (statType === 'perSet') {
      // Calculate total sets played from game scores
      const totalSets = relevantStats.reduce((total, statRecord) => {
        const game = statRecord.game;
        if (game && typeof game.team1Score === 'number' && typeof game.team2Score === 'number') {
          return total + game.team1Score + game.team2Score;
        }
        return total;
      }, 0);
      
      return totalSets > 0 ? totalStat / totalSets : 0;
    }

    return totalStat;
  };

  // Function to aggregate stats by team
  const getTeamStats = () => {
    if (!players) return [];
    
    const teamStatsMap = new Map<string, {
      id: string;
      name: string;
      season: number | null;
      players: Player[];
      stats: any[];
      totalStats: Record<StatCategory, number>;
      gamesPlayed: Set<number>;
      totalSets: number;
    }>();
    
    players.forEach(player => {
      if (!player.teams) return;
      
      player.teams.forEach(team => {
        // Skip if season filter is applied and team doesn't match
        if (selectedSeason !== null && team.season?.seasonNumber !== selectedSeason) return;
        
        const teamKey = `${team.name}-${team.season?.seasonNumber || 'all'}`;
        
        if (!teamStatsMap.has(teamKey)) {
          teamStatsMap.set(teamKey, {
            id: teamKey,
            name: team.name,
            season: team.season?.seasonNumber || null,
            players: [],
            stats: [],
            totalStats: {
              spikeKills: 0,
              spikeAttempts: 0,
              apeKills: 0,
              apeAttempts: 0,
              spikingErrors: 0,
              digs: 0,
              blocks: 0,
              assists: 0,
              aces: 0,
              settingErrors: 0,
              blockFollows: 0,
              servingErrors: 0,
              miscErrors: 0,
              totalAttempts: 0,
              totalKills: 0,
              'totalSpike%': 0,
              'Spike%': 0,
              'Ape%': 0,
              totalReceives: 0,
              PRF: 0,
              totalErrors: 0,
              plusMinus: 0,
            },
            gamesPlayed: new Set(),
            totalSets: 0
          });
        }
        
        const teamData = teamStatsMap.get(teamKey)!;
        teamData.players.push(player);
        
        // Add player stats to team totals
        if (player.stats) {
          const relevantStats = selectedSeason === null 
            ? player.stats 
            : player.stats.filter(statRecord => statRecord.game?.season?.seasonNumber === selectedSeason);
          
          relevantStats.forEach(statRecord => {
            // Verify that this game involves the team we're aggregating for
            const game = statRecord.game;
            if (!game) return;
            
            // If game.teams is not available (backend hasn't been updated yet), 
            // fall back to a simpler approach: assume the player's stats belong to their current team
            let teamInGame = true;
            
            if (game.teams && game.teams.length > 0) {
              // Check if the team is one of the teams in this game
              teamInGame = game.teams.some(gameTeam => 
                gameTeam.name === team.name && 
                gameTeam.season?.seasonNumber === team.season?.seasonNumber
              );
            }
            
            // Only add stats if the team was actually involved in this game
            if (teamInGame) {
              teamData.gamesPlayed.add(game.id || 0);
              // Add to total sets
              if (typeof game.team1Score === 'number' && typeof game.team2Score === 'number') {
                teamData.totalSets += game.team1Score + game.team2Score;
              }
              // Add to stat totals - only add actual Stats properties, not calculated fields
              if (statRecord.spikeKills !== undefined) teamData.totalStats.spikeKills += statRecord.spikeKills;
              if (statRecord.spikeAttempts !== undefined) teamData.totalStats.spikeAttempts += statRecord.spikeAttempts;
              if (statRecord.apeKills !== undefined) teamData.totalStats.apeKills += statRecord.apeKills;
              if (statRecord.apeAttempts !== undefined) teamData.totalStats.apeAttempts += statRecord.apeAttempts;
              if (statRecord.spikingErrors !== undefined) teamData.totalStats.spikingErrors += statRecord.spikingErrors;
              if (statRecord.digs !== undefined) teamData.totalStats.digs += statRecord.digs;
              if (statRecord.blocks !== undefined) teamData.totalStats.blocks += statRecord.blocks;
              if (statRecord.assists !== undefined) teamData.totalStats.assists += statRecord.assists;
              if (statRecord.aces !== undefined) teamData.totalStats.aces += statRecord.aces;
              if (statRecord.settingErrors !== undefined) teamData.totalStats.settingErrors += statRecord.settingErrors;
              if (statRecord.blockFollows !== undefined) teamData.totalStats.blockFollows += statRecord.blockFollows;
              if (statRecord.servingErrors !== undefined) teamData.totalStats.servingErrors += statRecord.servingErrors;
              if (statRecord.miscErrors !== undefined) teamData.totalStats.miscErrors += statRecord.miscErrors;
            }
          });
        }
      });
    });
    
    return Array.from(teamStatsMap.values()).map(teamData => ({
      ...teamData,
      totalSets: teamData.totalSets / teamData.players.length, // Average sets per player to avoid double counting
      gamesPlayed: teamData.gamesPlayed.size
    }));
  };

  const getTeamStat = (teamData: any, stat: StatCategory): number => {
    const sum = (key: StatCategory) => teamData.totalStats[key] || 0;
    
    let totalStat = 0;
    switch (stat) {
      case 'totalAttempts':
        totalStat = sum('apeAttempts') + sum('spikeAttempts');
        break;
      case 'totalKills':
        totalStat = sum('apeKills') + sum('spikeKills');
        break;
      case 'totalSpike%': {
        const attempts = sum('apeAttempts') + sum('spikeAttempts');
        const kills = sum('apeKills') + sum('spikeKills');
        totalStat = attempts > 0 ? kills / attempts : 0;
        break;
      }
      case 'totalReceives':
        totalStat = sum('digs') + sum('blockFollows');
        break;
      case 'PRF':
        totalStat = sum('apeKills') + sum('spikeKills') + sum('aces') + sum('assists');
        break;
      case 'totalErrors':
        totalStat = sum('miscErrors') + sum('spikingErrors') + sum('settingErrors') + sum('servingErrors');
        break;
      case 'plusMinus': {
        const prf = sum('apeKills') + sum('spikeKills') + sum('aces') + sum('assists');
        const lrf = sum('miscErrors') + sum('spikingErrors') + sum('settingErrors') + sum('servingErrors');
        totalStat = prf - lrf;
        break;
      }
      case 'Spike%': {
        const attempts = sum('spikeAttempts');
        const kills = sum('spikeKills');
        totalStat = attempts > 0 ? kills / attempts : 0;
        break;
      }
      case 'Ape%': {
        const attempts = sum('apeAttempts');
        const kills = sum('apeKills');
        totalStat = attempts > 0 ? kills / attempts : 0;
        break;
      }
      default:
        totalStat = sum(stat);
    }

    if (statType === 'total') {
      return totalStat;
    }

    if (statType === 'perGame') {
      return teamData.gamesPlayed > 0 ? totalStat / teamData.gamesPlayed : 0;
    }

    if (statType === 'perSet') {
      return teamData.totalSets > 0 ? totalStat / teamData.totalSets : 0;
    }

    return totalStat;
  };

  const hasAnyStats = (player: Player): boolean => {
    if (!player.stats || player.stats.length === 0) return false;
    
    // Filter stats by selected season if one is selected
    const relevantStats = selectedSeason === null 
      ? player.stats 
      : player.stats.filter(statRecord => statRecord.game?.season?.seasonNumber === selectedSeason);
    
    return relevantStats.some(stat => 
      stat.spikeKills > 0 || 
      stat.spikeAttempts > 0 ||
      stat.apeKills > 0 ||
      stat.apeAttempts > 0 ||
      stat.spikingErrors > 0 ||
      stat.digs > 0 || 
      stat.blocks > 0 || 
      stat.assists > 0 || 
      stat.aces > 0 ||
      stat.settingErrors > 0 ||
      stat.blockFollows > 0 ||
      stat.servingErrors > 0 ||
      stat.miscErrors > 0
    );
  };

  // Get data based on view type
  const getDisplayData = (): DisplayData[] => {
    if (viewType === 'team') {
      return getTeamStats();
    }
    
    // Player view - filter players
    return players?.filter((player) => {
      const matchesSearchQuery = player.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeason = selectedSeason === null || player.teams?.some(
        (team) => team?.season?.seasonNumber === selectedSeason
      );
      const hasStats = hasAnyStats(player);
      return matchesSearchQuery && matchesSeason && hasStats;
    }) || [];
  };

  const displayData = getDisplayData();

  const sortedData = [...displayData].sort((a, b) => {
    if (sortColumn === 'name') {
      const nameA = a.name;
      const nameB = b.name;
      return sortDirection === 'desc' 
        ? nameB.localeCompare(nameA)
        : nameA.localeCompare(nameB);
    }
    
    const statA = viewType === 'team' 
      ? getTeamStat(a as TeamStatsData, sortColumn as StatCategory || 'totalKills')
      : getPlayerStat(a as Player, sortColumn as StatCategory || 'totalKills');
    const statB = viewType === 'team' 
      ? getTeamStat(b as TeamStatsData, sortColumn as StatCategory || 'totalKills')
      : getPlayerStat(b as Player, sortColumn as StatCategory || 'totalKills');
    
    return sortDirection === 'desc' ? statB - statA : statA - statB;
  });

  const totalPages = Math.ceil(sortedData.length / playersPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * playersPerPage,
    currentPage * playersPerPage
  );

  const statCategories: StatCategory[] = [
    'spikeKills',
    'spikeAttempts',
    'apeKills',
    'apeAttempts',
    'totalKills',
    'totalAttempts',
    'totalSpike%',
    'spikingErrors',
    'blocks',
    'assists',
    'settingErrors',
    'digs',
    'blockFollows',
    'totalReceives',
    'aces',
    'servingErrors',
    'PRF',
    'plusMinus',
    'totalErrors',
    'Spike%',
    'Ape%',
    'miscErrors'
  ];
  const visibleStatCategories = statCategories.filter(stat => visibleStats[stat]);

  const formatStatName = (stat: string): string => {
    return stat
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatStatValue = (stat: StatCategory, value: number, statType: StatType): string => {
    if (stat === 'totalSpike%' || stat === 'Spike%' || stat === 'Ape%') {
      // Format as percentage with exactly 2 decimal places
      return `${(value * 100).toFixed(2)}%`;
    }
    
    // For other stats, use existing logic
    return statType === 'total' 
      ? value.toString()
      : value.toFixed(1);
  };

  return (
    <div className={`stats-leaderboard-page ${!players ? 'loading' : ''}`}>
      <h1>Statistics Leaderboard</h1>

      <div className="stats-controls-wrapper">
        <div className="stats-controls-container">
          <div className="stats-filters-row">
            <div className="stats-season-filter">
              <SeasonFilter selectedSeason={selectedSeason} onSeasonChange={handleSeasonChange} />
            </div>
            <div className="stats-type-filter">
              <label htmlFor="stat-type">Stat Type:</label>
              <select
                id="stat-type"
                value={statType}
                onChange={(e) => setStatType(e.target.value as StatType)}
              >
                <option value="total">Total</option>
                <option value="perGame">Per Game</option>
                <option value="perSet">Per Set</option>
              </select>
            </div>
            <div className="stats-view-filter">
              <label htmlFor="view-type">View:</label>
              <select
                id="view-type"
                value={viewType}
                onChange={(e) => setViewType(e.target.value as ViewType)}
              >
                <option value="player">Players</option>
                <option value="team">Teams</option>
              </select>
            </div>
            <div className="stats-filter-menu">
              <button
                className="filter-menu-button"
                ref={filterButtonRef}
                onClick={() => setShowFilterMenu(!showFilterMenu)}
              >
                Filter Stats
              </button>
            </div>
          </div>
          <div className="stats-search-row">
            <SearchBar onSearch={handleSearch} placeholder={viewType === 'team' ? "Search Teams..." : "Search Players..."} />
            <div className="stats-pagination-wrapper">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>
      </div>

      {showFilterMenu && ReactDOM.createPortal(
        <div className="filter-menu-dropdown" style={dropdownStyle}>
          <div className="filter-menu-header">
            <label>
              <input
                type="checkbox"
                checked={Object.values(visibleStats).every(v => v)}
                onChange={toggleAllStats}
              />
              All Stats
            </label>
          </div>
          <div className="filter-menu-items">
            {statCategories.map((stat) => (
              <label key={stat} className="filter-menu-item">
                <input
                  type="checkbox"
                  checked={visibleStats[stat]}
                  onChange={() => toggleStatVisibility(stat)}
                />
                {stat.replace(/([A-Z])/g, ' $1').trim()}
              </label>
            ))}
          </div>
        </div>,
        document.body
      )}

      {error ? (
        <div>Error: {error}</div>
      ) : !players ? (
        <div className="stats-table-wrapper">
          <div className="stats-skeleton-table">
            {/* Skeleton loaders for table */}
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="stats-skeleton-row">
                {Array.from({ length: 8 }).map((_, cellIndex) => (
                  <div key={cellIndex} className="stats-skeleton-cell"></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="stats-table-wrapper">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th 
                  onClick={() => handleSort('name')}
                  className="sortable"
                >
                  {viewType === 'team' ? 'Team Name' : 'Player Name'}
                  {sortColumn === 'name' && (
                    <span className={`sort-arrow ${sortDirection}`}>
                      {sortDirection === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </th>
                {selectedSeason !== null && viewType === 'player' && (
                  <th>Team</th>
                )}
                {visibleStatCategories.map((stat) => (
                  <th 
                    key={stat}
                    onClick={() => handleSort(stat)}
                    className="sortable"
                  >
                    {formatStatName(stat)} {statType === 'perGame' ? '(Per Game)' : statType === 'perSet' ? '(Per Set)' : ''}
                    {sortColumn === stat && (
                      <span className={`sort-arrow ${sortDirection}`}>
                        {sortDirection === 'desc' ? '↓' : '↑'}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, index) => {
                const isPlayer = 'position' in item;
                const isTeam = 'totalStats' in item;
                
                return (
                  <tr key={item.id}>
                    <td>{(currentPage - 1) * playersPerPage + index + 1}</td>
                    <td>{
                      isPlayer
                        ? <Link className="stats-pill-link" to={`/players/${item.id}`}>{item.name}</Link>
                        : <Link className="stats-pill-link" to={`/teams/${encodeURIComponent(item.name)}`}>{item.name}</Link>
                    }</td>
                    {selectedSeason !== null && isPlayer && viewType === 'player' && (
                      <td>
                        {(() => {
                          const team = (item as Player).teams?.find(team => team?.season?.seasonNumber === selectedSeason);
                          return team ? (
                            <Link className="stats-pill-link" to={`/teams/${encodeURIComponent(team.name)}`}>{team.name}</Link>
                          ) : 'N/A';
                        })()}
                      </td>
                    )}
                    {visibleStatCategories.map((stat) => (
                      <td key={stat}>
                        {(() => {
                          const statValue = isTeam 
                            ? getTeamStat(item as TeamStatsData, stat)
                            : getPlayerStat(item as Player, stat);
                          
                          return formatStatValue(stat, statValue, statType);
                        })()}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StatsLeaderboard; 