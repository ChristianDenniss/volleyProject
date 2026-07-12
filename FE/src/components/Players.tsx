import React, { useState, useMemo } from "react";
import { useMediumPlayers, useSkinnySeasons } from "../hooks/allFetch";
import { useNavigate } from "react-router-dom";
import type { Player, Team } from "../types/interfaces";
import Table, { type TableColumn } from "./ui/Table";
import "../styles/Players.css";
import "../styles/ListingPage.css";
import SearchBar from "./Searchbar";
import Pagination from "./Pagination";
import FilterBar from "./ui/FilterBar";
import { useRegion } from "../context/regionContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { PLAYER_POSITIONS } from "../constants/playerPositions";

/** Team history sorted oldest -> newest season, for the expanded detail panel. */
function getSortedPlayerTeams(player: Player): Team[] {
  if (!player.teams?.length) return [];
  return [...player.teams].sort(
    (a, b) => (a?.season?.seasonNumber ?? 0) - (b?.season?.seasonNumber ?? 0)
  );
}

/** "Jane Doe" -> "JD"; falls back to the first two characters for single/odd names. */
function getPlayerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const Players: React.FC = () => {
  const { regionQuery } = useRegion();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [seasonFilter, setSeasonFilter] = useState<string>("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const playersPerPage = 25;

  const debouncedSearch = useDebouncedValue(searchQuery);

  const { data: paginatedPlayers, totalPages, loading, error } = useMediumPlayers({
    page: currentPage,
    limit: playersPerPage,
    search: debouncedSearch || undefined,
    seasonId: seasonFilter || undefined,
    position: positionFilter || undefined,
    ...regionQuery,
  });

  const { data: seasons } = useSkinnySeasons({ page: 1, limit: 100, ...regionQuery });
  const seasonOptions = [...(seasons ?? [])].sort((a, b) => a.seasonNumber - b.seasonNumber);

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const playerColumns: TableColumn<Player>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Player",
        render: (player) => (
          <>
            <span className="listing-table-avatar" aria-hidden="true">
              {getPlayerInitials(player.name)}
            </span>
            {player.name}
          </>
        ),
      },
      {
        key: "position",
        header: "Position",
        render: (player) =>
          player.position && player.position !== "N/A" ? (
            <span className="listing-table-position-pill">{player.position}</span>
          ) : (
            "—"
          ),
      },
      {
        key: "teamsCount",
        header: "Teams",
        render: (player) => player.teams?.length ?? 0,
      },
      {
        key: "expand",
        header: "",
        render: (player) => (
          <span
            className={`listing-table-expand-toggle${expandedRows[player.id] ? " expanded" : ""}`}
            aria-hidden="true"
          >
            ▶
          </span>
        ),
      },
    ],
    [expandedRows]
  );

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

  return (
    <div className={`players-page ${loading ? "loading" : ""}`}>
      <div className="listing-controls-toolbar">
          <FilterBar onReset={clearFilters}>
            <div className="players-season-filter">
              <select
                id="season-filter"
                aria-label="Season"
                value={seasonFilter}
                onChange={(e) => {
                  setSeasonFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Seasons</option>
                {seasonOptions.map((season) => (
                  <option key={season.id} value={season.id.toString()}>
                    Season {season.seasonNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="players-position-filter">
              <select
                id="position-filter"
                aria-label="Position"
                value={positionFilter}
                onChange={(e) => {
                  setPositionFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Positions</option>
                {PLAYER_POSITIONS.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </div>
          </FilterBar>

          <div className="listing-search-row">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search players..."
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
      </div>

      {error ? (
        <div>Error: {error}</div>
      ) : (
        <div className="listing-content-wrapper">
          {loading ? (
            <div className="listing-table-wrapper">
              <div className="listing-skeleton-table">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className="listing-skeleton-row" />
                ))}
              </div>
            </div>
          ) : !paginatedPlayers || paginatedPlayers.length === 0 ? (
            <div className="listing-table-empty">No players match your filters.</div>
          ) : (
            <Table
              columns={playerColumns}
              rows={paginatedPlayers}
              rowKey={(player) => player.id}
              tableClassName="listing-table"
              wrapperClassName="listing-table-wrapper"
              rowClassName={(player) =>
                `listing-row-clickable${expandedRows[player.id] ? " listing-row-expanded" : ""}`
              }
              onRowClick={(player) => toggleRow(player.id)}
              renderAfterRow={(player) => {
                if (!expandedRows[player.id]) return null;
                const teams = getSortedPlayerTeams(player);

                return (
                  <tr className="listing-table-detail-row">
                    <td colSpan={playerColumns.length}>
                      <div className="listing-table-detail">
                        {teams.length > 0 ? (
                          <div className="listing-table-detail-teams">
                            {teams.map((team) => (
                              <div key={team.id} className="listing-table-detail-team-row">
                                {team.logoUrl && (
                                  <img
                                    className="listing-table-detail-team-logo"
                                    src={team.logoUrl}
                                    alt={`${team.name} logo`}
                                  />
                                )}
                                <span>{team.name}</span>
                                <span className="listing-table-detail-team-season">
                                  Season {team.season?.seasonNumber ?? "?"}
                                </span>
                                {team.placement && (
                                  <span className="listing-table-detail-team-placement">
                                    {team.placement}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="listing-table-detail-empty">
                            No team history available.
                          </div>
                        )}

                        <button
                          type="button"
                          className="ui-btn ui-btn-primary listing-table-detail-profile-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/players/${player.id}`);
                          }}
                        >
                          View Full Profile →
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Players;
