import React, { useState, useMemo } from "react"
import { useSkinnyGames } from "../hooks/allFetch"
import { Link, useNavigate } from "react-router-dom"
import type { Game } from "../types/interfaces"
import Table, { type TableColumn } from "./ui/Table"
import "../styles/Game.css"
import "../styles/ListingPage.css"
import SearchBar from "./Searchbar"
import Pagination from "./Pagination"
import FilterBar from "./ui/FilterBar"

const gameColumns: TableColumn<Game>[] = [
  {
    key: "name",
    header: "Game",
    render: (game) => (
      <Link to={`/games/${game.id}`} onClick={(e) => e.stopPropagation()}>
        {game.name}
      </Link>
    ),
  },
  {
    key: "season",
    header: "Season",
    render: (game) => game.season.seasonNumber,
  },
  {
    key: "stage",
    header: "Stage",
    render: (game) => game.stage || "—",
  },
  {
    key: "score",
    header: "Score",
    render: (game) => `${game.team1Score} – ${game.team2Score}`,
  },
  {
    key: "date",
    header: "Date",
    render: (game) => new Date(game.date).toLocaleDateString(),
  },
]

const Games: React.FC = () => {
  const { data, error } = useSkinnyGames()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState<string>("")
  const [seasonFilter, setSeasonFilter] = useState<string>("")
  const [stageFilter, setStageFilter] = useState<string>("")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const gamesPerPage = 10

  const uniqueSeasons = useMemo(() => {
    return Array.from(new Set(data?.map((game) => game.season.seasonNumber) ?? []))
      .sort((a, b) => a - b)
  }, [data])

  const uniqueStages = useMemo(() => {
    return Array.from(new Set(data?.map((game) => game.stage).filter(Boolean) ?? []))
      .sort()
  }, [data])

  const filteredGames = useMemo(() => {
    return (
      data?.filter((g) => {
        const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesSeason = !seasonFilter || g.season.seasonNumber.toString() === seasonFilter
        const matchesStage = !stageFilter || g.stage === stageFilter
        return matchesSearch && matchesSeason && matchesStage
      }) ?? []
    )
  }, [data, searchQuery, seasonFilter, stageFilter])

  const totalPages = Math.ceil(filteredGames.length / gamesPerPage)
  const paginatedGames = filteredGames.slice(
    (currentPage - 1) * gamesPerPage,
    currentPage * gamesPerPage
  )

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
    <div className={`games-page ${!data ? "loading" : ""}`}>
      <h1>Games Info</h1>

      <div className="games-controls-wrapper">
        <div className="games-controls-container">
          <FilterBar onReset={(searchQuery || seasonFilter || stageFilter) ? clearFilters : undefined}>
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
                {uniqueSeasons.map((season) => (
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
                {uniqueStages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
          </FilterBar>

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

      {error ? (
        <div>Error: {error}</div>
      ) : !data ? (
        <div className="listing-table-wrapper">
          <div className="listing-skeleton-table">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="listing-skeleton-row" />
            ))}
          </div>
        </div>
      ) : paginatedGames.length === 0 ? (
        <div className="listing-table-empty">No games match your filters.</div>
      ) : (
        <Table
          columns={gameColumns}
          rows={paginatedGames}
          rowKey={(game) => game.id}
          tableClassName="listing-table"
          wrapperClassName="listing-table-wrapper"
          rowClassName={() => "listing-row-clickable"}
          onRowClick={(game) => navigate(`/games/${game.id}`)}
        />
      )}
    </div>
  )
}

export default Games
