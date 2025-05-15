import React, { useState, useEffect, useMemo } from "react";
import { useTeams } from "../hooks/allFetch";
import "../styles/Teams.css";
import SearchBar from "./Searchbar";

const Teams: React.FC = () => 
{
    // Use custom hook to get team data
    const { data, error } = useTeams();

    // State to manage which team's card is active
    const [activeTeam, setActiveTeam] = useState<string | null>(null);
    const [previousActiveTeam, setPreviousActiveTeam] = useState<string | null>(null);
    
    // State to manage the search query
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Log previous active team after the state updates
    useEffect(() => 
    {
        if (previousActiveTeam !== null) 
        {
            console.log("Previous active team:", previousActiveTeam);
        }
    }, [previousActiveTeam]);

    // Toggle the active team card
    const toggleCard = (teamName: string) => 
    {
        console.log("Team card clicked:", teamName);
        setPreviousActiveTeam(activeTeam);
        setActiveTeam(prev => (prev === teamName ? null : teamName));
    };

    // Filter teams based on the search query
    const filteredTeams = useMemo(() =>
    {
        return data?.filter((team) =>
            team.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [data, searchQuery]);

    // Handle search query changes
    const handleSearch = (query: string) => 
    {
        setSearchQuery(query);
    };

    return (
        <div>
            <h1>Teams Info</h1>

            {/* Render the SearchBar component */}
            <SearchBar onSearch={handleSearch} />

            {error ? (
                <div>Error: {error}</div>
            ) : filteredTeams ? (
                <div className="teams-wrapper">
                    <div className="teams-container">
                        {filteredTeams.map((team) => (
                            <div
                                key={team.id}
                                className={`team-card ${activeTeam === team.name ? 'active' : ''}`}
                                onClick={() => toggleCard(team.name)}
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

                                {/* Check players length and display */}
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
