import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMediumPlayers, useSkinnySeasons } from "@/hooks/allFetch";
import type { Player, Stats, Team } from "@/types/interfaces";
import { useRegion } from "@/context/regionContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { PLAYER_POSITIONS } from "@/constants/playerPositions";

import PageContainer from "@/components/ui/layout/PageContainer";
import Toolbar from "@/components/ui/layout/Toolbar";
import DataTable, { type DataTableColumn } from "@/components/ui/layout/DataTable";
import DetailStats from "@/components/ui/layout/DetailStats";
import FilterBar from "@/components/ui/filters/FilterBar";
import FilterSelect from "@/components/ui/filters/FilterSelect";
import SearchBar from "@/components/ui/filters/SearchBar";
import Pagination from "@/components/ui/navigation/Pagination";
import Button from "@/components/ui/buttons/Button";
import Pill from "@/components/ui/pills/Pill";
import OverflowListCell from "@/components/ui/misc/OverflowListCell";
import { toOptions } from "@/components/ui/inputs/Select";

const LISTING_OVERFLOW_VISIBLE = 2;
const PLAYERS_PER_PAGE = 25;

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

export default function Players() {
  const { regionQuery } = useRegion();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [seasonFilter, setSeasonFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const debouncedSearch = useDebouncedValue(searchQuery);

  const { data: paginatedPlayers, totalPages, loading, error } = useMediumPlayers({
    page: currentPage,
    limit: PLAYERS_PER_PAGE,
    search: debouncedSearch || undefined,
    seasonId: seasonFilter || undefined,
    position: positionFilter || undefined,
    ...regionQuery,
  });

  const { data: seasons } = useSkinnySeasons({ page: 1, limit: 100, ...regionQuery });

  const seasonOptions = useMemo(
    () =>
      [...(seasons ?? [])]
        .sort((a, b) => a.seasonNumber - b.seasonNumber)
        .map((season) => ({ value: season.id.toString(), label: `Season ${season.seasonNumber}` })),
    [seasons]
  );

  const toggleRow = (id: number) =>
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  const columns: DataTableColumn<Player>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Player",
        render: (player) => <span className="font-medium text-content">{player.name}</span>,
      },
      {
        key: "position",
        header: "Position",
        render: (player) =>
          player.position && player.position !== "N/A" ? (
            <Pill tone="accent" size="sm">{player.position}</Pill>
          ) : (
            <span className="text-content-muted">Unknown</span>
          ),
      },
      {
        key: "teams",
        header: "Teams",
        hideOnMobile: true,
        render: (player) => (
          <OverflowListCell
            items={getPlayerTeamLabels(player)}
            maxVisible={LISTING_OVERFLOW_VISIBLE}
            popoverTitle="Teams"
          />
        ),
      },
      {
        key: "seasons",
        header: "Seasons",
        hideOnMobile: true,
        render: (player) => (
          <OverflowListCell
            items={getPlayerSeasonLabels(player)}
            maxVisible={LISTING_OVERFLOW_VISIBLE}
            popoverTitle="Seasons"
          />
        ),
      },
      {
        key: "expand",
        header: "",
        align: "right",
        width: "w-10",
        render: (player) => (
          <span
            aria-hidden
            className={`inline-block text-xs text-content-muted transition-transform ${expandedRows[player.id] ? "rotate-90" : ""}`}
          >
            ▶
          </span>
        ),
      },
    ],
    [expandedRows]
  );

  const activeFilterCount = [searchQuery, seasonFilter, positionFilter].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery("");
    setSeasonFilter("");
    setPositionFilter("");
    setCurrentPage(1);
  };

  return (
    <PageContainer>
      <Toolbar
        filters={
          <FilterBar onReset={clearFilters} activeCount={activeFilterCount}>
            <FilterSelect
              label="Season"
              value={seasonFilter}
              onChange={(value) => {
                setSeasonFilter(value);
                setCurrentPage(1);
              }}
              options={seasonOptions}
              placeholder="All Seasons"
            />
            <FilterSelect
              label="Position"
              value={positionFilter}
              onChange={(value) => {
                setPositionFilter(value);
                setCurrentPage(1);
              }}
              options={toOptions(PLAYER_POSITIONS)}
              placeholder="All Positions"
            />
          </FilterBar>
        }
        trailing={
          <>
            <SearchBar
              value={searchQuery}
              onSearch={(query) => {
                setSearchQuery(query);
                setCurrentPage(1);
              }}
              placeholder="Search players…"
              className="w-full sm:w-64"
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={paginatedPlayers}
        rowKey={(player) => player.id}
        loading={loading}
        error={error}
        emptyLabel="No players match your filters."
        onRowClick={(player) => toggleRow(player.id)}
        expandedRow={(player) => {
          if (!expandedRows[player.id]) return null;

          const totals = getPlayerCareerTotals(player);

          return (
            <div className="flex flex-col gap-4">
              <DetailStats
                columns={6}
                items={[
                  { label: "Awards", value: formatAwardsSummary(player) },
                  { label: "Kills", value: totals.kills },
                  { label: "Assists", value: totals.assists },
                  { label: "Blocks", value: totals.blocks },
                  { label: "Receives", value: totals.receives },
                  { label: "Aces", value: totals.aces },
                  { label: "Seasons played", value: formatPlayerSeasons(player), wide: true },
                ]}
              />
              <Button
                size="sm"
                className="self-start"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/players/${player.id}`);
                }}
              >
                View profile
              </Button>
            </div>
          );
        }}
      />
    </PageContainer>
  );
}
