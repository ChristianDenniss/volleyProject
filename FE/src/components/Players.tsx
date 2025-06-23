import React, { useState, useEffect, useMemo } from "react";
import { useMediumPlayers } from "../hooks/allFetch";
import { Link } from "react-router-dom";
import "../styles/Players.css";
import SearchBar from "./Searchbar";
import Pagination from "./Pagination";

const Players: React.FC = () => {
  const { data, error } = useMediumPlayers();

  const [activePlayer, setActivePlayer] = useState<string | null>(null);
  const [previousActivePlayer, setPreviousActivePlayer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [seasonFilter, setSeasonFilter] = useState<string>("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const playersPerPage = 25;

  useEffect(() => {
    if (previousActivePlayer !== null) {
      console.log("Previous active player:", previousActivePlayer);
    }
  }, [previousActivePlayer]);

  const toggleCard = (playerName: string) => {
    console.log("Player card clicked:", playerName);
    setPreviousActivePlayer(activePlayer);
    setActivePlayer(prev => (prev === playerName ? null : playerName));
  };

  // Get unique seasons and positions for filter options
  const uniqueSeasons = useMemo(() => {
    const seasons = new Set<number>();
    data?.forEach(player => {
      player.teams?.forEach(team => {
        if (team?.season?.seasonNumber) {
          seasons.add(team.season.seasonNumber);
        }
      });
    });
    return Array.from(seasons).sort((a, b) => a - b);
  }, [data]);

  const uniquePositions = useMemo(() => {
    const positions = new Set<string>();
    data?.forEach(player => {
      if (player.position && player.position !== "N/A") {
        positions.add(player.position);
      }
    });
    return Array.from(positions).sort();
  }, [data]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSeasonFilter("");
    setPositionFilter("");
    setCurrentPage(1);
  };

  const filteredPlayers = useMemo(() => {
    return data?.filter((player) => {
      const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeason = !seasonFilter || player.teams?.some(
        (team) => team?.season?.seasonNumber.toString() === seasonFilter
      );
      const matchesPosition = !positionFilter || player.position === positionFilter;
      
      return matchesSearch && matchesSeason && matchesPosition;
    }) || [];
  }, [data, searchQuery, seasonFilter, positionFilter]);

  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);
  const paginatedPlayers = filteredPlayers.slice(
    (currentPage - 1) * playersPerPage,
    currentPage * playersPerPage
  );

  return (
    <div className={`players-page ${!data ? 'loading' : ''}`}>
      <h1>All Players</h1>

      {/* Controls */}
      <div className="players-controls-wrapper">
        <div className="players-controls-container">
          {/* Filters Row */}
          <div className="players-filters-row">
            <div className="players-season-filter">
              <label htmlFor="season-filter">Season:</label>
              <select
                id="season-filter"
                value={seasonFilter}
                onChange={(e) => {
                  setSeasonFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Seasons</option>
                {uniqueSeasons.map(season => (
                  <option key={season} value={season.toString()}>
                    Season {season}
                  </option>
                ))}
              </select>
            </div>

            <div className="players-position-filter">
              <label htmlFor="position-filter">Position:</label>
              <select
                id="position-filter"
                value={positionFilter}
                onChange={(e) => {
                  setPositionFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Positions</option>
                {uniquePositions.map(position => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </div>

            {(searchQuery || seasonFilter || positionFilter) && (
              <button
                className="clear-filters-button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Search and Pagination Row */}
          <div className="players-search-row">
            <SearchBar 
              onSearch={handleSearch} 
              placeholder="Search players..." 
              className="players-search-bar"
            />
            <div className="players-pagination-wrapper">
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
      ) : !data ? (
        <div className="players-wrapper">
          <div className="players-container">
            {/* Skeleton loaders */}
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="players-skeleton"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="players-wrapper">
          <div className="players-container">
            {paginatedPlayers.map((player) => (
              <div
                key={player.id}
                className={`players-card ${activePlayer === player.name ? "expanded" : ""}`}
                onClick={() => toggleCard(player.name)}
              >
                <div className="players-card-header">
                  <div className="players-name">
                    <strong>{player.name}</strong>
                  </div>
                  <div className="players-id">
                    <strong>ID:</strong> {player.id}
                  </div>
                  <div className="players-teams">
                    <strong>Total Teams:</strong> {player.teams?.length || 0}
                  </div>
                </div>

                <div className="players-details">
                  <p><strong>Position:</strong> {player.position || 'N/A'}</p>
                  <p>
                    <strong>Teams:</strong><br />
                  </p>
                  {player.teams && player.teams.length > 0 ? (
                    [...player.teams]
                      .sort((a, b) => {
                        const seasonA = a?.season?.seasonNumber ?? 0;
                        const seasonB = b?.season?.seasonNumber ?? 0;
                        return seasonA - seasonB;
                      })
                      .reduce<string[][]>((acc, team, index) => {
                        const seasonNumber = team?.season?.seasonNumber ?? "N/A";
                        const formatted = `${team.name} (Season ${seasonNumber})`;
                        const chunkIndex = Math.floor(index / 5);

                        if (!acc[chunkIndex]) {
                          acc[chunkIndex] = [];
                        }

                        acc[chunkIndex].push(formatted);
                        return acc;
                      }, [])
                      .map((group, idx) => (
                        <div key={idx} className="players-team-line">
                          {group.map((teamDisplayName, teamIdx) => {
                            const rawTeamName = teamDisplayName.split(" (Season")[0];
                            const linkPath = `/teams/${rawTeamName.toLowerCase().replace(/\s+/g, "-")}`;
                            return (
                              <Link
                                key={teamIdx}
                                className="players-team-tag"
                                to={linkPath}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {teamDisplayName}
                              </Link>
                            );
                          })}
                        </div>
                      ))
                  ) : (
                    "No Teams To Show"
                  )}
                  <div className="players-see-more">
                    <Link 
                      to={`/players/${player.id}`}
                      className="see-more-button"
                      onClick={(e) => e.stopPropagation()}
                    >
                      See More
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Players;
