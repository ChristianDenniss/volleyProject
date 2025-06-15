import React, { useState } from "react";
import { usePlayers } from "../hooks/allFetch";
import { Player } from "../types/interfaces";
import "../styles/StatsLeaderboard.css";
import SearchBar from "./Searchbar";
import Pagination from "./Pagination";
import SeasonFilter from "./SeasonFilterBar";

type StatCategory = 'spikeKills' | 'assists' | 'blocks' | 'digs' | 'aces' | 'spikingErrors';

const StatsLeaderboard: React.FC = () => {
  const { data: players, error } = usePlayers();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedStat, setSelectedStat] = useState<StatCategory | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sortColumn, setSortColumn] = useState<StatCategory | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [visibleStats, setVisibleStats] = useState<Record<StatCategory, boolean>>({
    spikeKills: true,
    assists: true,
    blocks: true,
    digs: true,
    aces: true,
    spikingErrors: true
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

  const handleStatChange = (stat: StatCategory) => {
    setSelectedStat(stat);
    setCurrentPage(1);
  };

  const handleSort = (stat: StatCategory) => {
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
    return player.stats.reduce((total, statRecord) => total + (statRecord[stat] || 0), 0);
  };

  const hasAnyStats = (player: Player): boolean => {
    if (!player.stats || player.stats.length === 0) return false;
    return player.stats.some(stat => 
      stat.spikeKills > 0 || 
      stat.assists > 0 || 
      stat.blocks > 0 || 
      stat.digs > 0 || 
      stat.aces > 0 || 
      stat.spikingErrors > 0
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
    const statA = getPlayerStat(a, sortColumn || selectedStat || 'spikeKills');
    const statB = getPlayerStat(b, sortColumn || selectedStat || 'spikeKills');
    return sortDirection === 'desc' ? statB - statA : statA - statB;
  });

  const totalPages = Math.ceil(sortedPlayers.length / playersPerPage);
  const paginatedPlayers = sortedPlayers.slice(
    (currentPage - 1) * playersPerPage,
    currentPage * playersPerPage
  );

  const statCategories: StatCategory[] = ['spikeKills', 'assists', 'blocks', 'digs', 'aces', 'spikingErrors'];
  const visibleStatCategories = statCategories.filter(stat => visibleStats[stat]);

  return (
    <div className="stats-leaderboard-page">
      <h1>Statistics Leaderboard</h1>

      <div className="stats-controls-wrapper">
        <div className="stats-controls-container">
          <div className="stats-season-filter">
            <SeasonFilter selectedSeason={selectedSeason} onSeasonChange={handleSeasonChange} />
          </div>
          <div className="stats-stat-filter">
            <button
              className={`stat-button ${selectedStat === null ? 'active' : ''}`}
              onClick={() => setSelectedStat(null)}
            >
              Show All
            </button>
            {statCategories.map((stat) => (
              <button
                key={stat}
                className={`stat-button ${selectedStat === stat ? 'active' : ''}`}
                onClick={() => handleStatChange(stat)}
              >
                {stat.replace(/([A-Z])/g, ' $1').trim()}
              </button>
            ))}
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
              )}
            </div>
          </div>
          <div className="stats-controls-right">
            <div className="stats-search-wrapper">
              <SearchBar onSearch={handleSearch} />
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
      </div>

      {error ? (
        <div>Error: {error}</div>
      ) : (
        <div className="stats-table-wrapper">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player Name</th>
                {visibleStatCategories.map((stat) => (
                  <th 
                    key={stat}
                    onClick={() => handleSort(stat)}
                    className="sortable"
                  >
                    {stat.replace(/([A-Z])/g, ' $1').trim()}
                    {sortColumn === stat && (
                      <span className={`sort-arrow ${sortDirection}`}>
                        {sortDirection === 'desc' ? '↓' : '↑'}
                      </span>
                    )}
                  </th>
                ))}
                {selectedSeason !== null && (
                  <>
                    <th>Team</th>
                    <th>Season</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedPlayers.map((player, index) => (
                <tr key={player.id}>
                  <td>{(currentPage - 1) * playersPerPage + index + 1}</td>
                  <td>{player.name}</td>
                  {visibleStatCategories.map((stat) => (
                    <td key={stat}>{getPlayerStat(player, stat)}</td>
                  ))}
                  {selectedSeason !== null && (
                    <>
                      <td>
                        {player.teams?.find(team => 
                          team?.season?.seasonNumber === selectedSeason
                        )?.name || 'N/A'}
                      </td>
                      <td>
                        {player.teams?.find(team => 
                          team?.season?.seasonNumber === selectedSeason
                        )?.season?.seasonNumber || 'N/A'}
                      </td>
                    </>
                  )}
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