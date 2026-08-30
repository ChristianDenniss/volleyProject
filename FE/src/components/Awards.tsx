import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSkinnyAwards, useSkinnySeasons } from "@/hooks/allFetch";
import { useRegion } from "@/context/regionContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { AWARD_TYPES } from "@/constants/awardTypes";

import PageContainer from "@/components/ui/layout/PageContainer";
import Toolbar from "@/components/ui/layout/Toolbar";
import CardGrid from "@/components/ui/layout/CardGrid";
import FilterBar from "@/components/ui/filters/FilterBar";
import FilterSelect from "@/components/ui/filters/FilterSelect";
import SearchBar from "@/components/ui/filters/SearchBar";
import Pagination from "@/components/ui/navigation/Pagination";
import Pill from "@/components/ui/pills/Pill";
import { toOptions } from "@/components/ui/inputs/Select";

const AWARDS_PER_PAGE = 12;

export default function Awards() {
  const { regionQuery } = useRegion();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [seasonFilter, setSeasonFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearch = useDebouncedValue(searchQuery);

  // A season can be pre-selected by the caller (e.g. the season detail page linking here).
  useEffect(() => {
    if (location.state?.selectedSeason != null) {
      setSeasonFilter(String(location.state.selectedSeason));
      setCurrentPage(1);
    }
  }, [location.state]);

  const { data: awards, totalPages, loading, error } = useSkinnyAwards({
    page: currentPage,
    limit: AWARDS_PER_PAGE,
    search: debouncedSearch || undefined,
    seasonNumber: seasonFilter || undefined,
    type: typeFilter || undefined,
    ...regionQuery,
  });

  const { data: seasons } = useSkinnySeasons({ page: 1, limit: 100, ...regionQuery });

  const seasonOptions = useMemo(
    () =>
      [...(seasons ?? [])]
        .map((season) => season.seasonNumber)
        .sort((a, b) => a - b)
        .map((seasonNumber) => ({
          value: seasonNumber.toString(),
          label: `Season ${seasonNumber}`,
        })),
    [seasons]
  );

  const awardList = awards ?? [];
  const activeFilterCount = [searchQuery, seasonFilter, typeFilter].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery("");
    setSeasonFilter("");
    setTypeFilter("");
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
              label="Award Type"
              value={typeFilter}
              onChange={(value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              }}
              options={toOptions(AWARD_TYPES)}
              placeholder="All Types"
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
              placeholder="Search awards by player…"
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
        loadingCount={8}
        loadingHeight="h-56"
        isEmpty={awardList.length === 0}
        emptyLabel="No awards found."
      >
        {awardList.map((award) => (
          <Link
            key={award.id}
            to={`/awards/${award.id}`}
            className="group relative flex h-56 flex-col justify-end overflow-hidden rounded-card border border-border bg-surface-inverse no-underline transition-all hover:-translate-y-0.5 hover:border-status-gold hover:shadow-[var(--shadow-md)]"
          >
            {/* Award artwork sits behind a scrim so the label text stays legible on any image. */}
            {award.imageUrl && (
              <div
                aria-hidden
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundImage: `url(${award.imageUrl})` }}
              />
            )}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-surface-inverse via-surface-inverse/60 to-transparent"
            />

            <div className="relative z-10 flex flex-col gap-1.5 p-4">
              <Pill tone="gold" size="sm" className="self-start">{award.type}</Pill>
              <span className="text-lg font-semibold text-content-inverse">
                {award.players?.[0]?.name || "N/A"}
              </span>
              <span className="text-xs text-content-inverse/80">
                Season {award.season?.seasonNumber}
              </span>
            </div>
          </Link>
        ))}
      </CardGrid>
    </PageContainer>
  );
}
