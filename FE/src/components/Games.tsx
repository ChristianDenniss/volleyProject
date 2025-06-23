// Import React
import React, { useState, useEffect, useMemo } from "react"

// Import data hook
import { useSkinnyGames } from "../hooks/allFetch"

// Import router Link
import { Link } from "react-router-dom"

// Import styles + search
import "../styles/Game.css"
import SearchBar from "./Searchbar"
import Pagination from "./Pagination"

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

    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(1)
    const gamesPerPage = 10

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

    // Calculate pagination
    const totalPages = Math.ceil(filteredGames.length / gamesPerPage)
    const paginatedGames = filteredGames.slice(
        (currentPage - 1) * gamesPerPage,
        currentPage * gamesPerPage
    )

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery("")
        setSeasonFilter("")
        setStageFilter("")
        setCurrentPage(1) // Reset to first page when clearing filters
    }

    // Handle search
    const handleSearch = (query: string) => {
        setSearchQuery(query)
        setCurrentPage(1) // Reset to first page when searching
    }

    return (
        <div className={`games-page ${!data ? 'loading' : ''}`}>
            {/* Title */}
            <h1>Games Info</h1>

            {/* Controls */}
            <div className="games-controls-wrapper">
                <div className="games-controls-container">
                    {/* Filters Row */}
                    <div className="games-filters-row">
                        <div className="games-season-filter">
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

                        <div className="games-stage-filter">
                            <label htmlFor="stage-filter">Stage:</label>
                            <select
                                id="stage-filter"
                                value={stageFilter}
                                onChange={(e) => {
                                    setStageFilter(e.target.value)
                                    setCurrentPage(1)
                                }}
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

                    {/* Search and Pagination Row */}
                    <div className="games-search-row">
                        <SearchBar 
                            onSearch={handleSearch} 
                            placeholder="Search games..." 
                            className="games-search-bar"
                        />
                        <div className="games-pagination-wrapper">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Error / List */}
            {error ? (
                <div>Error: {error}</div>
            ) : !data ? (
                <div className="games-wrapper">
                    <div className="games-container">
                        {/* Skeleton loaders */}
                        {Array.from({ length: 10 }).map((_, index) => (
                            <div key={index} className="games-skeleton"></div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="games-wrapper">
                    <div className="games-container">
                        {paginatedGames.map(game => (
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
                                <div className="all-games-stage">
                                    <strong>Stage:</strong> {game.stage}
                                </div>
                                <div className="game-date">
                                    <strong>Date:</strong> {new Date(game.date).toLocaleDateString()}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// Export
export default Games
