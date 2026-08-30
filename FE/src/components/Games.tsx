import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSkinnyGames, useSkinnySeasons, useGameStages } from "@/hooks/allFetch";
import { useRegion } from "@/context/regionContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import PageContainer from "@/components/ui/layout/PageContainer";
import Toolbar from "@/components/ui/layout/Toolbar";
import CardGrid from "@/components/ui/layout/CardGrid";
import GameScoreCard from "@/components/ui/cards/GameScoreCard";
import FilterBar from "@/components/ui/filters/FilterBar";
import FilterSelect from "@/components/ui/filters/FilterSelect";
import SearchBar from "@/components/ui/filters/SearchBar";
import Pagination from "@/components/ui/navigation/Pagination";
import { toOptions } from "@/components/ui/inputs/Select";

const GAMES_PER_PAGE = 20;

export default function Games() {
  const { regionQuery } = useRegion();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [seasonFilter, setSeasonFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearch = useDebouncedValue(searchQuery);

  const { data: paginatedGames, totalPages, loading, error } = useSkinnyGames({
    status: "completed",
    page: currentPage,
    limit: GAMES_PER_PAGE,
    search: debouncedSearch || undefined,
    seasonId: seasonFilter || undefined,
    stage: stageFilter || undefined,
    ...regionQuery,
  });

  const { data: seasons } = useSkinnySeasons({ page: 1, limit: 100, ...regionQuery });
  const { data: uniqueStages } = useGameStages({
    seasonId: seasonFilter || undefined,
    ...regionQuery,
  });

  const seasonOptions = useMemo(
    () =>
      [...(seasons ?? [])]
        .sort((a, b) => a.seasonNumber - b.seasonNumber)
        .map((season) => ({ value: season.id.toString(), label: `Season ${season.seasonNumber}` })),
    [seasons]
  );

  const games = paginatedGames ?? [];
  const activeFilterCount = [searchQuery, seasonFilter, stageFilter].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery("");
    setSeasonFilter("");
    setStageFilter("");
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
              label="Stage"
              value={stageFilter}
              onChange={(value) => {
                setStageFilter(value);
                setCurrentPage(1);
              }}
              options={toOptions(uniqueStages ?? [])}
              placeholder="All Stages"
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
              placeholder="Search games…"
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
        minColumnWidth="lg"
        loading={loading}
        error={error}
        loadingCount={GAMES_PER_PAGE}
        loadingHeight="h-28"
        isEmpty={games.length === 0}
        emptyLabel="No games match your filters."
      >
        {games.map((game) => (
          <GameScoreCard
            key={game.id}
            game={game}
            onClick={() => navigate(`/games/${game.id}`)}
          />
        ))}
      </CardGrid>
    </PageContainer>
  );
}
