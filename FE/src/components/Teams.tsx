import React, { useState, useEffect } from "react";
/* Bring in the navigate helper from React Router */
import { useNavigate }                          from "react-router-dom";
import { useMediumTeams, useSkinnySeasons }                             from "../hooks/allFetch";
import SearchBar                                from "./Searchbar";
import Pagination                               from "./Pagination";
import FilterBar                                from "./ui/FilterBar";
import FilterSelect                             from "./ui/FilterSelect";
import { useRegion } from "../context/regionContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { TEAM_PLACEMENTS } from "../constants/teamPlacements";
import {
    listingControlsToolbar,
    listingSearchRow,
    listingTableEmpty,
} from "./listingClasses";

const teamsPage =
    "w-full max-w-[1200px] mx-auto py-[20px] px-[20px] box-border min-h-screen " +
    "[contain:layout_style_paint]";

const teamsWrapper =
    "py-[10px] px-0 min-h-[600px] [content-visibility:auto] [contain-intrinsic-size:600px] " +
    "upto-md:min-h-[500px]";

const teamsContainer =
    "grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] [grid-template-rows:auto] gap-[1.5rem] " +
    "py-[10px] px-0 min-h-[500px] content-start upto-md:min-h-[400px] " +
    "empty:before:content-[''] empty:before:block empty:before:h-[500px] empty:before:w-full";

/* Hover animates `transform`, so the lift is one arbitrary value rather than
   a translate utility. Active used the same declarations as hover. */
const teamCard =
    "relative overflow-hidden bg-[#141414] " +
    "bg-[linear-gradient(180deg,rgba(255,255,255,0.07),transparent_45%)] " +
    "rounded-[0.85rem] border border-[#1e1e1e] pt-[1.75rem] px-[1.25rem] pb-[1.4rem] " +
    "transition-[transform,box-shadow] duration-[140ms] ease-[ease] cursor-pointer " +
    "min-h-[120px] box-border [contain:layout_style] [transform:translateZ(0)] " +
    "[backface-visibility:hidden] " +
    "hover:[transform:translateY(-4px)] " +
    "hover:shadow-[0_8px_22px_rgba(var(--color-brand-primary-rgb),0.25)]";

/* Active used the same transform/shadow as hover. It is not an extension of
   teamCard: both set `transform`, and composing them would leave the winner
   to Tailwind source order. */
const teamCardActive =
    "relative overflow-hidden bg-[#141414] " +
    "bg-[linear-gradient(180deg,rgba(255,255,255,0.07),transparent_45%)] " +
    "rounded-[0.85rem] border border-[#1e1e1e] pt-[1.75rem] px-[1.25rem] pb-[1.4rem] " +
    "transition-[transform,box-shadow] duration-[140ms] ease-[ease] cursor-pointer " +
    "min-h-[120px] box-border [contain:layout_style] [transform:translateY(-4px)] " +
    "[backface-visibility:hidden] " +
    "shadow-[0_8px_22px_rgba(var(--color-brand-primary-rgb),0.25)] " +
    "hover:[transform:translateY(-4px)] " +
    "hover:shadow-[0_8px_22px_rgba(var(--color-brand-primary-rgb),0.25)]";

const teamCardLogoBg =
    "absolute top-0 right-0 w-[200px] h-[200px] bg-contain bg-no-repeat bg-right " +
    "opacity-25 pointer-events-none z-0 translate-x-[30%]";

const teamName = "text-[1.25rem] font-extrabold text-[#fafafa] mb-[0.5rem]";

const teamMeta = "text-[0.875rem] font-medium text-[#a0a0a0] mb-[0.25rem]";

const teamsSkeleton =
    "bg-[image:var(--skeleton-shimmer)] bg-[length:200%_100%] animate-skeleton-sweep " +
    "rounded-[0.85rem] h-[120px] mb-[1.5rem]";

const Teams: React.FC = () =>
{
    const { regionQuery } = useRegion();

    /* Track the currently "opened" team card */
    const [ activeTeam,         setActiveTeam ]         = useState<string | null>(null);
    const [ previousActiveTeam, setPreviousActiveTeam ] = useState<string | null>(null);

    /* Track the search-box value */
    const [ searchQuery, setSearchQuery ] = useState<string>("");

    /* Filter states */
    const [ seasonFilter, setSeasonFilter ] = useState<string>("");
    const [ placementFilter, setPlacementFilter ] = useState<string>("");

    /* Pagination state */
    const [ currentPage, setCurrentPage ] = useState<number>(1);
    const teamsPerPage = 12;

    const debouncedSearch = useDebouncedValue(searchQuery);

    const { data: paginatedTeams, totalPages, loading, error } = useMediumTeams({
        page: currentPage,
        limit: teamsPerPage,
        search: debouncedSearch || undefined,
        seasonId: seasonFilter || undefined,
        placement: placementFilter || undefined,
        ...regionQuery,
    });

    const { data: seasons } = useSkinnySeasons({ page: 1, limit: 100, ...regionQuery });
    const seasonOptions = [...(seasons ?? [])].sort((a, b) => a.seasonNumber - b.seasonNumber);

    /* Hook for programmatic navigation */
    const navigate = useNavigate();

    /* Log whichever card was active before the latest click */
    useEffect(() =>
    {
        if (previousActiveTeam !== null)
        {
            console.log("Previous active team:", previousActiveTeam);
        }
    }, [ previousActiveTeam ]);

    /* Helper – turn "Team Name" → "team-name" */
    const slugify = (name: string): string =>
    {
        return name.toLowerCase().replace(/\s+/g, "-");
    };

    /* Handle a card click */
    const handleCardClick = (teamName: string): void =>
    {
        /* Save current active for comparison */
        setPreviousActiveTeam(activeTeam);

        /* Toggle highlight state (purely visual) */
        setActiveTeam(prev => (prev === teamName ? null : teamName));

        /* Navigate to /teams/<team-name> (relative path) */
        navigate(slugify(teamName));
    };

    const handleCardKeyDown = (event: React.KeyboardEvent, teamName: string): void =>
    {
        if (event.key === "Enter" || event.key === " ")
        {
            event.preventDefault();
            handleCardClick(teamName);
        }
    };

    /* Update search box state */
    const handleSearch = (query: string): void =>
    {
        setSearchQuery(query);
        setCurrentPage(1); // Reset to first page when searching
    };

    /* Clear all filters */
    const clearFilters = () => {
        setSearchQuery("")
        setSeasonFilter("")
        setPlacementFilter("")
        setCurrentPage(1) // Reset to first page when clearing filters
    }

    return (
        <div className={`${teamsPage} ${loading ? "opacity-80 pointer-events-none" : ""}`}>
            <div className={listingControlsToolbar}>
                    <FilterBar onReset={(searchQuery || seasonFilter || placementFilter) ? clearFilters : undefined}>
                        <FilterSelect
                            id="season-filter"
                            label="Season"
                            value={seasonFilter}
                            onChange={(value) => {
                                setSeasonFilter(value)
                                setCurrentPage(1)
                            }}
                            placeholder="All Seasons"
                            options={seasonOptions.map((season) => ({
                                value: season.id.toString(),
                                label: `Season ${season.seasonNumber}`,
                            }))}
                        />

                        <FilterSelect
                            id="placement-filter"
                            label="Placement"
                            value={placementFilter}
                            onChange={(value) => {
                                setPlacementFilter(value)
                                setCurrentPage(1)
                            }}
                            placeholder="All Placements"
                            options={TEAM_PLACEMENTS.map((placement) => ({
                                value: placement,
                                label: placement,
                            }))}
                        />
                    </FilterBar>

                    <div className={listingSearchRow}>
                        <SearchBar 
                            onSearch={handleSearch} 
                            placeholder="Search teams..." 
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
            ) : loading ? (
                <div className={teamsWrapper}>
                    <div className={teamsContainer}>
                        {Array.from({ length: 12 }).map((_, index) => (
                            <div key={index} className={teamsSkeleton}></div>
                        ))}
                    </div>
                </div>
            ) : (paginatedTeams ?? []).length === 0 ? (
                <div className={listingTableEmpty}>No teams match your filters.</div>
            ) : (
                <div className={teamsWrapper}>
                    <div className={teamsContainer}>
                        {(paginatedTeams ?? []).map(team => (
                            <div
                                key={team.id}
                                className={activeTeam === team.name ? teamCardActive : teamCard}
                                role="link"
                                tabIndex={0}
                                onClick={() => handleCardClick(team.name)}
                                onKeyDown={(event) => handleCardKeyDown(event, team.name)}
                                aria-label={`View team ${team.name}`}
                            >
                                {team.logoUrl && (
                                    <div 
                                        className={teamCardLogoBg}
                                        style={{
                                            backgroundImage: `url(${team.logoUrl})`
                                        }}
                                    />
                                )}
                                
                                <div className={teamName}>
                                    <strong>{team.name}</strong>
                                </div>

                                <div className={teamMeta}>
                                    <strong>ID:</strong> {team.id}
                                </div>

                                <div className={teamMeta}>
                                    <strong>Season:</strong> {team.season.seasonNumber}
                                </div>

                                <div className={teamMeta}>
                                    <strong>Placement:</strong> {team.placement}
                                </div>

                                <div className={teamMeta}>
                                    <strong>Players:</strong> {team.players?.length || 0}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Teams;
