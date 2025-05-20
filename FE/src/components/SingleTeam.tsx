import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom'; // Import Link here
import { Player, Stats, Game } from '../types/interfaces'; // Adjust path if needed
import { useSingleTeam } from '../hooks/allFetch'; // Adjust path if needed
import "../styles/SingleTeam.css";

// Component to show a single team's details
const SingleTeam: React.FC = () =>
{
    // Extract team name from the URL
    const { teamName } = useParams<{ teamName: string }>();

    const formattedTeamName = teamName?.replace(/-/g, ' ').toLowerCase();
    console.log(formattedTeamName);

    // Use the custom hook to fetch team data
    const { data: teamArray, loading, error } = useSingleTeam(formattedTeamName || "");

    // Collapsible section states (set to false for collapsed by default)
    const [showPlayers, setShowPlayers] = useState(false); // Start collapsed
    const [showGames, setShowGames] = useState(false); // Start collapsed
    const [showTeamTotals, setShowTeamTotals] = useState(false); // Start collapsed for Team Totals

    // Loading state
    if (loading)
    {
        return <p>Loading team...</p>;
    }

    // Error state
    if (error)
    {
        return <p>{error}</p>;
    }

    // Not found
    if (!teamArray || teamArray.length === 0)
    {
        return <p>Team not found.</p>;
    }

    // Extract the team object from the array
    const team = teamArray[0]; // Assuming there's only one team in the array

    // Calculate team totals from player stats
    const teamTotals = team.players?.reduce((totals: any, player: Player) =>
    {
        if (player.stats)
        {
            player.stats.forEach((stat: Stats) =>
            {
                totals.spikeAttempts += stat.spikeAttempts || 0;
                totals.spikeKills += stat.spikeKills || 0;
                totals.assists += stat.assists || 0;
                totals.blocks += stat.blocks || 0;
                totals.digs += stat.digs || 0;
                totals.aces += stat.aces || 0;
                totals.errors += stat.serveErrors || 0;
                totals.miscErrors += stat.miscErrors || 0;
                totals.blockFollows += stat.blockFollows || 0;
                totals.apeKills += stat.apeKills || 0;
                totals.apeAttempts += stat.apeAttempts || 0;
                totals.spikingErrors += stat.spikingErrors || 0;
            });
        }
        return totals;
    }, {
        spikeAttempts: 0,
        spikeKills: 0,
        assists: 0,
        blocks: 0,
        digs: 0,
        aces: 0,
        serveErrors: 0,
        miscErrors: 0,
        blockFollows: 0,
        apeKills: 0,
        apeAttempts: 0,
        spikingErrors: 0
    });

    return (
        <div className="team-details">
            <h1 className="team-title">{team.name}</h1>
            <p>Season: {team.season?.seasonNumber ?? 'N/A'}</p>
            <p>Playoff Games Played: {team.games?.length ?? 0}</p>
            <p>Placement: {team.placement}</p>

            {/* Players Section */}
            {team.players && team.players.length > 0 ? (
                <div className="players-list">
                    <h2>Players</h2>
                    <button className="toggle-button" onClick={() => setShowPlayers(prev => !prev)}>
                        {showPlayers ? 'Hide Players' : 'Show Players'}
                    </button>

                    {showPlayers && (
                        <ul>
                            {team.players.map((player: Player) => (
                                <li key={player.id}>
                                    <div className="player-info">
                                        <div>
                                            <strong>{player.name}</strong> — Position: {player.position ?? 'N/A'}
                                        </div>
                                        {player.stats && player.stats.length > 0 ? (
                                            <div className="player-stats">
                                                {player.stats.map((stat: Stats, index: number) => (
                                                    <React.Fragment key={index}>
                                                        <div className="stat-item"><span>Spiking Errors:</span><span>{stat.spikingErrors}</span></div>
                                                        <div className="stat-item"><span>Ape Kills:</span><span>{stat.apeKills}</span></div>
                                                        <div className="stat-item"><span>Ape Attempts:</span><span>{stat.apeAttempts}</span></div>
                                                        <div className="stat-item"><span>Spike Kills:</span><span>{stat.spikeKills}</span></div>
                                                        <div className="stat-item"><span>Spike Attempts:</span><span>{stat.spikeAttempts}</span></div>
                                                        <div className="stat-item"><span>Assists:</span><span>{stat.assists}</span></div>
                                                        <div className="stat-item"><span>Blocks:</span><span>{stat.blocks}</span></div>
                                                        <div className="stat-item"><span>Digs:</span><span>{stat.digs}</span></div>
                                                        <div className="stat-item"><span>Block Follows:</span><span>{stat.blockFollows}</span></div>
                                                        <div className="stat-item"><span>Aces:</span><span>{stat.aces}</span></div>
                                                        <div className="stat-item"><span>Misc Errors:</span><span>{stat.miscErrors}</span></div>
                                                        <div className="stat-item"><span>Errors:</span><span>{stat.serveErrors}</span></div>
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="player-stats">
                                                <p>No stats available</p>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : (
                <p>No players available for this team.</p>
            )}

            {/* Games Section */}
            <div className="games-section">
                <h2>Games</h2>
                <button className="toggle-button" onClick={() => setShowGames(prev => !prev)}>
                    {showGames ? 'Hide Games' : 'Show Games'}
                </button>

                {showGames && (
                    <div className="games-scroll-container">
                        {team.games && team.games.length > 0 ? (
                            team.games.map((game: Game) => (
                                <Link key={game.id} to={`/games/${game.id}`} className="game-card-single-team">
                                    <p><strong>{game.name}</strong></p>
                                    <p><strong>Date:</strong> {new Date(game.date).toLocaleDateString()}</p>
                                    <p><strong>Score:</strong> {game.team1Score} - {game.team2Score}</p>
                                    <p><strong>Season:</strong> {game.season?.seasonNumber ?? "N/A"}</p>
                                </Link>
                            ))
                        ) : (
                            <p>No games available</p>
                        )}
                    </div>
                )}
            </div>

            {/* Team Totals Section */}
            {team.players && team.players.length > 0 && (
                <div className="team-totals">
                    <h2>Team Totals</h2>
                    <button className="toggle-button" onClick={() => setShowTeamTotals(prev => !prev)}>
                        {showTeamTotals ? 'Hide Team Totals' : 'Show Team Totals'}
                    </button>

                    {showTeamTotals && (
                        <div className="totals-columns">
                            {/* Left Column */}
                            <div className="totals-column">
                                <div className="totals-item"><strong>Spike Kills:</strong> {teamTotals.spikeKills}</div>
                                <div className="totals-item"><strong>Spike Attempts:</strong> {teamTotals.spikeAttempts}</div>
                                <div className="totals-item"><strong>Ape Kills:</strong> {teamTotals.apeKills}</div>
                                <div className="totals-item"><strong>Ape Attempts:</strong> {teamTotals.apeAttempts}</div>
                                <div className="totals-item"><strong>Spiking Errors:</strong> {teamTotals.spikingErrors}</div>
                                <div className="totals-item"><strong>Misc Errors:</strong> {teamTotals.miscErrors}</div>
                            </div>

                            {/* Right Column */}
                            <div className="totals-column">
                                <div className="totals-item"><strong>Assists:</strong> {teamTotals.assists}</div>
                                <div className="totals-item"><strong>Blocks:</strong> {teamTotals.blocks}</div>
                                <div className="totals-item"><strong>Digs:</strong> {teamTotals.digs}</div>
                                <div className="totals-item"><strong>Aces:</strong> {teamTotals.aces}</div>
                                <div className="totals-item"><strong>Errors:</strong> {teamTotals.serveErrors}</div>
                                <div className="totals-item"><strong>Block Follows:</strong> {teamTotals.blockFollows}</div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SingleTeam;
