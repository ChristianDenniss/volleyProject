// Import React
import React from "react"

// Import shared interfaces
import { Game, Stats } from "../../types/interfaces"

// Import shared Table component
import Table, { type TableColumn } from "../ui/Table"

// Import custom fetch hook
import { useSingleGames } from "../../hooks/allFetch"

// Import React-Router helper
import { useParams } from "react-router-dom"

// Import styles
import "../../styles/SingleGame.css"

// Import SEO component
import SEO from "../SEO"

// Declare component
const SingleGame: React.FC = () =>
{
    // Grab :id from URL
    const { id } = useParams<{ id: string }>()

    // Early-exit when no id
    if (!id)
    {
        return <div className="single-game-container">URL ID is undefined</div>
    }

    // Fetch data
    const { data, error, loading } = useSingleGames(id)

    return (
        <div className={`single-game-container ${loading ? 'loading' : ''}`}>
            {loading ? (
                <>
                    {/* Game title skeleton */}
                    <div className="sg-skeleton-title"></div>
                    
                    <div className="sg-skeleton-stage"></div>

                    {/* Metadata skeleton */}
                    <div className="meta-block">
                        <div className="sg-skeleton-meta"></div>
                        <div className="sg-skeleton-meta"></div>
                        <div className="sg-skeleton-meta"></div>
                        <div className="sg-skeleton-meta"></div>
                    </div>

                    {/* Divider */}
                    <hr className="meta-divider" />

                    {/* Scoreboard skeleton */}
                    <div className="sg-skeleton-scoreboard"></div>

                    {/* Stats skeleton */}
                    <section className="stats-section">
                        <div className="sg-skeleton-stats-title"></div>
                        <div className="sg-skeleton-stats-table"></div>
                    </section>
                </>
            ) : error ? (
                <div className="single-game-container">Error: {error}</div>
            ) : !data ? (
                <div className="single-game-container">No data found.</div>
            ) : (
                <>
                    {/* Normalize into Game[] */}
                    {(() => {
                        let games: Game[] = []
                        if (Array.isArray(data))
                        {
                            games = data
                        }
                        else if (
                            typeof data === "object" &&
                            data !== null &&
                            "games" in data &&
                            Array.isArray((data as any).games)
                        )
                        {
                            games = (data as any).games
                        }
                        else
                        {
                            games = [data as Game]
                        }

                        // No games?
                        if (games.length === 0)
                        {
                            return <div className="single-game-container">Game not found.</div>
                        }

                        // Pick the matching game
                        const numericId = Number(id)
                        const game      = games.find(g => g.id === numericId) ?? games[0]

                        // Compute total sets
                        const totalSets = game.team1Score + game.team2Score

                        // Format date
                        const formattedDate = new Date(game.date).toLocaleDateString(
                            undefined,
                            { year: "numeric", month: "long", day: "numeric" }
                        )

                        // Stats exists?
                        const hasStats = Array.isArray(game.stats) && game.stats.length > 0

                        // Group stats by team
                        const team1 = game.teams?.[0] ?? { name: "Team 1", players: [] }
                        const team2 = game.teams?.[1] ?? { name: "Team 2", players: [] }
                        const team1Stats = (game.stats ?? []).filter(s =>
                            team1.players?.some(p => p.id === s.player.id)
                        )
                        const team2Stats = (game.stats ?? []).filter(s =>
                            team2.players?.some(p => p.id === s.player.id)
                        )

                        // Combined stats rows (team 1 followed by team 2) for the shared Table
                        const allStats: Stats[] = [...team1Stats, ...team2Stats]

                        // Column definitions for the player statistics table
                        const statsColumns: TableColumn<Stats>[] = [
                            { key: "player", header: "Player", render: (row) => row.player.name },
                            { key: "spikeKills", header: "Spike Kills", render: (row) => row.spikeKills },
                            { key: "spikeAttempts", header: "Spike Attempts", render: (row) => row.spikeAttempts },
                            { key: "apeKills", header: "Ape Kills", render: (row) => row.apeKills },
                            { key: "apeAttempts", header: "Ape Attempts", render: (row) => row.apeAttempts },
                            { key: "spikingErrors", header: "Spiking Errors", render: (row) => row.spikingErrors },
                            { key: "digs", header: "Digs", render: (row) => row.digs },
                            { key: "blockFollows", header: "Block Follows", render: (row) => row.blockFollows },
                            { key: "blocks", header: "Blocks", render: (row) => row.blocks },
                            { key: "assists", header: "Assists", render: (row) => row.assists },
                            { key: "settingErrors", header: "Setting Errors", render: (row) => row.settingErrors },
                            { key: "aces", header: "Aces", render: (row) => row.aces },
                            { key: "servingErrors", header: "Serve Errors", render: (row) => row.servingErrors },
                            { key: "miscErrors", header: "Misc Errors", render: (row) => row.miscErrors },
                        ]

                        return (
                            <>
                                {/* SEO Meta Tags for Social Media Embedding */}
                                <SEO
                                    title={`${game.name} - Game Results`}
                                    description={`${team1.name} vs ${team2.name} - Final Score: ${game.team1Score}-${game.team2Score}. ${game.stage} match from Season ${game.season.seasonNumber} of the Roblox Volleyball League.`}
                                    image="https://volleyball4-2.com/rvlLogo.png"
                                    url={`https://volleyball4-2.com/games/${game.id}`}
                                    type="sports_event"
                                    publishedTime={new Date(game.date).toISOString()}
                                    structuredData={{
                                        "@context": "https://schema.org",
                                        "@type": "SportsEvent",
                                        "name": game.name,
                                        "description": `${team1.name} vs ${team2.name} - ${game.stage} match`,
                                        "url": `https://volleyball4-2.com/games/${game.id}`,
                                        "startDate": new Date(game.date).toISOString(),
                                        "endDate": new Date(game.date).toISOString(),
                                        "location": {
                                            "@type": "Place",
                                            "name": "Roblox Volleyball League"
                                        },
                                        "organizer": {
                                            "@type": "SportsOrganization",
                                            "name": "Roblox Volleyball League",
                                            "url": "https://volleyball4-2.com"
                                        },
                                        "competitor": [
                                            {
                                                "@type": "SportsTeam",
                                                "name": team1.name,
                                                "score": game.team1Score
                                            },
                                            {
                                                "@type": "SportsTeam",
                                                "name": team2.name,
                                                "score": game.team2Score
                                            }
                                        ],
                                        "sport": "Volleyball",
                                        "season": {
                                            "@type": "SportsSeason",
                                            "name": `Season ${game.season.seasonNumber}`,
                                            "seasonNumber": game.season.seasonNumber
                                        }
                                    }}
                                />

                                {/* Game title */}
                                <h1 className="game-title">{game.name}</h1>

                                <div className="game-stage-block">
                                    <h1 className="game-stage">{game.stage}</h1>
                                </div>

                                {/* Metadata */}
                                <div className="meta-block">
                                    <p className="season-info">
                                        <i className="fas fa-layer-group"></i> Season {game.season.seasonNumber}
                                    </p>
                                    <p className="sets-played">
                                        <i className="fas fa-volleyball-ball"></i> Total Sets Played {totalSets}
                                    </p>
                                    {
                                        game.videoUrl
                                        ? <p className="game-video">
                                            <i className="fas fa-video"></i> Video: <a href={game.videoUrl} target="_blank" rel="noopener noreferrer">Watch Here</a>
                                        </p>
                                        : <p className="game-video">
                                            <i className="fas fa-video-slash"></i> No Video Found
                                        </p>
                                    }
                                    <p className="game-date">
                                        <i className="fas fa-calendar-alt"></i> {formattedDate}
                                    </p>
                                </div>

                                
                                {/* Divider */}
                                <hr className="meta-divider" />

                                {/* Scoreboard */}
                                <div className="scoreboard">
                                    <div className="team-column">
                                        <div className="team-score">{game.team1Score}</div>
                                        <div className="single-game-team-name">{team1.name}</div>
                                    </div>
                                    <div className="vs">vs</div>
                                    <div className="team-column">
                                        <div className="team-score">{game.team2Score}</div>
                                        <div className="single-game-team-name">{team2.name}</div>
                                    </div>
                                </div>


                                {/* Player statistics */}
                                {
                                    hasStats
                                        ? (
                                            <section className="stats-section">
                                                {/* Section title */}
                                                <h2 className="stats-title">Player Statistics</h2>
                                                <div className="stats-scroll">
                                                    <Table
                                                        columns={statsColumns}
                                                        rows={allStats}
                                                        rowKey={(row) => row.id}
                                                    />
                                                </div>
                                            </section>
                                        )
                                        : <p className="no-stats">No statistics have been recorded for this game.</p>
                                }
                            </>
                        )
                    })()}
                </>
            )}
        </div>
    )
}

// Export component
export default SingleGame