import React, { useState, useMemo } from "react";
import { useMediumPlayers, useSkinnySeasons } from "../hooks/allFetch";
import { useNavigate } from "react-router-dom";
import type { Player, Stats, Team } from "../types/interfaces";
import Table, { type TableColumn } from "./ui/Table";
import "../styles/Players.css";
import "../styles/ListingPage.css";
import SearchBar from "./Searchbar";
import Pagination from "./Pagination";
import FilterBar from "./ui/FilterBar";
import { useRegion } from "../context/regionContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import OverflowListCell from "./ui/OverflowListCell";
import { PLAYER_POSITIONS } from "../constants/playerPositions";

const LISTING_OVERFLOW_VISIBLE = 2;

interface PlayerSeasonEntry {
  seasonId: number;
  seasonNumber: number;
  regionCode: string | null;
}

function getRegionCodeForTeam(team: Team): string | null {
  return team.season?.region?.code ?? team.region?.code ?? null;
}

function getPlayerSeasons(player: Player): PlayerSeasonEntry[] {
  if (!player.teams?.length) return [];

  const seen = new Set<number>();
  const entries: PlayerSeasonEntry[] = [];

  for (const team of player.teams) {
    const season = team.season;
    if (!season?.id || seen.has(season.id)) continue;
    seen.add(season.id);

    entries.push({
      seasonId: season.id,
      seasonNumber: season.seasonNumber,
      regionCode: getRegionCodeForTeam(team),
    });
  }

  return entries.sort((a, b) => a.seasonNumber - b.seasonNumber);
}

function formatSeasonLabel(entry: PlayerSeasonEntry): string {
  const regionSuffix = entry.regionCode ? ` [${entry.regionCode.toUpperCase()}]` : "";
  return `Season ${entry.seasonNumber}${regionSuffix}`;
}

function formatPlayerSeasons(player: Player): string {
  const seasons = getPlayerSeasons(player);
  if (!seasons.length) return "—";
  return seasons.map(formatSeasonLabel).join(", ");
}

function getSortedPlayerTeams(player: Player): Team[] {
  if (!player.teams?.length) return [];
  return [...player.teams].sort(
    (a, b) => (a?.season?.seasonNumber ?? 0) - (b?.season?.seasonNumber ?? 0)
  );
}

function getPlayerTeamLabels(player: Player): string[] {
  return getSortedPlayerTeams(player).map((team) => team.name);
}

function getPlayerSeasonLabels(player: Player): string[] {
  return getPlayerSeasons(player).map(formatSeasonLabel);
}

function getPlayerCareerTotals(player: Player) {
  const stats = player.stats ?? [];
  const sum = (key: keyof Stats) =>
    stats.reduce(
      (total, stat) => total + (typeof stat[key] === "number" ? (stat[key] as number) : 0),
      0
    );

  return {
    kills: sum("apeKills") + sum("spikeKills"),
    assists: sum("assists"),
    blocks: sum("blocks"),
    receives: sum("digs") + sum("blockFollows"),
    aces: sum("aces"),
  };
}

function formatAwardsSummary(player: Player): string {
  const awards = player.awards ?? [];
  if (!awards.length) return "—";
  return awards.map((award) => award.type).join(", ");
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
        render: (player) => player.name,
      },
      {
        key: "position",
        header: "Position",
        render: (player) =>
          player.position && player.position !== "N/A" ? (
            <span className="listing-table-position-pill">{player.position}</span>
          ) : (
            "Unknown"
          ),
      },
      {
        key: "teams",
        header: "Teams",
        render: (player) => (
          <OverflowListCell
            className="listing-table-overflow-list"
            items={getPlayerTeamLabels(player)}
            maxVisible={LISTING_OVERFLOW_VISIBLE}
            popoverTitle="Teams"
          />
        ),
      },
      {
        key: "seasons",
        header: "Seasons",
        render: (player) => (
          <OverflowListCell
            className="listing-table-overflow-list"
            items={getPlayerSeasonLabels(player)}
            maxVisible={LISTING_OVERFLOW_VISIBLE}
            popoverTitle="Seasons"
          />
        ),
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

                const totals = getPlayerCareerTotals(player);
                const seasonsPlayed = formatPlayerSeasons(player);

                return (
                  <tr className="listing-table-detail-row">
                    <td colSpan={playerColumns.length}>
                      <div className="listing-table-detail">
                        <dl className="listing-table-detail-stats">
                          <div className="listing-table-detail-stat">
                            <dt>Awards</dt>
                            <dd>{formatAwardsSummary(player)}</dd>
                          </div>
                          <div className="listing-table-detail-stat">
                            <dt>Kills</dt>
                            <dd>{totals.kills}</dd>
                          </div>
                          <div className="listing-table-detail-stat">
                            <dt>Assists</dt>
                            <dd>{totals.assists}</dd>
                          </div>
                          <div className="listing-table-detail-stat">
                            <dt>Blocks</dt>
                            <dd>{totals.blocks}</dd>
                          </div>
                          <div className="listing-table-detail-stat">
                            <dt>Receives</dt>
                            <dd>{totals.receives}</dd>
                          </div>
                          <div className="listing-table-detail-stat">
                            <dt>Aces</dt>
                            <dd>{totals.aces}</dd>
                          </div>
                          <div className="listing-table-detail-stat listing-table-detail-stat--wide">
                            <dt>Seasons played</dt>
                            <dd>{seasonsPlayed}</dd>
                          </div>
                        </dl>

                        <button
                          type="button"
                          className="ui-btn ui-btn-primary listing-table-detail-profile-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/players/${player.id}`);
                          }}
                        >
                          View profile
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
