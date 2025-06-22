import React, { useState, useEffect, useMemo } from "react";
/* Bring in the navigate helper from React Router */
import { useNavigate }                          from "react-router-dom";
import { useMediumTeams }                             from "../hooks/allFetch";
import "../styles/Teams.css";
import SearchBar                                from "./Searchbar";
import Pagination                               from "./Pagination";

const Teams: React.FC = () =>
{
    /* Get team data via custom hook */
    const { data, error } = useMediumTeams();

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
    const teamsPerPage = 10;

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

    /* Get unique seasons and placements for filter options */
    const uniqueSeasons = useMemo(() => {
        return Array.from(new Set(data?.map(team => team.season.seasonNumber) ?? []))
            .sort((a, b) => a - b)
    }, [data])

    const uniquePlacements = useMemo(() => {
        return Array.from(new Set(data?.map(team => team.placement).filter(placement => placement) ?? []))
            .sort()
    }, [data])

    /* Filter list according to search box and filters */
    const filteredTeams = useMemo(() =>
    {
        return data?.filter(team => {
            const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesSeason = !seasonFilter || team.season.seasonNumber.toString() === seasonFilter
            const matchesPlacement = !placementFilter || team.placement === placementFilter
            
            return matchesSearch && matchesSeason && matchesPlacement
        }) ?? []
    }, [ data, searchQuery, seasonFilter, placementFilter ]);

    /* Calculate pagination */
    const totalPages = Math.ceil(filteredTeams.length / teamsPerPage)
    const paginatedTeams = filteredTeams.slice(
        (currentPage - 1) * teamsPerPage,
        currentPage * teamsPerPage
    )

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
        <div className="teams-page">
            <h1>Teams Info</h1>

            {/* Controls */}
            <div className="teams-controls-wrapper">
                <div className="teams-controls-container">
                    {/* Filters Row */}
                    <div className="teams-filters-row">
                        <div className="teams-season-filter">
                            <label htmlFor="season-filter">Season:</label>
                            <select
                                id="season-filter"
                                value={seasonFilter}
                                onChange={(e) => {
                                    setSeasonFilter(e.target.value)
                                    setCurrentPage(1)
                                }}
                            >
                                <option value="">All Seasons</option>
                                {uniqueSeasons.map(season => (
                                    <option key={season} value={season.toString()}>
                                        Season {season}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="teams-placement-filter">
                            <label htmlFor="placement-filter">Placement:</label>
                            <select
                                id="placement-filter"
                                value={placementFilter}
                                onChange={(e) => {
                                    setPlacementFilter(e.target.value)
                                    setCurrentPage(1)
                                }}
                            >
                                <option value="">All Placements</option>
                                {uniquePlacements.map(placement => (
                                    <option key={placement} value={placement}>
                                        {placement}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {(searchQuery || seasonFilter || placementFilter) && (
                            <button
                                className="clear-filters-button"
                                onClick={clearFilters}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>

                    {/* Search and Pagination Row */}
                    <div className="teams-search-row">
                        <SearchBar 
                            onSearch={handleSearch} 
                            placeholder="Search teams..." 
                            className="teams-search-bar"
                        />
                        <div className="teams-pagination-wrapper">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {error ? (
                <div>Error: {error}</div>
            ) : filteredTeams ? (
                <div className="teams-wrapper">
                    <div className="teams-container">
                        {paginatedTeams.map(team => (
                            <div
                                key={team.id}
                                className={`team-card ${activeTeam === team.name ? "active" : ""}`}
                                onClick={() => handleCardClick(team.name)}
                            >
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
            ) : (
                <div>Loading...</div>
            )}
        </div>
    );
};

export default Teams;
