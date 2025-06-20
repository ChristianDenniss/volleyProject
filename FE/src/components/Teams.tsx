import React, { useState, useEffect, useMemo } from "react";
/* Bring in the navigate helper from React Router */
import { useNavigate }                          from "react-router-dom";
import { useMediumTeams }                             from "../hooks/allFetch";
import "../styles/Teams.css";
import SearchBar                                from "./Searchbar";

const Teams: React.FC = () =>
{
    /* Get team data via custom hook */
    const { data, error } = useMediumTeams();

    /* Track the currently “opened” team card */
    const [ activeTeam,         setActiveTeam ]         = useState<string | null>(null);
    const [ previousActiveTeam, setPreviousActiveTeam ] = useState<string | null>(null);

    /* Track the search-box value */
    const [ searchQuery, setSearchQuery ] = useState<string>("");

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

    /* Helper – turn “Team Name” → “team-name” */
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

    /* Filter list according to search box */
    const filteredTeams = useMemo(() =>
    {
        return data?.filter(team =>
            team.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [ data, searchQuery ]);

    /* Update search box state */
    const handleSearch = (query: string): void =>
    {
        setSearchQuery(query);
    };

    return (
        <div>
            <h1>Teams Info</h1>

            {/* Search box */}
            <SearchBar onSearch={handleSearch} placeholder="Search teams..." />

            {error ? (
                <div>Error: {error}</div>
            ) : filteredTeams ? (
                <div className="teams-wrapper">
                    <div className="teams-container">
                        {filteredTeams.map(team => (
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
