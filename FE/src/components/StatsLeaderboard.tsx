import React, { useState, useEffect } from "react";
import { usePlayers } from "../hooks/allFetch";
import { Player, Stats } from "../types/interfaces";
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
  const [selectedStat, setSelectedStat] = useState<StatCategory>('spikeKills');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
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

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const getPlayerStat = (player: Player, stat: StatCategory): number => {
    if (!player.stats || player.stats.length === 0) return 0;
    return player.stats.reduce((total, statRecord) => total + (statRecord[stat] || 0), 0);
  };

  const filteredPlayers = players?.filter((player) => {
    const matchesSearchQuery = player.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeason = selectedSeason === null || player.teams?.some(
      (team) => team?.season?.seasonNumber === selectedSeason
    );
    return matchesSearchQuery && matchesSeason;
  }) || [];

  // Sort players based on selected stat
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const statA = getPlayerStat(a, selectedStat);
    const statB = getPlayerStat(b, selectedStat);
    return sortDirection === 'desc' ? statB - statA : statA - statB;
  });

  const totalPages = Math.ceil(sortedPlayers.length / playersPerPage);
  const paginatedPlayers = sortedPlayers.slice(
    (currentPage - 1) * playersPerPage,
    currentPage * playersPerPage
  );

  const statCategories: StatCategory[] = ['spikeKills', 'assists', 'blocks', 'digs', 'aces', 'spikingErrors'];

  return (
    <div className="stats-leaderboard-page">
      <h1>Statistics Leaderboard</h1>

      <div className="stats-controls-wrapper">
        <div className="stats-controls-container">
          <div className="stats-season-filter">
            <SeasonFilter selectedSeason={selectedSeason} onSeasonChange={handleSeasonChange} />
          </div>
          <div className="stats-stat-filter">
            {statCategories.map((stat) => (
              <button
                key={stat}
                className={`stat-button ${selectedStat === stat ? 'active' : ''}`}
                onClick={() => handleStatChange(stat)}
              >
                {stat.replace(/([A-Z])/g, ' $1').trim()}
              </button>
            ))}
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
                <th onClick={toggleSortDirection} className="sortable">
                  {selectedStat.replace(/([A-Z])/g, ' $1').trim()}
                  <span className={`sort-arrow ${sortDirection}`}>
                    {sortDirection === 'desc' ? '↓' : '↑'}
                  </span>
                </th>
                <th>Team</th>
                <th>Season</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPlayers.map((player, index) => (
                <tr key={player.id}>
                  <td>{(currentPage - 1) * playersPerPage + index + 1}</td>
                  <td>{player.name}</td>
                  <td>{getPlayerStat(player, selectedStat)}</td>
                  <td>
                    {player.teams?.find(team => 
                      selectedSeason === null || team?.season?.seasonNumber === selectedSeason
                    )?.name || 'N/A'}
                  </td>
                  <td>
                    {player.teams?.find(team => 
                      selectedSeason === null || team?.season?.seasonNumber === selectedSeason
                    )?.season?.seasonNumber || 'N/A'}
                  </td>
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