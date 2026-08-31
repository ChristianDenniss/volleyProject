import React, { useState, useEffect } from "react";
import { useSkinnyAwards, useSkinnySeasons } from "../hooks/allFetch";
import { Link, useLocation } from "react-router-dom";
import SearchBar from "./Searchbar";
import Pagination from "./Pagination";
import FilterBar from "./ui/FilterBar";
import { useRegion } from "../context/regionContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { AWARD_TYPES } from "../constants/awardTypes";
import { listingControlsToolbar, listingSearchRow } from "./listingClasses";

const awardsContainer =
  "w-full py-[2rem] px-[4vw] box-border flex flex-col gap-[2rem] " +
  "[font-family:'Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] min-h-screen " +
  "[contain:layout_style_paint]";

const awardsGrid =
  "grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] " +
  "[column-gap:clamp(1rem,2vw,1.4rem)] [row-gap:clamp(1.5rem,3vw,2.2rem)] " +
  "w-full min-h-[600px] [content-visibility:auto] [contain-intrinsic-size:600px] " +
  "upto-xs:grid-cols-[1fr] upto-xs:min-h-[500px] " +
  "empty:before:content-[''] empty:before:block empty:before:h-[600px] empty:before:w-full";

const awardLink = "no-underline text-inherit";

/* The overlay is a ::before so it stays a pseudo-element. Hover has to set
   transform as one arbitrary value: the original animates `transform`, and
   Tailwind's translate and scale utilities write those as separate properties,
   which would jump instead of tween. */
const awardItem =
  "relative bg-cover bg-right border border-[#262626] rounded-[16px] p-[1.2rem] " +
  "flex flex-col gap-[0.6rem] shadow-[0_2px_4px_rgba(0,0,0,0.15)] " +
  "transition-[transform,box-shadow,border-color] duration-[0.25s] ease-[ease] " +
  "cursor-pointer overflow-hidden min-h-[200px] box-border [contain:layout_style] " +
  "[transform:translateZ(0)] [backface-visibility:hidden] " +
  "hover:[transform:translateY(-4px)_scale(1.02)] " +
  "hover:shadow-[0_6px_14px_rgba(0,0,0,0.35)] hover:border-[#8f54ff] " +
  "before:content-[''] before:absolute before:inset-0 before:bg-[rgba(0,0,0,0.40)] " +
  "before:pointer-events-none before:transition-[background] before:duration-[0.25s] before:ease-[ease] " +
  "hover:before:bg-[rgba(0,0,0,0.30)]";

const awardPillBase =
  "inline-block py-[0.35rem] px-[0.9rem] rounded-[9999px] text-[1.05rem] " +
  "leading-none whitespace-nowrap backdrop-blur-[2px] w-min no-underline text-inherit";

const awardCategory =
  awardPillBase + " bg-[rgba(51,51,51,0.8)] text-white font-semibold";

const awardSeasonOrWinner =
  awardPillBase +
  " bg-[rgba(201,228,253,0.25)] text-[#c9e4fd] font-medium " +
  "transition-all duration-200 ease-[ease] origin-left " +
  "hover:bg-[rgba(169,214,245,0.35)] hover:text-[#a9d6f5] hover:[transform:scale(1.05)]";

const awardsSkeleton =
  "bg-[linear-gradient(90deg,#f0f0f0_25%,#e0e0e0_50%,#f0f0f0_75%)] bg-[length:200%_100%] " +
  "animate-skeleton-sweep rounded-[16px] h-[200px] w-full min-w-[240px]";

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
    <div className={`${awardsContainer} ${loading ? "opacity-80 pointer-events-none" : ""}`}>
      <div className={listingControlsToolbar}>
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

        <div className={listingSearchRow}>
          <SearchBar onSearch={handleSearch} placeholder="Search awards by player..." />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {loading ? (
        <div className={awardsGrid}>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className={awardsSkeleton}></div>
          ))}
        </div>
      ) : error ? (
        <p>Error: {error}</p>
      ) : (awards ?? []).length === 0 ? (
        <p>No awards found.</p>
      ) : (
        <div className={awardsGrid}>
          {(awards ?? []).map((award) => (
            <Link to={`/awards/${award.id}`} key={award.id} className={awardLink}>
              <div className={awardItem} style={{ backgroundImage: `url(${award.imageUrl})` }}>
                <div className={awardCategory}>{award.type}</div>
                <Link to={`/seasons/${award.season?.id}`} className={awardSeasonOrWinner}>
                  Season {award.season?.seasonNumber}
                </Link>
                <Link to={`/players/${award.players?.[0]?.id}`} className={awardSeasonOrWinner}>
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
