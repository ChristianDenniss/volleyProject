import React, { useState } from "react";
import { usePlayers } from "../hooks/allFetch";
import { Player } from "../types/interfaces";
import "../styles/StatsLeaderboard.css";
import SearchBar from "./Searchbar";
import Pagination from "./Pagination";
import SeasonFilter from "./SeasonFilterBar";

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
  | 'miscErrors';

const StatsLeaderboard: React.FC = () => {
  const { data: players, error } = usePlayers();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sortColumn, setSortColumn] = useState<StatCategory | 'name' | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [visibleStats, setVisibleStats] = useState<Record<StatCategory, boolean>>({
    spikeKills: true,
    spikeAttempts: true,
    apeKills: true,
    apeAttempts: true,
    spikingErrors: true,
    digs: true,
    blocks: true,
    assists: true,
    aces: true,
    settingErrors: true,
    blockFollows: true,
    servingErrors: true,
    miscErrors: true
  });
  const playersPerPage = 25;

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
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
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
    
    // Filter stats by selected season if one is selected
    const relevantStats = selectedSeason === null 
      ? player.stats 
      : player.stats.filter(statRecord => statRecord.game?.season?.seasonNumber === selectedSeason);
    
    return relevantStats.reduce((total, statRecord) => total + (statRecord[stat] || 0), 0);
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

  const filteredPlayers = players?.filter((player) => {
    const matchesSearchQuery = player.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeason = selectedSeason === null || player.teams?.some(
      (team) => team?.season?.seasonNumber === selectedSeason
    );
    const hasStats = hasAnyStats(player);
    return matchesSearchQuery && matchesSeason && hasStats;
  }) || [];

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (sortColumn === 'name') {
      return sortDirection === 'desc' 
        ? b.name.localeCompare(a.name)
        : a.name.localeCompare(b.name);
    }
    const statA = getPlayerStat(a, sortColumn as StatCategory || 'spikeKills');
    const statB = getPlayerStat(b, sortColumn as StatCategory || 'spikeKills');
    return sortDirection === 'desc' ? statB - statA : statA - statB;
  });

  const totalPages = Math.ceil(sortedPlayers.length / playersPerPage);
  const paginatedPlayers = sortedPlayers.slice(
    (currentPage - 1) * playersPerPage,
    currentPage * playersPerPage
  );

  const statCategories: StatCategory[] = [
    'spikeKills',
    'spikeAttempts',
    'apeKills',
    'apeAttempts',
    'spikingErrors',
    'digs',
    'blocks',
    'assists',
    'aces',
    'settingErrors',
    'blockFollows',
    'servingErrors',
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

  return (
    <div className="stats-leaderboard-page">
      <h1>Statistics Leaderboard</h1>

      <div className="stats-controls-wrapper">
        <div className="stats-controls-container">
          <div className="stats-season-filter">
            <SeasonFilter selectedSeason={selectedSeason} onSeasonChange={handleSeasonChange} />
          </div>
          <div className="stats-filter-menu">
            <button 
              className="filter-menu-button"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              Filter Stats {showFilterMenu ? '▼' : '▲'}
            </button>
            {showFilterMenu && (
              <div className="filter-menu-dropdown">
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
              </div>
            )}
          </div>
          <div className="stats-search-wrapper">
            <SearchBar onSearch={handleSearch} placeholder="Search Players..." />
          </div>
          <div className="stats-pagination-wrapper">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      {error ? (
        <div>Error: {error}</div>
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
                  Player Name
                  {sortColumn === 'name' && (
                    <span className={`sort-arrow ${sortDirection}`}>
                      {sortDirection === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </th>
                {selectedSeason !== null && (
                  <th>Team</th>
                )}
                {visibleStatCategories.map((stat) => (
                  <th 
                    key={stat}
                    onClick={() => handleSort(stat)}
                    className="sortable"
                  >
                    {formatStatName(stat)}
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
              {paginatedPlayers.map((player, index) => (
                <tr key={player.id}>
                  <td>{(currentPage - 1) * playersPerPage + index + 1}</td>
                  <td>{player.name}</td>
                  {selectedSeason !== null && (
                    <td>
                      {player.teams?.find(team => 
                        team?.season?.seasonNumber === selectedSeason
                      )?.name || 'N/A'}
                    </td>
                  )}
                  {visibleStatCategories.map((stat) => (
                    <td key={stat}>{getPlayerStat(player, stat)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StatsLeaderboard; 