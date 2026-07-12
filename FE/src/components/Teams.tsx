import React, { useState, useEffect } from "react";
/* Bring in the navigate helper from React Router */
import { useNavigate }                          from "react-router-dom";
import { useMediumTeams, useSkinnySeasons }                             from "../hooks/allFetch";
import "../styles/Teams.css";
import "../styles/ListingPage.css";
import SearchBar                                from "./Searchbar";
import Pagination                               from "./Pagination";
import FilterBar                                from "./ui/FilterBar";
import { useRegion } from "../context/regionContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { TEAM_PLACEMENTS } from "../constants/teamPlacements";

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
        console.log("Team card clicked:", teamName);

        /* Save current active for comparison */
        setPreviousActiveTeam(activeTeam);

        /* Toggle highlight state (purely visual) */
        setActiveTeam(prev => (prev === teamName ? null : teamName));

        /* Navigate to /teams/<team-name> (relative path) */
        navigate(slugify(teamName));
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
        <div className={`teams-page ${loading ? 'loading' : ''}`}>
            <div className="listing-controls-toolbar">
                    <FilterBar onReset={(searchQuery || seasonFilter || placementFilter) ? clearFilters : undefined}>
                        <div className="teams-season-filter">
                            <select
                                id="season-filter"
                                aria-label="Season"
                                value={seasonFilter}
                                onChange={(e) => {
                                    setSeasonFilter(e.target.value)
                                    setCurrentPage(1)
                                }}
                            >
                                <option value="">All Seasons</option>
                                {seasonOptions.map(season => (
                                    <option key={season.id} value={season.id.toString()}>
                                        Season {season.seasonNumber}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="teams-placement-filter">
                            <select
                                id="placement-filter"
                                aria-label="Placement"
                                value={placementFilter}
                                onChange={(e) => {
                                    setPlacementFilter(e.target.value)
                                    setCurrentPage(1)
                                }}
                            >
                                <option value="">All Placements</option>
                                {TEAM_PLACEMENTS.map(placement => (
                                    <option key={placement} value={placement}>
                                        {placement}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </FilterBar>

                    <div className="listing-search-row">
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
                <div className="teams-wrapper">
                    <div className="teams-container">
                        {/* Skeleton loaders */}
                        {Array.from({ length: 12 }).map((_, index) => (
                            <div key={index} className="teams-skeleton"></div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="teams-wrapper">
                    <div className="teams-container">
                        {(paginatedTeams ?? []).map(team => (
                            <div
                                key={team.id}
                                className={`team-card ${activeTeam === team.name ? "active" : ""}`}
                                onClick={() => handleCardClick(team.name)}
                            >
                                {team.logoUrl && (
                                    <div 
                                        className="team-card-logo-bg"
                                        style={{
                                            backgroundImage: `url(${team.logoUrl})`
                                        }}
                                    />
                                )}
                                
                                <div className="team-name">
                                    <strong>{team.name}</strong>
                                </div>

                                <div className="team-id">
                                    <strong>ID:</strong> {team.id}
                                </div>

                                <div className="team-season">
                                    <strong>Season:</strong> {team.season.seasonNumber}
                                </div>

                                <div className="team-card-stage">
                                    <strong>Placement:</strong> {team.placement}
                                </div>

                                <div className="team-players">
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
