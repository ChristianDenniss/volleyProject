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

    // Fetch data
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

    // Guard
    if (!data)
    {
        return <div className="single-game-container">No data found.</div>
    }

    // Normalize into Game[]
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

    // Render
    return (
        <div className="single-game-container">
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
                    <div className="team-name">{team1.name}</div>
                </div>
                <div className="vs">vs</div>
                <div className="team-column">
                    <div className="team-score">{game.team2Score}</div>
                    <div className="team-name">{team2.name}</div>
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
                                <table className="stats-table">
                                    <thead>
                                        <tr>
                                            <th>Player</th>
                                            <th>Spike Kills</th>
                                            <th>Spike Attempts</th>
                                            <th>Ape Kills</th>
                                            <th>Ape Attempts</th>
                                            <th>Spiking Errors</th>
                                            <th>Digs</th>
                                            <th>Block Follows</th>
                                            <th>Blocks</th>
                                            <th>Assists</th>
                                            <th>Setting Errors</th>
                                            <th>Aces</th>
                                            <th>Serve Errors</th>
                                            <th>Misc Errors</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Team 1 rows */}
                                        {team1Stats.map(s =>
                                            <tr key={`t1-${s.id}`}>
                                                <td>{s.player.name}</td>
                                                <td>{s.spikeKills}</td>
                                                <td>{s.spikeAttempts}</td>
                                                <td>{s.apeKills}</td>
                                                <td>{s.apeAttempts}</td>
                                                <td>{s.spikingErrors}</td>
                                                <td>{s.digs}</td>
                                                <td>{s.blockFollows}</td>
                                                <td>{s.blocks}</td>
                                                <td>{s.assists}</td>
                                                <td>{s.settingErrors}</td>
                                                <td>{s.aces}</td>
                                                <td>{s.servingErrors}</td>
                                                <td>{s.miscErrors}</td>
                                            </tr>
                                        )}

                                        {/* Separator for Team 2 */}
                                        <tr className="team-separator">
                                            <td colSpan={14}></td>
                                        </tr>

                                        {/* Team 2 rows */}
                                        {team2Stats.map(s =>
                                            <tr key={`t2-${s.id}`} className="team2-row">
                                                <td>{s.player.name}</td>
                                                <td>{s.spikeKills}</td>
                                                <td>{s.spikeAttempts}</td>
                                                <td>{s.apeKills}</td>
                                                <td>{s.apeAttempts}</td>
                                                <td>{s.spikingErrors}</td>
                                                <td>{s.digs}</td>
                                                <td>{s.blockFollows}</td>
                                                <td>{s.blocks}</td>
                                                <td>{s.assists}</td>
                                                <td>{s.settingErrors}</td>
                                                <td>{s.aces}</td>
                                                <td>{s.servingErrors}</td>
                                                <td>{s.miscErrors}</td>
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
export default SingleGame