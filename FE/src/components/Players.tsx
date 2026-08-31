import React, { useState, useMemo } from "react";
import { useMediumPlayers, useSkinnySeasons } from "../hooks/allFetch";
import { useNavigate } from "react-router-dom";
import type { Player, Stats, Team } from "../types/interfaces";
import Table, { type TableColumn } from "./ui/Table";
import SearchBar from "./Searchbar";
import Pagination from "./Pagination";
import FilterBar from "./ui/FilterBar";
import FilterSelect from "./ui/FilterSelect";
import { useRegion } from "../context/regionContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import OverflowListCell from "./ui/OverflowListCell";
import { PLAYER_POSITIONS } from "../constants/playerPositions";
import {
  listingControlsToolbar,
  listingSearchRow,
  listingContentWrapper,
  listingTable,
  listingTableWrapper,
  listingTableDetail,
  listingTableDetailStats,
  listingTableDetailStat,
  listingTableDetailStatWide,
  listingTableDetailProfileBtn,
  listingTableOverflowList,
  listingTableExpandToggle,
  listingTableExpandToggleOpen,
  listingTableEmpty,
  listingSkeletonTable,
} from "./listingClasses";

/* Players.css restyled listing hover/expanded surfaces, the position pill, the
   skeleton middle stop, pagination buttons in the search row, and the overflow
   trigger. Those winners live here rather than in listingClasses.

   Overflow-trigger utilities are marked important: ui.css is unlayered and
   would otherwise win background and border at equal-or-lower specificity. */
const playersPage =
  "w-[min(100%,1600px)] max-w-[1600px] mx-auto box-border min-h-screen " +
  "py-[20px] px-[clamp(1rem,2.5vw,2.5rem)] [contain:layout_style_paint] " +
  "[&_.listing-search-row_button]:h-[30px] [&_.listing-search-row_button]:py-0 " +
  "[&_.listing-search-row_button]:px-[8px] [&_.listing-search-row_button]:border " +
  "[&_.listing-search-row_button]:border-brand-primary [&_.listing-search-row_button]:rounded-[6px] " +
  "[&_.listing-search-row_button]:bg-brand-primary [&_.listing-search-row_button]:text-white " +
  "[&_.listing-search-row_button]:text-[14px] [&_.listing-search-row_button]:font-[inherit] " +
  "[&_.listing-search-row_button]:cursor-pointer " +
  "[&_.listing-search-row_button]:transition-[background,border] [&_.listing-search-row_button]:duration-[0.18s] " +
  "[&_.listing-search-row_button:hover:not(:disabled)]:bg-brand-primary-hover " +
  "[&_.listing-search-row_button:hover:not(:disabled)]:border-brand-primary-hover " +
  "[&_.listing-search-row_button:hover:not(:disabled)]:text-white " +
  "[&_.listing-search-row_button:disabled]:bg-[#e5e7eb] [&_.listing-search-row_button:disabled]:border-[#e5e7eb] " +
  "[&_.listing-search-row_button:disabled]:text-[#9ca3af] [&_.listing-search-row_button:disabled]:cursor-not-allowed " +
  "[&_.ui-overflow-list-trigger]:border-[rgba(var(--color-brand-primary-rgb),0.25)]! " +
  "[&_.ui-overflow-list-trigger]:bg-bg! " +
  "[&_.ui-overflow-list-trigger:hover]:bg-[rgba(var(--color-brand-primary-rgb),0.08)]! " +
  "[&_.ui-overflow-list-trigger:hover]:border-brand-primary! " +
  "[&_.ui-overflow-list-trigger:focus-visible]:bg-[rgba(var(--color-brand-primary-rgb),0.08)]! " +
  "[&_.ui-overflow-list-trigger:focus-visible]:border-brand-primary!";

const playersRowClickable = "listing-row-clickable cursor-pointer hover:bg-bg-muted";

const playersRowExpanded =
  "listing-row-clickable listing-row-expanded cursor-pointer bg-bg-light hover:bg-bg-light border-b-0";

const playersTableDetailRow =
  "listing-table-detail-row cursor-default " +
  "[&_td]:bg-bg-light [&_td]:pt-0 [&_td]:px-[1.25rem] [&_td]:pb-[1.25rem] " +
  "hover:[&_td]:bg-bg-light";

const playersPositionPill =
  "inline-block text-[0.6875rem] font-bold uppercase tracking-[0.03em] " +
  "text-brand-primary bg-[rgba(var(--color-brand-primary-rgb),0.1)] " +
  "py-[0.2rem] px-[0.6rem] rounded-[999px] border border-brand-primary";

const playersSkeletonRow =
  "h-[48px] rounded-sm bg-[length:200%_100%] animate-listing-shimmer " +
  "bg-[linear-gradient(90deg,var(--color-bg-muted)_25%,var(--color-bg-light)_50%,var(--color-bg-muted)_75%)]";

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
            <span className={playersPositionPill}>{player.position}</span>
          ) : (
            "Unknown"
          ),
      },
      {
        key: "teams",
        header: "Teams",
        render: (player) => (
          <OverflowListCell
            className={listingTableOverflowList}
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
            className={listingTableOverflowList}
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
            className={
              expandedRows[player.id] ? listingTableExpandToggleOpen : listingTableExpandToggle
            }
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
    <div className={`${playersPage} ${loading ? "opacity-80 pointer-events-none" : ""}`}>
      <div className={listingControlsToolbar}>
          <FilterBar onReset={clearFilters}>
            <FilterSelect
              id="season-filter"
              label="Season"
              value={seasonFilter}
              onChange={(value) => {
                setSeasonFilter(value);
                setCurrentPage(1);
              }}
              placeholder="All Seasons"
              options={seasonOptions.map((season) => ({
                value: season.id.toString(),
                label: `Season ${season.seasonNumber}`,
              }))}
            />

            <FilterSelect
              id="position-filter"
              label="Position"
              value={positionFilter}
              onChange={(value) => {
                setPositionFilter(value);
                setCurrentPage(1);
              }}
              placeholder="All Positions"
              options={PLAYER_POSITIONS.map((position) => ({
                value: position,
                label: position,
              }))}
            />
          </FilterBar>

          <div className={listingSearchRow}>
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
        <div className={listingContentWrapper}>
          {loading ? (
            <div className={listingTableWrapper}>
              <div className={listingSkeletonTable}>
                {Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className={playersSkeletonRow} />
                ))}
              </div>
            </div>
          ) : !paginatedPlayers || paginatedPlayers.length === 0 ? (
            <div className={listingTableEmpty}>No players match your filters.</div>
          ) : (
            <Table
              columns={playerColumns}
              rows={paginatedPlayers}
              rowKey={(player) => player.id}
              tableClassName={listingTable}
              wrapperClassName={listingTableWrapper}
              rowClassName={(player) =>
                expandedRows[player.id] ? playersRowExpanded : playersRowClickable
              }
              onRowClick={(player) => toggleRow(player.id)}
              renderAfterRow={(player) => {
                if (!expandedRows[player.id]) return null;

                const totals = getPlayerCareerTotals(player);
                const seasonsPlayed = formatPlayerSeasons(player);

                return (
                  <tr className={playersTableDetailRow}>
                    <td colSpan={playerColumns.length}>
                      <div className={listingTableDetail}>
                        <dl className={listingTableDetailStats}>
                          <div className={listingTableDetailStat}>
                            <dt>Awards</dt>
                            <dd>{formatAwardsSummary(player)}</dd>
                          </div>
                          <div className={listingTableDetailStat}>
                            <dt>Kills</dt>
                            <dd>{totals.kills}</dd>
                          </div>
                          <div className={listingTableDetailStat}>
                            <dt>Assists</dt>
                            <dd>{totals.assists}</dd>
                          </div>
                          <div className={listingTableDetailStat}>
                            <dt>Blocks</dt>
                            <dd>{totals.blocks}</dd>
                          </div>
                          <div className={listingTableDetailStat}>
                            <dt>Receives</dt>
                            <dd>{totals.receives}</dd>
                          </div>
                          <div className={listingTableDetailStat}>
                            <dt>Aces</dt>
                            <dd>{totals.aces}</dd>
                          </div>
                          <div className={listingTableDetailStatWide}>
                            <dt>Seasons played</dt>
                            <dd>{seasonsPlayed}</dd>
                          </div>
                        </dl>

                        <button
                          type="button"
                          className={`ui-btn ui-btn-primary ${listingTableDetailProfileBtn}`}
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
