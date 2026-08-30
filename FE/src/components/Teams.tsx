import { useMemo, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMediumTeams, useSkinnySeasons } from "@/hooks/allFetch";
import { useRegion } from "@/context/regionContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { TEAM_PLACEMENTS } from "@/constants/teamPlacements";
import { TEAMS_NAV_ITEMS } from "@/constants/teamsNav";

import PageContainer from "@/components/ui/layout/PageContainer";
import Toolbar from "@/components/ui/layout/Toolbar";
import CardGrid from "@/components/ui/layout/CardGrid";
import DetailStats from "@/components/ui/layout/DetailStats";
import SubNav from "@/components/ui/navigation/SubNav";
import FilterBar from "@/components/ui/filters/FilterBar";
import FilterSelect from "@/components/ui/filters/FilterSelect";
import SearchBar from "@/components/ui/filters/SearchBar";
import Pagination from "@/components/ui/navigation/Pagination";
import { toOptions } from "@/components/ui/inputs/Select";

const TEAMS_PER_PAGE = 12;

/** "Team Name" → "team-name" — the URL segment SingleTeam resolves by. */
function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export default function Teams() {
  const { regionQuery } = useRegion();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [seasonFilter, setSeasonFilter] = useState("");
  const [placementFilter, setPlacementFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearch = useDebouncedValue(searchQuery);

  const { data: paginatedTeams, totalPages, loading, error } = useMediumTeams({
    page: currentPage,
    limit: TEAMS_PER_PAGE,
    search: debouncedSearch || undefined,
    seasonId: seasonFilter || undefined,
    placement: placementFilter || undefined,
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

  const teams = paginatedTeams ?? [];
  const activeFilterCount = [searchQuery, seasonFilter, placementFilter].filter(Boolean).length;

  const openTeam = (teamName: string) => navigate(slugify(teamName));

  const handleCardKeyDown = (event: KeyboardEvent, teamName: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openTeam(teamName);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSeasonFilter("");
    setPlacementFilter("");
    setCurrentPage(1);
  };

  return (
    <PageContainer>
      <SubNav items={TEAMS_NAV_ITEMS} activeLabel="League teams" />

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
              label="Placement"
              value={placementFilter}
              onChange={(value) => {
                setPlacementFilter(value);
                setCurrentPage(1);
              }}
              options={toOptions(TEAM_PLACEMENTS)}
              placeholder="All Placements"
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
              placeholder="Search teams…"
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

      <CardGrid
        loading={loading}
        error={error}
        loadingCount={TEAMS_PER_PAGE}
        isEmpty={teams.length === 0}
        emptyLabel="No teams match your filters."
      >
        {teams.map((team) => (
          <div
            key={team.id}
            role="link"
            tabIndex={0}
            aria-label={`View team ${team.name}`}
            onClick={() => openTeam(team.name)}
            onKeyDown={(event) => handleCardKeyDown(event, team.name)}
            className="group relative flex cursor-pointer flex-col gap-3 overflow-hidden rounded-card border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-[var(--shadow-md)] focus-visible:border-accent"
          >
            {/* Logo watermark — decorative, so it stays behind the text and is aria-hidden. */}
            {team.logoUrl && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-contain bg-center bg-no-repeat opacity-10 transition-opacity group-hover:opacity-20"
                style={{ backgroundImage: `url(${team.logoUrl})` }}
              />
            )}

            <div className="relative z-10 flex flex-col gap-3">
              <h3 className="m-0 truncate text-base font-semibold text-content">{team.name}</h3>

              <DetailStats
                columns={2}
                items={[
                  { label: "ID", value: team.id },
                  { label: "Season", value: team.season.seasonNumber },
                  { label: "Placement", value: team.placement ?? "—" },
                  { label: "Players", value: team.players?.length ?? 0 },
                ]}
              />
            </div>
          </div>
        ))}
      </CardGrid>
    </PageContainer>
  );
}
