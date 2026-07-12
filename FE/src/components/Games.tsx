import React, { useState } from "react"
import { useSkinnyGames, useSkinnySeasons, useGameStages } from "../hooks/allFetch"
import { useNavigate } from "react-router-dom"
import type { Game } from "../types/interfaces"
import "../styles/Game.css"
import "../styles/ListingPage.css"
import SearchBar from "./Searchbar"
import Pagination from "./Pagination"
import FilterBar from "./ui/FilterBar"
import { formatGameStage } from "../utils/gameLabels"
import { useRegion } from "../context/regionContext"
import { useDebouncedValue } from "../hooks/useDebouncedValue"

/** "Team A vs Team B" -> ["Team A", "Team B"]; falls back to the teams relation if present. */
function getGameTeamNames(game: Game): [string, string] {
  if (game.teams && game.teams.length >= 2) {
    return [game.teams[0].name, game.teams[1].name]
  }
  const parts = game.name.split(" vs ")
  if (parts.length === 2) return [parts[0].trim(), parts[1].trim()]
  return [game.name, ""]
}

const Games: React.FC = () => {
  const { regionQuery } = useRegion()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState<string>("")
  const [seasonFilter, setSeasonFilter] = useState<string>("")
  const [stageFilter, setStageFilter] = useState<string>("")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const gamesPerPage = 20

  const debouncedSearch = useDebouncedValue(searchQuery)

  const { data: paginatedGames, totalPages, loading, error } = useSkinnyGames({
    status: 'completed',
    page: currentPage,
    limit: gamesPerPage,
    search: debouncedSearch || undefined,
    seasonId: seasonFilter || undefined,
    stage: stageFilter || undefined,
    ...regionQuery,
  })

  const { data: seasons } = useSkinnySeasons({ page: 1, limit: 100, ...regionQuery })
  const seasonOptions = [...(seasons ?? [])].sort((a, b) => a.seasonNumber - b.seasonNumber)

  const { data: uniqueStages } = useGameStages({ seasonId: seasonFilter || undefined, ...regionQuery })

  const clearFilters = () => {
    setSearchQuery("")
    setSeasonFilter("")
    setStageFilter("")
    setCurrentPage(1)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  return (
    <div className={`games-page ${loading ? "loading" : ""}`}>
      <div className="listing-controls-toolbar">
          <FilterBar onReset={(searchQuery || seasonFilter || stageFilter) ? clearFilters : undefined}>
            <div className="games-season-filter">
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
                {seasonOptions.map((season) => (
                  <option key={season.id} value={season.id.toString()}>
                    Season {season.seasonNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="games-stage-filter">
              <select
                id="stage-filter"
                aria-label="Stage"
                value={stageFilter}
                onChange={(e) => {
                  setStageFilter(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="">All Stages</option>
                {uniqueStages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
          </FilterBar>

          <div className="listing-search-row">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search games..."
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
      ) : (
        <div className="listing-content-wrapper">
          {loading ? (
            <div className="game-cards-wrapper">
              <div className="game-cards-list">
                {Array.from({ length: 20 }).map((_, index) => (
                  <div key={index} className="game-card-skeleton" />
                ))}
              </div>
            </div>
          ) : !paginatedGames || paginatedGames.length === 0 ? (
            <div className="listing-table-empty">No games match your filters.</div>
          ) : (
            <div className="game-cards-wrapper">
              <div className="game-cards-list">
                {paginatedGames.map((game) => {
                  const [team1Name, team2Name] = getGameTeamNames(game)
                  const hasScore = game.team1Score != null && game.team2Score != null
                  const team1Wins = hasScore && game.team1Score! > game.team2Score!
                  const team2Wins = hasScore && game.team2Score! > game.team1Score!

                  return (
                    <div
                      key={game.id}
                      className="game-card"
                      onClick={() => navigate(`/games/${game.id}`)}
                    >
                      <div className="game-card-meta">
                        <span className="game-card-season-chip">S{game.season.seasonNumber}</span>
                        <span className="game-card-stage-chip">{formatGameStage(game)}</span>
                      </div>

                      <div className="game-card-matchup">
                        <div className="game-card-team game-card-team-left">
                          <span className="game-card-team-name">{team1Name}</span>
                        </div>

                        <div className="game-card-score">
                          <span className={`game-card-score-value${team1Wins ? " winner" : ""}`}>
                            {hasScore ? game.team1Score : "–"}
                          </span>
                          <span className="game-card-score-sep">:</span>
                          <span className={`game-card-score-value${team2Wins ? " winner" : ""}`}>
                            {hasScore ? game.team2Score : "–"}
                          </span>
                        </div>

                        <div className="game-card-team game-card-team-right">
                          <span className="game-card-team-name">{team2Name}</span>
                        </div>
                      </div>

                      <div className="game-card-footer">
                        <span>{new Date(game.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Games
