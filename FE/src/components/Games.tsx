import React, { useState } from "react"

import { useSkinnyGames, useSkinnySeasons, useGameStages } from "../hooks/allFetch"

import { useNavigate } from "react-router-dom"

import type { Game, Team } from "../types/interfaces"

import "../styles/ListingPage.css"

import SearchBar from "./Searchbar"

import Pagination from "./Pagination"

import FilterBar from "./ui/FilterBar"

import FilterSelect from "./ui/FilterSelect"

import { formatGameStage } from "../utils/gameLabels"

import { useRegion } from "../context/regionContext"

import { useDebouncedValue } from "../hooks/useDebouncedValue"

/* ── Scoreboard tile classes ────────────────────────────────────────────────
   Carried over from Game.css. The card keeps its left navy accent on desktop
   and flips it to a top accent under 768px, where the body also stacks and the
   score moves above the two teams (`order-first`). */

const CARD =
  "flex flex-col gap-[0.9rem] w-full justify-self-stretch bg-bg " +
  "border border-border border-l-4 border-l-brand-primary rounded-md shadow-sm " +
  "px-5 pt-[1.15rem] pb-4 cursor-pointer box-border " +
  "transition-[transform,box-shadow] duration-[140ms] ease-[ease] " +
  "hover:-translate-y-[3px] hover:shadow-md " +
  "max-md:border-l-0 max-md:border-t-4 max-md:border-t-brand-primary " +
  "max-md:px-4 max-md:pt-[0.9rem] max-md:pb-3"

const CARD_BODY =
  "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-y-[0.85rem] gap-x-[1.15rem] " +
  "max-md:grid-cols-1 max-md:gap-3"

const CARD_SIDE =
  "flex flex-row items-center justify-center gap-[0.65rem] min-w-0 max-md:text-center"

const CARD_CENTER =
  "flex flex-col items-center justify-center gap-1 min-w-[4.75rem] px-1 max-md:order-first"

const CARD_SCORE =
  "flex items-center gap-[0.4rem] text-2xl font-extrabold leading-none text-text max-md:text-[1.35rem]"

const CARD_FOOTER =
  "flex items-center justify-center flex-wrap gap-[0.45rem] pt-[0.65rem] " +
  "border-t border-border text-[0.8125rem] text-text-muted text-center"

const TEAM_LOGO_BASE = "w-14 h-14 object-contain shrink-0"

const TEAM_LOGO_FALLBACK_BASE =
  "inline-flex items-center justify-center w-14 h-14 rounded-full " +
  "bg-bg-muted border border-border text-[0.8125rem] font-bold text-brand-primary shrink-0"

/** The losing side's crest is dimmed and desaturated, as before. */
const MUTED = "opacity-40 grayscale"

function getGameTeams(game: Game): [Team | null, Team | null] {

  if (game.teams && game.teams.length >= 2) {

    return [game.teams[0], game.teams[1]]

  }



  const parts = game.name.split(" vs ")

  if (parts.length === 2) {

    return [

      { id: 0, name: parts[0].trim(), placement: "", season: game.season },

      { id: 0, name: parts[1].trim(), placement: "", season: game.season },

    ]

  }



  return [null, null]

}



function formatGameDateParts(date: Date | string) {
  const parsed = new Date(date)
  return parsed.toLocaleDateString(undefined, { day: "2-digit", month: "short" }).toUpperCase()
}



function TeamLogo({ team, name, muted = false }: { team: Team | null; name: string; muted?: boolean }) {
  if (team?.logoUrl) {
    return <img src={team.logoUrl} alt="" className={`${TEAM_LOGO_BASE}${muted ? ` ${MUTED}` : ""}`} />
  }

  const initials = name.trim().slice(0, 2).toUpperCase() || "?"
  return (
    <span
      className={`${TEAM_LOGO_FALLBACK_BASE}${muted ? ` ${MUTED}` : ""}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
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

    <div className={`mx-auto box-border min-h-screen w-[min(100%,1600px)] max-w-[1600px] px-[clamp(1rem,2.5vw,2.5rem)] py-5 [contain:layout_style_paint] ${loading ? "pointer-events-none opacity-80" : ""}`}>

      <div className="listing-controls-toolbar">

          <FilterBar onReset={(searchQuery || seasonFilter || stageFilter) ? clearFilters : undefined}>

            <FilterSelect
              id="season-filter"
              label="Season"
              value={seasonFilter}
              onChange={(value) => {
                setSeasonFilter(value)
                setCurrentPage(1)
              }}
              placeholder="All Seasons"
              options={seasonOptions.map((season) => ({
                value: season.id.toString(),
                label: `Season ${season.seasonNumber}`,
              }))}
            />

            <FilterSelect
              id="stage-filter"
              label="Stage"
              value={stageFilter}
              onChange={(value) => {
                setStageFilter(value)
                setCurrentPage(1)
              }}
              placeholder="All Stages"
              options={(uniqueStages ?? []).map((stage) => ({ value: stage, label: stage }))}
            />

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

            <div className="min-h-[500px] py-2.5 max-md:min-h-[400px]">

              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] items-start gap-4 min-[960px]:grid-cols-3 max-md:grid-cols-1">

                {Array.from({ length: 20 }).map((_, index) => (

                  <div key={index} className="h-[140px] animate-game-card-shimmer rounded-md bg-[image:var(--skeleton-shimmer)] bg-[length:200%_100%]" />

                ))}

              </div>

            </div>

          ) : !paginatedGames || paginatedGames.length === 0 ? (

            <div className="listing-table-empty">No games match your filters.</div>

          ) : (

            <div className="min-h-[500px] py-2.5 max-md:min-h-[400px]">

              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] items-start gap-4 min-[960px]:grid-cols-3 max-md:grid-cols-1">

                {paginatedGames.map((game) => {

                  const [team1, team2] = getGameTeams(game)

                  const team1Name = team1?.name ?? "TBD"

                  const team2Name = team2?.name ?? "TBD"

                  const hasScore = game.team1Score != null && game.team2Score != null

                  const team1Wins = hasScore && game.team1Score! > game.team2Score!

                  const team2Wins = hasScore && game.team2Score! > game.team1Score!

                  const dateLabel = formatGameDateParts(game.date)

                  const teamName = (winner: boolean) =>
                    `text-[0.9375rem] font-bold leading-[1.3] text-center [overflow-wrap:break-word] ${winner ? "text-brand-primary" : "text-text"}`

                  const scoreValue = (winner: boolean) =>
                    `min-w-[1.1rem] text-center${winner ? " text-brand-primary" : ""}`



                  return (

                    <div

                      key={game.id}

                      className={CARD}

                      onClick={() => navigate(`/games/${game.id}`)}

                    >

                      <div className={CARD_BODY}>

                        <div className={CARD_SIDE}>

                          <span className={teamName(team1Wins)}>

                            {team1Name}

                          </span>

                          <TeamLogo team={team1} name={team1Name} muted={hasScore && team2Wins} />

                        </div>



                        <div className={CARD_CENTER}>

                          <div className={CARD_SCORE}>

                            <span className={scoreValue(team1Wins)}>

                              {hasScore ? game.team1Score : "–"}

                            </span>

                            <span className="font-semibold text-text-subtle">:</span>

                            <span className={scoreValue(team2Wins)}>

                              {hasScore ? game.team2Score : "–"}

                            </span>

                          </div>

                          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.05em] text-text-muted">{dateLabel}</span>

                        </div>



                        <div className={CARD_SIDE}>
                          <TeamLogo team={team2} name={team2Name} muted={hasScore && team1Wins} />
                          <span className={teamName(team2Wins)}>
                            {team2Name}
                          </span>
                        </div>

                      </div>



                      <div className={CARD_FOOTER}>

                        <span className="rounded-[0.35rem] bg-accent-pale px-2 py-[0.15rem] text-[0.6875rem] font-bold text-brand-primary">Season {game.season.seasonNumber}</span>

                        <span className="text-text-subtle">·</span>

                        <span>{formatGameStage(game)}</span>

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
