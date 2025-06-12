import React, { useState, useEffect } from "react";
import { usePlayers } from "../hooks/allFetch";
import { Link } from "react-router-dom";
import "../styles/Players.css";
import SearchBar from "./Searchbar";
import Pagination from "./Pagination";
import SeasonFilter from "./SeasonFilterBar";

const Players: React.FC = () => {
  const { data, error } = usePlayers();

  const [activePlayer, setActivePlayer] = useState<string | null>(null);
  const [previousActivePlayer, setPreviousActivePlayer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleSeasonChange = (season: number | null) => {
    setSelectedSeason(season);
    setCurrentPage(1);
  };

  const filteredPlayers = data?.filter((player) => {
    const matchesSearchQuery = player.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeason = selectedSeason === null || player.teams?.some(
      (team) => team?.season?.seasonNumber === selectedSeason
    );
    return matchesSearchQuery && matchesSeason;
  }) || [];

  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);
  const paginatedPlayers = filteredPlayers.slice(
    (currentPage - 1) * playersPerPage,
    currentPage * playersPerPage
  );

  return (
    <div className="players-page">
      <h1>Player Info</h1>

      <div className="players-controls-wrapper">
        <div className="players-controls-container">
          <div className="players-season-filter">
            <SeasonFilter selectedSeason={selectedSeason} onSeasonChange={handleSeasonChange} />
          </div>

          <div className="players-search-pagination">
            <div className="players-search-wrapper">
              <SearchBar onSearch={handleSearch} />
            </div>

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
