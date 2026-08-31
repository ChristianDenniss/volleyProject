import React, { useState, useEffect } from "react";
import { useSkinnyAwards, useSkinnySeasons } from "../hooks/allFetch";
import { Link, useLocation } from "react-router-dom";
import "../styles/Awards.css";
import "../styles/ListingPage.css";
import SearchBar from "./Searchbar";
import Pagination from "./Pagination";
import FilterBar from "./ui/FilterBar";
import { useRegion } from "../context/regionContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { AWARD_TYPES } from "../constants/awardTypes";

const Awards: React.FC = () => {
  const { regionQuery } = useRegion();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [seasonFilter, setSeasonFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const awardsPerPage = 12;

  const debouncedSearch = useDebouncedValue(searchQuery);

  // Handle pre-selected season from URL state (season number)
  useEffect(() => {
    if (location.state?.selectedSeason != null) {
      setSeasonFilter(String(location.state.selectedSeason));
      setCurrentPage(1);
    }
  }, [location.state]);

  const { data: awards, totalPages, loading, error } = useSkinnyAwards({
    page: currentPage,
    limit: awardsPerPage,
    search: debouncedSearch || undefined,
    seasonNumber: seasonFilter || undefined,
    type: typeFilter || undefined,
    ...regionQuery,
  });

  const { data: seasons } = useSkinnySeasons({ page: 1, limit: 100, ...regionQuery });
  const seasonOptions = [...(seasons ?? [])]
    .map((s) => s.seasonNumber)
    .sort((a, b) => a - b);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSeasonFilter("");
    setTypeFilter("");
    setCurrentPage(1);
  };

  return (
    <div className={`volley-awards-container ${loading ? "loading" : ""}`}>
      <div className="listing-controls-toolbar">
        <FilterBar onReset={(searchQuery || seasonFilter || typeFilter) ? clearFilters : undefined}>
          <div className="awards-season-filter">
            <select
              id="award-season-filter"
              aria-label="Season"
              value={seasonFilter}
              onChange={(e) => {
                setSeasonFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Seasons</option>
              {seasonOptions.map((seasonNumber) => (
                <option key={seasonNumber} value={seasonNumber.toString()}>
                  Season {seasonNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="awards-type-filter">
            <select
              id="award-type-filter"
              aria-label="Award Type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Types</option>
              {AWARD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </FilterBar>

        <div className="listing-search-row">
          <SearchBar onSearch={handleSearch} placeholder="Search awards by player..." />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {loading ? (
        <div className="volley-awards-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="awards-skeleton"></div>
          ))}
        </div>
      ) : error ? (
        <p>Error: {error}</p>
      ) : (awards ?? []).length === 0 ? (
        <p>No awards found.</p>
      ) : (
        <div className="volley-awards-grid">
          {(awards ?? []).map((award) => (
            <Link to={`/awards/${award.id}`} key={award.id} className="volley-award-item-link">
              <div className="volley-award-item" style={{ backgroundImage: `url(${award.imageUrl})` }}>
                <div className="volley-award-category">{award.type}</div>
                <Link to={`/seasons/${award.season?.id}`} className="volley-award-season">
                  Season {award.season?.seasonNumber}
                </Link>
                <Link to={`/players/${award.players?.[0]?.id}`} className="volley-award-winner">
                  {award.players?.[0]?.name || "N/A"}
                </Link>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Awards;
