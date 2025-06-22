// Import React
import React, { useState, useEffect, useMemo } from "react"

// Import data hook
import { useSkinnyGames } from "../hooks/allFetch"

// Import router Link
import { Link } from "react-router-dom"

// Import styles + search
import "../styles/Game.css"
import SearchBar from "./Searchbar"

// Declare component
const Games: React.FC = () =>
{
    // Fetch game list
    const { data, error } = useSkinnyGames()

    // Track active / previous cards (purely for highlight)
    const [activeGame, setActiveGame] = useState<string | null>(null)
    const [previousActiveGame, setPreviousActiveGame] = useState<string | null>(null)

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [seasonFilter, setSeasonFilter] = useState<string>("")
    const [stageFilter, setStageFilter] = useState<string>("")

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

    // Get unique seasons and stages for filter options
    const uniqueSeasons = useMemo(() => {
        return Array.from(new Set(data?.map(game => game.season.seasonNumber) ?? []))
            .sort((a, b) => a - b)
    }, [data])

    const uniqueStages = useMemo(() => {
        return Array.from(new Set(data?.map(game => game.stage).filter(stage => stage) ?? []))
            .sort()
    }, [data])

    // Filter by search, season, and stage
    const filteredGames = useMemo(() =>
    {
        return data?.filter(g => {
            const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesSeason = !seasonFilter || g.season.seasonNumber.toString() === seasonFilter
            const matchesStage = !stageFilter || g.stage === stageFilter
            
            return matchesSearch && matchesSeason && matchesStage
        }) ?? []
    }, [data, searchQuery, seasonFilter, stageFilter])

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery("")
        setSeasonFilter("")
        setStageFilter("")
    }

    return (
        <div>
            {/* Title */}
            <h1>Games Info</h1>

            {/* Search and Filters */}
            <div className="filters-container">
                <SearchBar 
                    onSearch={setSearchQuery} 
                    placeholder="Search games..." 
                    className="games-search-bar"
                />
                
                <div className="filter-group">
                    <label className="filter-label">Season:</label>
                    <select
                        className="filter-select"
                        value={seasonFilter}
                        onChange={(e) => setSeasonFilter(e.target.value)}
                    >
                        <option value="">All Seasons</option>
                        {uniqueSeasons.map(season => (
                            <option key={season} value={season.toString()}>
                                Season {season}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Stage:</label>
                    <select
                        className="filter-select"
                        value={stageFilter}
                        onChange={(e) => setStageFilter(e.target.value)}
                    >
                        <option value="">All Stages</option>
                        {uniqueStages.map(stage => (
                            <option key={stage} value={stage}>
                                {stage}
                            </option>
                        ))}
                    </select>
                </div>

                {(searchQuery || seasonFilter || stageFilter) && (
                    <button
                        className="clear-filters-button"
                        onClick={clearFilters}
                    >
                        Clear Filters
                    </button>
                )}
            </div>

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
                                            <div className="game-stage">
                                                <strong>Stage:</strong> {game.stage}
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
