// Import React
import React from "react"

// Import shared interfaces
import { Game } from "../types/interfaces"

// Import custom fetch hook
import { useSingleGames } from "../hooks/allFetch"

// Import React-Router helper
import { useParams } from "react-router-dom"

// Import styles
import "../styles/SingleGame.css"

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

    // Fetch data (shape is unknown — could be obj / array / wrapper)
    const { data, error } = useSingleGames(id)

    // Loading
    if (!data && !error)
    {
        return <div className="single-game-container">Loading…</div>
    }

    // Error
    if (error)
    {
        return <div className="single-game-container">Error: {error}</div>
    }

    // Guard again
    if (!data)
    {
        return <div className="single-game-container">No data found.</div>
    }

    // ---------- NORMALISE INTO Game[] ----------
    let games: Game[] = []

    // If already an array
    if (Array.isArray(data))
    {
        games = data as Game[]
    }
    // If wrapped as { games: [...] }
    else if (
        typeof data === "object" &&
        data !== null &&
        "games" in data &&
        Array.isArray((data as any).games)
    )
    {
        games = (data as any).games as Game[]
    }
    // Otherwise assume single object
    else
    {
        games = [data as Game]
    }

    // Still nothing usable
    if (games.length === 0)
    {
        return <div className="single-game-container">Game not found.</div>
    }

    // Pick the game matching the URL id
    const numericId = Number(id)
    const game      = games.find(g => g.id === numericId) ?? games[0]

    // Compute total sets
    const totalSets = game.team1Score + game.team2Score

    // ----------- DATA FORMATTERS -----------
    // Friendly date string
    const formattedDate = new Date(game.date).toLocaleDateString(
        undefined,
        { year: "numeric", month: "long", day: "numeric" }
    )

    // Prefer custom title over name
    const displayTitle = game.title ?? game.name

    // Do we have stats rows?
    const hasStats = Array.isArray(game.stats) && game.stats.length > 0

    // ----------- RENDER -----------
    return (
        <div className="single-game-container">
            {/* Game title */}
            <h1 className="game-title">{displayTitle}</h1>

            {/* Metadata block */}
            <div className="meta-block">
                <p className="season-info">Season&nbsp;{game.season.seasonNumber}</p>
                <p className="game-date">{formattedDate}</p>
                <p className="sets-played">Total&nbsp;Sets&nbsp;Played&nbsp;{totalSets}</p>
            </div>

            {/* Divider */}
            <hr className="meta-divider" />

            {/* Scoreboard grid */}
            <div className="scoreboard">
                {/* Team 1 */}
                <div className="team-column">
                    <span className="team-name">{game.teams?.[0]?.name}</span>
                    <span className="team-score">{game.team1Score}</span>
                </div>

                {/* vs */}
                <div className="vs">vs</div>

                {/* Team 2 */}
                <div className="team-column">
                    <span className="team-name">{game.teams?.[1]?.name}</span>
                    <span className="team-score">{game.team2Score}</span>
                </div>
            </div>

            {/* ===== Player statistics ===== */}
            {
                hasStats
                    ? (
                        <section className="stats-section">
                            {/* Section title */}
                            <h2 className="stats-title">Player Statistics</h2>

                            {/* Scroll container so wide tables don’t break mobile */}
                            <div className="stats-scroll">
                                <table className="stats-table">
                                    <thead>
                                        <tr>
                                            <th>Player</th>
                                            <th>Kills</th>
                                            <th>Attempts</th>
                                            <th>Errors</th>
                                            <th>Aces</th>
                                            <th>Blocks</th>
                                            <th>Digs</th>
                                            <th>Assists</th>
                                            <th>Serve&nbsp;Errors</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {game.stats!.map((s, idx) =>
                                            <tr key={idx}>
                                                <td>{s.playerBelongingTo.name}</td>
                                                <td>{s.spikeKills}</td>
                                                <td>{s.spikeAttempts}</td>
                                                <td>{s.spikingErrors}</td>
                                                <td>{s.aces}</td>
                                                <td>{s.blocks}</td>
                                                <td>{s.digs}</td>
                                                <td>{s.assists}</td>
                                                <td>{s.serveErrors}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )
                    : <p className="no-stats">No statistics have been recorded for this game.</p>
            }
        </div>
    )
}

// Export component
export default SingleGame;
