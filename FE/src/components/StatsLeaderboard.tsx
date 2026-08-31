import React, { useState, useRef, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
import { useLeaderboard } from "../hooks/allFetch";
import { useRegion } from "../context/regionContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import Table, { type TableColumn } from "./ui/Table";
import {
  statsPage,
  statsRecordsNav,
  statsRecordsButton,
  statsControlsWrapper,
  statsControlsContainer,
  statsFiltersRow,
  statsFilterWrap,
  statsStageSelect,
  statsSelect,
  statsFilterMenu,
  filterMenuButton,
  advancedFilterWrap,
  advancedFilterButton,
  advancedFilterButtonActive,
  statsSearchControls,
  statsPaginationWrapper,
  filterMenuDropdown,
  filterMenuHeader,
  filterMenuItems,
  filterMenuItem,
  advancedFilterPanel,
  advancedFilter,
  advancedFilterHeader,
  addFilterButton,
  noFiltersMessage,
  filterCondition,
  filterStatSelect,
  filterOperatorSelect,
  filterValueInput,
  filterPercentageSymbol,
  removeFilterButton,
  statsTableWrapper,
  statsTableWrapperLoading,
  statsTable,
  statsSkeletonTable,
  statsTableSortable,
  sortArrow,
  statsPillLink,
  statsSkeletonRow,
  statsSkeletonBar,
  statsPlayerRow,
  playerVisualizationRow,
} from "./statsLeaderboardClasses";
import SearchBar from "./Searchbar";
import Pagination from "./Pagination";
import SeasonFilter from "./SeasonFilterBar";
import { Link } from "react-router-dom";
import PlayerStatsVisualization from "./PlayerStatsVisualization";

type StatCategory =
  | "spikeKills"
  | "spikeAttempts"
  | "apeKills"
  | "apeAttempts"
  | "spikingErrors"
  | "digs"
  | "blocks"
  | "assists"
  | "aces"
  | "settingErrors"
  | "blockFollows"
  | "servingErrors"
  | "miscErrors"
  | "totalAttempts"
  | "totalKills"
  | "totalSpike%"
  | "Spike%"
  | "Ape%"
  | "totalReceives"
  | "PRF"
  | "totalErrors"
  | "plusMinus";

type StatType = "total" | "perGame" | "perSet";
type ViewType = "player" | "team";
type ComparisonOperator = "==" | "!=" | ">" | ">=" | "<" | "<=";
type StageRound = "R1" | "R2" | "R3" | "R4" | "R5" | "R6" | "all";

interface FilterCondition {
  id: string;
  stat: StatCategory;
  operator: ComparisonOperator;
  value: number;
}

/** One row from GET /api/stats/leaderboard */
interface LeaderboardRow {
  id: number;
  name: string;
  logoUrl?: string | null;
  seasonNumber?: number | null;
  gamesPlayed?: number;
  totalSets?: number;
  [stat: string]: string | number | null | undefined;
}

const STAT_CATEGORIES: StatCategory[] = [
  "spikeKills",
  "spikeAttempts",
  "Spike%",
  "apeKills",
  "apeAttempts",
  "Ape%",
  "totalKills",
  "totalAttempts",
  "totalSpike%",
  "spikingErrors",
  "blocks",
  "assists",
  "settingErrors",
  "digs",
  "blockFollows",
  "totalReceives",
  "aces",
  "servingErrors",
  "PRF",
  "plusMinus",
  "totalErrors",
  "miscErrors",
];

function formatStatName(stat: string): string {
  return stat
    .replace(/([A-Z])/g, " $1")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function formatStatValue(stat: StatCategory, value: number): string {
  if (stat === "totalSpike%" || stat === "Spike%" || stat === "Ape%") {
    return `${(value * 100).toFixed(2)}%`;
  }
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(2);
}

function getSkeletonBarClass(columnKey: string, variantSeed: number): string {
  if (columnKey === "rank") return `${statsSkeletonBar} short`;
  if (columnKey === "name") return `${statsSkeletonBar} long`;
  return variantSeed % 2 === 0 ? `${statsSkeletonBar} medium` : `${statsSkeletonBar} short`;
}

const AdvancedFilter: React.FC<{
  conditions: FilterCondition[];
  onConditionsChange: (conditions: FilterCondition[]) => void;
  statCategories: StatCategory[];
}> = ({ conditions, onConditionsChange, statCategories }) => {
  const addCondition = () => {
    onConditionsChange([
      ...conditions,
      { id: Date.now().toString(), stat: "totalKills", operator: ">", value: 0 },
    ]);
  };

  const removeCondition = (id: string) => {
    onConditionsChange(conditions.filter((c) => c.id !== id));
  };

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    onConditionsChange(conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  return (
    <div className={advancedFilter}>
      <div className={advancedFilterHeader}>
        <h3>Advanced Filters</h3>
        <button className={addFilterButton} onClick={addCondition} type="button">
          + Add Filter
        </button>
      </div>

      {conditions.length === 0 && (
        <div className={noFiltersMessage}>
          No filters applied. Click &quot;Add Filter&quot; to create conditions.
        </div>
      )}

      {conditions.map((condition) => (
        <div key={condition.id} className={filterCondition}>
          <div className="filter-condition-row">
            <select
              value={condition.stat}
              onChange={(e) =>
                updateCondition(condition.id, { stat: e.target.value as StatCategory })
              }
              className={filterStatSelect}
            >
              {statCategories.map((stat) => (
                <option key={stat} value={stat}>
                  {formatStatName(stat)}
                </option>
              ))}
            </select>

            <select
              value={condition.operator}
              onChange={(e) =>
                updateCondition(condition.id, {
                  operator: e.target.value as ComparisonOperator,
                })
              }
              className={filterOperatorSelect}
            >
              <option value="==">=</option>
              <option value="!=">â‰ </option>
              <option value=">">&gt;</option>
              <option value=">=">â‰¥</option>
              <option value="<">&lt;</option>
              <option value="<=">â‰¤</option>
            </select>

            <div className="filter-value-container">
              <input
                type="number"
                value={
                  condition.stat.includes("%")
                    ? Math.round(condition.value * 100 * 100) / 100
                    : condition.value
                }
                onChange={(e) => {
                  const inputValue = parseFloat(e.target.value) || 0;
                  const actualValue = condition.stat.includes("%")
                    ? inputValue / 100
                    : inputValue;
                  updateCondition(condition.id, { value: actualValue });
                }}
                className={filterValueInput}
                step="1"
                min="0"
                max={condition.stat.includes("%") ? "100" : undefined}
              />
              {condition.stat.includes("%") && (
                <span className={filterPercentageSymbol}>%</span>
              )}
            </div>

            <button
              onClick={() => removeCondition(condition.id)}
              className={removeFilterButton}
              type="button"
            >
              Ã—
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const StatsLeaderboard: React.FC = () => {
  const { regionQuery } = useRegion();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [sortColumn, setSortColumn] = useState<StatCategory | "name">("totalKills");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [statType, setStatType] = useState<StatType>("total");
  const [viewType, setViewType] = useState<ViewType>("player");
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([]);
  const [selectedStageRound, setSelectedStageRound] = useState<StageRound>("all");
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
    totalAttempts: true,
    totalKills: true,
    "totalSpike%": true,
    "Spike%": false,
    "Ape%": false,
    totalReceives: true,
    PRF: false,
    totalErrors: true,
    plusMinus: false,
  });
  const playersPerPage = 25;
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const debouncedSearch = useDebouncedValue(searchQuery);

  const filtersParam =
    filterConditions.length > 0
      ? JSON.stringify(
          filterConditions.map(({ stat, operator, value }) => ({
            stat,
            operator,
            value,
          }))
        )
      : undefined;

  const { data: rows, totalPages, loading, error } = useLeaderboard({
    page: currentPage,
    limit: playersPerPage,
    view: viewType,
    statType,
    season: selectedSeason ?? undefined,
    stageRound: selectedStageRound,
    search: debouncedSearch || undefined,
    sortBy: sortColumn,
    sortDir: sortDirection,
    filters: filtersParam,
    ...regionQuery,
  });

  const leaderboardRows = (rows ?? []) as LeaderboardRow[];

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

  const handleFilterConditionsChange = (conditions: FilterCondition[]) => {
    setFilterConditions(conditions);
    setCurrentPage(1);
  };

  const handleStageRoundChange = (stageRound: StageRound) => {
    setSelectedStageRound(stageRound);
    setCurrentPage(1);
  };

  const handleSort = (stat: StatCategory | "name") => {
    if (sortColumn === stat) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(stat);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  const toggleStatVisibility = (stat: StatCategory) => {
    setVisibleStats((prev) => ({ ...prev, [stat]: !prev[stat] }));
  };

  const toggleAllStats = () => {
    const allVisible = Object.values(visibleStats).every((v) => v);
    setVisibleStats(
      Object.keys(visibleStats).reduce(
        (acc, key) => ({ ...acc, [key]: !allVisible }),
        {} as Record<StatCategory, boolean>
      )
    );
  };

  const handleRowClick = (rowId: string) => {
    setExpandedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const visibleStatCategories = STAT_CATEGORIES.filter((stat) => visibleStats[stat]);

  const leaderboardColumns: TableColumn<LeaderboardRow>[] = useMemo(() => {
    const cols: TableColumn<LeaderboardRow>[] = [
      {
        key: "rank",
        header: "#",
        render: (_item, index) => (currentPage - 1) * playersPerPage + (index ?? 0) + 1,
      },
      {
        key: "name",
        header: (
          <>
            {viewType === "team" ? "Team" : "Player"}
            {sortColumn === "name" && (
              <span className={`${sortArrow} ${sortDirection}`}>
                {sortDirection === "desc" ? "â†“" : "â†‘"}
              </span>
            )}
          </>
        ),
        headerClassName: statsTableSortable,
        onHeaderClick: () => handleSort("name"),
        render: (item) =>
          viewType === "team" ? (
            <span className="team-name-cell">
              {item.logoUrl ? (
                <img src={String(item.logoUrl)} alt="" className="team-logo-thumb" />
              ) : null}
              {item.name}
              {item.seasonNumber != null ? ` (S${item.seasonNumber})` : ""}
            </span>
          ) : (
            <Link
              to={`/players/${item.id}`}
              className={statsPillLink}
              onClick={(e) => e.stopPropagation()}
            >
              {item.name}
            </Link>
          ),
      },
    ];

    visibleStatCategories.forEach((stat) => {
      cols.push({
        key: stat,
        header: (
          <>
            {formatStatName(stat)}{" "}
            {statType === "perGame"
              ? "(Per Game)"
              : statType === "perSet"
                ? "(Per Set)"
                : ""}
            {sortColumn === stat && (
              <span className={`${sortArrow} ${sortDirection}`}>
                {sortDirection === "desc" ? "â†“" : "â†‘"}
              </span>
            )}
          </>
        ),
        headerClassName: statsTableSortable,
        onHeaderClick: () => handleSort(stat),
        render: (item) => {
          const raw = Number(item[stat] ?? 0);
          return formatStatValue(stat, Number.isFinite(raw) ? raw : 0);
        },
      });
    });

    return cols;
  }, [
    currentPage,
    playersPerPage,
    viewType,
    sortColumn,
    sortDirection,
    visibleStatCategories,
    statType,
  ]);

  return (
    <div className={`${statsPage} ${loading ? "opacity-80 pointer-events-none" : ""}`}>
      <div className={statsRecordsNav}>
        <button
          className={statsRecordsButton}
          onClick={() => {
            window.location.href = "/records";
          }}
        >
          View Stat Records
        </button>
      </div>

      <div className={statsControlsWrapper}>
        <div className={statsControlsContainer}>
          <div className={statsFiltersRow}>
            <div className={statsFilterWrap}>
              <SeasonFilter
                selectedSeason={selectedSeason}
                onSeasonChange={handleSeasonChange}
              />
            </div>
            <div className={statsFilterWrap}>
              <select
                id="stage-round"
                aria-label="Round"
                className={statsStageSelect}
                value={selectedStageRound}
                onChange={(e) =>
                  handleStageRoundChange(e.target.value as StageRound)
                }
              >
                <option value="all">All Rounds</option>
                <option value="R1">R1 - Winners Round of 16</option>
                <option value="R2">R2 - Winners QF + Losers R1</option>
                <option value="R3">R3 - Winners SF + Losers R2</option>
                <option value="R4">R4 - Winners Finals + Losers R3/QF</option>
                <option value="R5">R5 - Losers SF + Losers Finals</option>
                <option value="R6">R6 - Grand Finals</option>
              </select>
            </div>
            <div className={statsFilterWrap}>
              <select
                id="stat-type"
                aria-label="Stat type"
                className={statsSelect}
                value={statType}
                onChange={(e) => {
                  setStatType(e.target.value as StatType);
                  setCurrentPage(1);
                }}
              >
                <option value="total">Totals</option>
                <option value="perGame">Per Game</option>
                <option value="perSet">Per Set</option>
              </select>
            </div>
            <div className={statsFilterWrap}>
              <select
                id="view-type"
                aria-label="View"
                className={statsSelect}
                value={viewType}
                onChange={(e) => {
                  setViewType(e.target.value as ViewType);
                  setCurrentPage(1);
                  setExpandedRows({});
                }}
              >
                <option value="player">Players</option>
                <option value="team">Teams</option>
              </select>
            </div>
            <div className={statsFilterMenu}>
              <button
                className={filterMenuButton}
                ref={filterButtonRef}
                onClick={() => setShowFilterMenu(!showFilterMenu)}
              >
                Filter Stats
              </button>
            </div>
            <div className={advancedFilterWrap}>
              <button
                className={showAdvancedFilter ? advancedFilterButtonActive : advancedFilterButton}
                onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
              >
                Advanced Filters{" "}
                {filterConditions.length > 0 && `(${filterConditions.length})`}
              </button>
            </div>
            <div className={statsSearchControls}>
              <SearchBar
                onSearch={handleSearch}
                placeholder={
                  viewType === "team" ? "Search Teams..." : "Search Players..."
                }
              />
              <div className={statsPaginationWrapper}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFilterMenu &&
        ReactDOM.createPortal(
          <div className={filterMenuDropdown} style={dropdownStyle}>
            <div className={filterMenuHeader}>
              <label>
                <input
                  type="checkbox"
                  checked={Object.values(visibleStats).every((v) => v)}
                  onChange={toggleAllStats}
                />
                All Stats
              </label>
            </div>
            <div className={filterMenuItems}>
              {STAT_CATEGORIES.map((stat) => (
                <label key={stat} className={filterMenuItem}>
                  <input
                    type="checkbox"
                    checked={visibleStats[stat]}
                    onChange={() => toggleStatVisibility(stat)}
                  />
                  {stat.replace(/([A-Z])/g, " $1").trim()}
                </label>
              ))}
            </div>
          </div>,
          document.body
        )}

      {showAdvancedFilter && (
        <div className={advancedFilterPanel}>
          <AdvancedFilter
            conditions={filterConditions}
            onConditionsChange={handleFilterConditionsChange}
            statCategories={STAT_CATEGORIES}
          />
        </div>
      )}

      {error ? (
        <div>Error: {error}</div>
      ) : loading ? (
        <div className={statsTableWrapperLoading}>
          <table className={statsSkeletonTable}>
            <thead>
              <tr>
                {leaderboardColumns.map((col) => (
                  <th key={col.key} className={col.headerClassName}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: playersPerPage }).map((_, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={statsSkeletonRow}
                  style={
                    { "--row-delay": `${(rowIndex % 5) * 0.06}s` } as React.CSSProperties
                  }
                >
                  {leaderboardColumns.map((col, colIndex) => (
                    <td key={col.key}>
                      <span
                        className={getSkeletonBarClass(col.key, rowIndex + colIndex)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Table
          columns={leaderboardColumns}
          rows={leaderboardRows}
          rowKey={(item) =>
            viewType === "team"
              ? `${item.id}-${item.seasonNumber ?? "all"}`
              : item.id
          }
          tableClassName={statsTable}
          wrapperClassName={statsTableWrapper}
          rowClassName={() => (viewType === "player" ? statsPlayerRow : undefined)}
          onRowClick={(item) => {
            if (viewType === "player") handleRowClick(String(item.id));
          }}
          renderAfterRow={(item) => {
            if (viewType !== "player") return null;
            const rowId = String(item.id);
            if (!expandedRows[rowId]) return null;
            return (
              <tr className={playerVisualizationRow} key={`viz-${rowId}`}>
                <td colSpan={leaderboardColumns.length}>
                  <PlayerStatsVisualization
                    playerId={item.id}
                    selectedSeason={selectedSeason}
                  />
                </td>
              </tr>
            );
          }}
        />
      )}
    </div>
  );
};

export default StatsLeaderboard;
