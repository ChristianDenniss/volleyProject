import React, { useState, useMemo } from "react";
import { useMediumPlayers } from "../hooks/allFetch";
import { Link, useNavigate } from "react-router-dom";
import type { Player } from "../types/interfaces";
import Table, { type TableColumn } from "./ui/Table";
import "../styles/Players.css";
import "../styles/ListingPage.css";
import SearchBar from "./Searchbar";
import Pagination from "./Pagination";
import FilterBar from "./ui/FilterBar";

function formatPlayerTeams(player: Player): string {
  if (!player.teams?.length) return "—";
  return [...player.teams]
    .sort((a, b) => (a?.season?.seasonNumber ?? 0) - (b?.season?.seasonNumber ?? 0))
    .map((team) => `${team.name} (S${team?.season?.seasonNumber ?? "?"})`)
    .join(", ");
}

function formatPlayerSeasons(player: Player): string {
  const seasons = new Set<number>();
  player.teams?.forEach((team) => {
    if (team?.season?.seasonNumber != null) {
      seasons.add(team.season.seasonNumber);
    }
  });
  if (seasons.size === 0) return "—";
  return Array.from(seasons)
    .sort((a, b) => a - b)
    .map((n) => `S${n}`)
    .join(", ");
}

const playerColumns: TableColumn<Player>[] = [
  {
    key: "name",
    header: "Player",
    render: (player) => (
      <Link to={`/players/${player.id}`} onClick={(e) => e.stopPropagation()}>
        {player.name}
      </Link>
    ),
  },
  {
    key: "position",
    header: "Position",
    render: (player) => player.position || "—",
  },
  {
    key: "teamsCount",
    header: "Teams",
    render: (player) => player.teams?.length ?? 0,
  },
  {
    key: "seasons",
    header: "Seasons",
    render: (player) => formatPlayerSeasons(player),
  },
  {
    key: "teamList",
    header: "Team History",
    render: (player) => (
      <span className="listing-table-teams" title={formatPlayerTeams(player)}>
        {formatPlayerTeams(player)}
      </span>
    ),
  },
];

const Players: React.FC = () => {
  const { data, error } = useMediumPlayers();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [seasonFilter, setSeasonFilter] = useState<string>("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const playersPerPage = 25;

  const uniqueSeasons = useMemo(() => {
    const seasons = new Set<number>();
    data?.forEach((player) => {
      player.teams?.forEach((team) => {
        if (team?.season?.seasonNumber) {
          seasons.add(team.season.seasonNumber);
        }
      });
    });
    return Array.from(seasons).sort((a, b) => a - b);
  }, [data]);

  const uniquePositions = useMemo(() => {
    const positions = new Set<string>();
    data?.forEach((player) => {
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
    return (
      data?.filter((player) => {
        const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSeason =
          !seasonFilter ||
          player.teams?.some((team) => team?.season?.seasonNumber.toString() === seasonFilter);
        const matchesPosition = !positionFilter || player.position === positionFilter;
        return matchesSearch && matchesSeason && matchesPosition;
      }) ?? []
    );
  }, [data, searchQuery, seasonFilter, positionFilter]);

  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);
  const paginatedPlayers = filteredPlayers.slice(
    (currentPage - 1) * playersPerPage,
    currentPage * playersPerPage
  );

  return (
    <div className={`players-page ${!data ? "loading" : ""}`}>
      <div className="players-controls-wrapper">
        <div className="players-controls-container">
          <FilterBar onReset={clearFilters}>
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
                {uniqueSeasons.map((season) => (
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
                {uniquePositions.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </div>
          </FilterBar>

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
        <div className="listing-table-wrapper">
          <div className="listing-skeleton-table">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="listing-skeleton-row" />
            ))}
          </div>
        </div>
      ) : paginatedPlayers.length === 0 ? (
        <div className="listing-table-empty">No players match your filters.</div>
      ) : (
        <Table
          columns={playerColumns}
          rows={paginatedPlayers}
          rowKey={(player) => player.id}
          tableClassName="listing-table"
          wrapperClassName="listing-table-wrapper"
          rowClassName={() => "listing-row-clickable"}
          onRowClick={(player) => navigate(`/players/${player.id}`)}
        />
      )}
    </div>
  );
};

export default Players;
