import React, { useState, useEffect, useMemo } from "react";
import { useGames } from "../hooks/allFetch";
import "../styles/Game.css";
import SearchBar from "./Searchbar";

const Games: React.FC = () => 
{
    // Use custom hook to get game data
    const { data, error } = useGames();

    // State to manage which game's card is active
    const [activeGame, setActiveGame] = useState<string | null>(null);
    const [previousActiveGame, setPreviousActiveGame] = useState<string | null>(null);
    
    // State to manage the search query
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Log previous active game after the state updates
    useEffect(() => 
    {
        if (previousActiveGame !== null) 
        {
            console.log("Previous active game:", previousActiveGame);
        }
    }, [previousActiveGame]);

    // Toggle the active game card
    const toggleCard = (gameName: string) => 
    {
        console.log("Game card clicked:", gameName);
        setPreviousActiveGame(activeGame);
        setActiveGame(prev => (prev === gameName ? null : gameName));
    };

    // Filter games based on the search query
    const filteredGames = useMemo(() =>
    {
        return data?.filter((game) =>
            game.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [data, searchQuery]);

    // Handle search query changes
    const handleSearch = (query: string) => 
    {
        setSearchQuery(query);
    };

    return (
        <div>
            <h1>Games Info</h1>

            {/* Render the SearchBar component */}
            <SearchBar onSearch={handleSearch} />

            {error ? (
                <div>Error: {error}</div>
            ) : filteredGames ? (
                <div className="games-wrapper">
                    <div className="games-container">
                        {filteredGames.map((game) => (
                            <div
                                key={game.id}
                                className={`game-card ${activeGame === game.name ? 'active' : ''}`}
                                onClick={() => toggleCard(game.name)}
                            >
                                <div className="game-name">
                                    <strong>{game.name}</strong>
                                </div>
                                <div className="game-id">
                                    <strong>ID:</strong> {game.id}
                                </div>
                                <div className="game-score">
                                    <strong>Score:</strong> {game.team1Score} - {game.team2Score}
                                </div>
                                <div className="game-season">
                                    <strong>Season:</strong> {game.season.seasonNumber}
                                </div>
                                <div className="game-date">
                                    <strong>Date:</strong> {new Date(game.date).toLocaleDateString()}
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

export default Games;
