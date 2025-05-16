// Import React
import React, { useState, useEffect, useMemo } from "react"

// Import data hook
import { useGames } from "../hooks/allFetch"

// Import router Link
import { Link } from "react-router-dom"

// Import styles + search
import "../styles/Game.css"
import SearchBar from "./Searchbar"

// Declare component
const Games: React.FC = () =>
{
    // Fetch game list
    const { data, error } = useGames()

    // Track active / previous cards (purely for highlight)
    const [activeGame, setActiveGame] = useState<string | null>(null)
    const [previousActiveGame, setPreviousActiveGame] = useState<string | null>(null)

    // Search state
    const [searchQuery, setSearchQuery] = useState<string>("")

    // Debug previous active
    useEffect(() =>
    {
        if (previousActiveGame !== null)
        {
            console.log("Previous active game:", previousActiveGame)
        }
    }, [previousActiveGame])

    // Card click → just set active highlight (navigation handled by <Link>)
    const handleCardClick = (gameName: string) =>
    {
        console.log("Game card clicked:", gameName)
        setPreviousActiveGame(activeGame)
        setActiveGame(gameName)
    }

    // Filter by search
    const filteredGames = useMemo(() =>
    {
        return data?.filter(g =>
            g.name.toLowerCase().includes(searchQuery.toLowerCase())
        ) ?? []
    }, [data, searchQuery])

    return (
        <div>
            {/* Title */}
            <h1>Games Info</h1>

            {/* Search */}
            <SearchBar onSearch={setSearchQuery} />

            {/* Error / List */}
            {error
                ? <div>Error: {error}</div>
                : (
                    filteredGames.length === 0
                        ? <div>Loading...</div>
                        : (
                            <div className="games-wrapper">
                                <div className="games-container">
                                    {filteredGames.map(game => (
                                        <Link
                                            key={game.id}
                                            to={`/games/${game.id}`}
                                            className={`game-card ${activeGame === game.name ? "active" : ""}`}
                                            onClick={() => handleCardClick(game.name)}
                                        >
                                            <div className="game-name"><strong>{game.name}</strong></div>
                                            <div className="game-id"><strong>ID:</strong> {game.id}</div>
                                            <div className="game-score">
                                                <strong>Score:</strong> {game.team1Score} – {game.team2Score}
                                            </div>
                                            <div className="game-season">
                                                <strong>Season:</strong> {game.season.seasonNumber}
                                            </div>
                                            <div className="game-date">
                                                <strong>Date:</strong> {new Date(game.date).toLocaleDateString()}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )
                  )
            }
        </div>
    )
}

// Export
export default Games
