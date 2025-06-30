// src/pages/SingleTeam.tsx
import React, { useState }                           from 'react';
import { useParams, Link }                           from 'react-router-dom';
import { Player, Stats, Game, Team }                 from '../../types/interfaces';
import { useSingleTeam }                             from '../../hooks/allFetch';
import "../../styles/SingleTeam.css";
import SEO from "../SEO";

const SingleTeam: React.FC = () =>
{
    // Extract and normalize teamName from the URL
    const { teamName } = useParams<{ teamName: string }>();
    const formattedTeamName = teamName?.replace(/-/g, ' ').toLowerCase() || '';

    // Fetch team with games.stats (each stat has playerId)
    const { data: teamArray, loading, error } = useSingleTeam(formattedTeamName);

    // Local state for toggles
    const [ showPlayers,    setShowPlayers ]    = useState(false);
    const [ showGames,      setShowGames ]      = useState(false);
    const [ showTeamTotals, setShowTeamTotals ] = useState(false);

    // Loading state with skeleton
    if ( loading )
    {
        return (
            <div className="team-details loading">
                <div className="team-skeleton">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-info"></div>
                    <div className="skeleton-info"></div>
                    <div className="skeleton-info"></div>
                </div>
                
                <div className="players-list">
                    <div className="skeleton-section-title"></div>
                    <div className="skeleton-button"></div>
                    <div className="skeleton-players">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton-player-item"></div>
                        ))}
                    </div>
                </div>
                
                <div className="games-section">
                    <div className="skeleton-section-title"></div>
                    <div className="skeleton-button"></div>
                    <div className="skeleton-games">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton-game-card"></div>
                        ))}
                    </div>
                </div>
                
                <div className="team-totals">
                    <div className="skeleton-section-title"></div>
                    <div className="skeleton-button"></div>
                    <div className="skeleton-totals"></div>
                </div>
            </div>
        );
    }

    if ( error )
    {
        return <p>{error}</p>;
    }

    if ( !teamArray || teamArray.length === 0 )
    {
        return <p>Team not found.</p>;
    }

    // There should only be one
    const team: Team = teamArray[0];

    // Flatten all game.stats and keep only those whose playerId matches this team's roster
    const allStats: Stats[] = (team.games
        ?.flatMap((game: Game) => game.stats)
        .filter((stat: Stats | undefined): stat is Stats =>
            Boolean(stat && team.players?.some((p: Player) => p.id === stat.playerId))
        ) || []) as Stats[];

    // Compute overall team totals from allStats
    const teamTotals = allStats.reduce((totals, stat) =>
    {
        totals.spikeAttempts   += stat.spikeAttempts;
        totals.spikeKills      += stat.spikeKills;
        totals.spikingErrors   += stat.spikingErrors;
        totals.apeAttempts     += stat.apeAttempts;
        totals.apeKills        += stat.apeKills;
        totals.assists         += stat.assists;
        totals.settingErrors   += stat.settingErrors;
        totals.blocks          += stat.blocks;
        totals.digs            += stat.digs;
        totals.blockFollows    += stat.blockFollows;
        totals.aces            += stat.aces;
        totals.servingErrors   += stat.servingErrors;
        totals.miscErrors      += stat.miscErrors;
        return totals;
    }, {
        spikeAttempts: 0,
        spikeKills:    0,
        spikingErrors: 0,
        apeAttempts:   0,
        apeKills:      0,
        assists:       0,
        settingErrors: 0,
        blocks:        0,
        digs:          0,
        blockFollows:  0,
        aces:          0,
        servingErrors: 0,
        miscErrors:    0
    });

    // Group stats by playerId for per-player display
    const statsByPlayer: Record<number, Stats[]> = allStats.reduce((map, stat) =>
    {
        if ( !map[stat.playerId] ) map[stat.playerId] = [];
        map[stat.playerId].push(stat);
        return map;
    }, {} as Record<number, Stats[]>);

    return (
        <div className="team-details">
            {/* SEO Meta Tags for Social Media Embedding */}
            {team && (
                <SEO
                    title={`${team.name} - Team Profile`}
                    description={`${team.name} finished ${team.placement} in Season ${team.season.seasonNumber} of the Roblox Volleyball League. View team stats, players, and game results.`}
                    image="https://volleyball4-2.com/rvlLogo.png"
                    url={`https://volleyball4-2.com/teams/${encodeURIComponent(team.name.toLowerCase().replace(/\s+/g, "-"))}`}
                    type="sports_event"
                    structuredData={{
                        "@context": "https://schema.org",
                        "@type": "SportsTeam",
                        "name": team.name,
                        "description": `${team.name} finished ${team.placement} in Season ${team.season.seasonNumber}`,
                        "url": `https://volleyball4-2.com/teams/${encodeURIComponent(team.name.toLowerCase().replace(/\s+/g, "-"))}`,
                        "sport": "Volleyball",
                        "league": {
                            "@type": "SportsOrganization",
                            "name": "Roblox Volleyball League",
                            "url": "https://volleyball4-2.com"
                        },
                        "season": {
                            "@type": "SportsSeason",
                            "name": `Season ${team.season.seasonNumber}`,
                            "seasonNumber": team.season.seasonNumber
                        },
                        "athlete": team.players?.map(player => ({
                            "@type": "Person",
                            "name": player.name,
                            "jobTitle": player.position,
                            "url": `https://volleyball4-2.com/players/${player.id}`
                        })) || [],
                        "location": {
                            "@type": "Place",
                            "name": "Roblox Volleyball League"
                        }
                    }}
                />
            )}

            {/* Team Header */}
            <h1 className="team-title">{team.name}</h1>
            <p>Season: {team.season.seasonNumber ?? 'N/A'}</p>
            <p>Playoff Games Played: {team.games?.length ?? 0}</p>
            <p>Placement: {team.placement}</p>

            {/* Players Section */}
            <div className="players-list">
                <h2>Players</h2>
                <button
                    className="toggle-button"
                    onClick={() => setShowPlayers(prev => !prev)}
                >
                    {showPlayers ? 'Hide Players' : 'Show Players'}
                </button>

                {showPlayers && (
                    <ul>
                        {team.players?.map((player: Player) =>
                        {
                            // Gather this player's stats
                            const statsForPlayer = statsByPlayer[player.id] || [];
                            const combined = statsForPlayer.reduce((tot, stat) =>
                            {
                                tot.spikeAttempts   += stat.spikeAttempts;
                                tot.spikeKills      += stat.spikeKills;
                                tot.spikingErrors   += stat.spikingErrors;
                                tot.apeAttempts     += stat.apeAttempts;
                                tot.apeKills        += stat.apeKills;
                                tot.assists         += stat.assists;
                                tot.settingErrors   += stat.settingErrors;
                                tot.blocks          += stat.blocks;
                                tot.digs            += stat.digs;
                                tot.blockFollows    += stat.blockFollows;
                                tot.aces            += stat.aces;
                                tot.servingErrors   += stat.servingErrors;
                                tot.miscErrors      += stat.miscErrors;
                                return tot;
                            }, {
                                spikeAttempts: 0,
                                spikeKills:    0,
                                spikingErrors: 0,
                                apeAttempts:   0,
                                apeKills:      0,
                                assists:       0,
                                settingErrors: 0,
                                blocks:        0,
                                digs:          0,
                                blockFollows:  0,
                                aces:          0,
                                servingErrors: 0,
                                miscErrors:    0
                            });

                            return (
                                <li key={player.id}>
                                    <details>
                                        <summary className="team-player-summary">
                                            <strong>{player.name}</strong> — Position: {player.position}
                                        </summary>

                                        {statsForPlayer.length > 0 ? (
                                            <div className="player-stats">

                                                {/* Row 1: Spike metrics */}
                                                <div className="stat-row">
                                                    <div className="stat-item">
                                                        <span>Spike Kills:</span><span>{combined.spikeKills}</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span>Spike Attempts:</span><span>{combined.spikeAttempts}</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span>Spiking Errors:</span><span>{combined.spikingErrors}</span>
                                                    </div>
                                                </div>

                                                {/* Row 2: Ape metrics */}
                                                <div className="stat-row">
                                                    <div className="stat-item">
                                                        <span>Ape Kills:</span><span>{combined.apeKills}</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span>Ape Attempts:</span><span>{combined.apeAttempts}</span>
                                                    </div>
                                                </div>

                                                {/* Row 3: Defense metrics */}
                                                <div className="stat-row">
                                                    <div className="stat-item">
                                                        <span>Digs:</span><span>{combined.digs}</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span>Block Follows:</span><span>{combined.blockFollows}</span>
                                                    </div>
                                                </div>

                                                {/* Row 4: Setup & blocks */}
                                                <div className="stat-row">
                                                    <div className="stat-item">
                                                        <span>Assists:</span><span>{combined.assists}</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span>Setting Errors:</span><span>{combined.settingErrors}</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span>Blocks:</span><span>{combined.blocks}</span>
                                                    </div>
                                                </div>

                                                {/* Row 5: Serving & misc */}
                                                <div className="stat-row">
                                                    <div className="stat-item">
                                                        <span>Aces:</span><span>{combined.aces}</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span>Serving Errors:</span><span>{combined.servingErrors}</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span>Misc Errors:</span><span>{combined.miscErrors}</span>
                                                    </div>
                                                </div>

                                            </div>
                                        ) : (
                                            <div className="player-stats">
                                                <p>No stats available for this player</p>
                                            </div>
                                        )}

                                    </details>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Games Section */}
            <div className="games-section">
                <h2>Games</h2>
                <button
                    className="toggle-button"
                    onClick={() => setShowGames(prev => !prev)}
                >
                    {showGames ? 'Hide Games' : 'Show Games'}
                </button>

                {showGames && (
                    team.games && team.games.length > 0 ? (
                        <div className="games-scroll-container">
                            {team.games.map((game: Game) => (
                                <Link
                                    key={game.id}
                                    to={`/games/${game.id}`}
                                    className="game-card-single-team"
                                >
                                    <p><strong>{game.name}</strong></p>
                                    <p><strong>Date:</strong> {new Date(game.date).toLocaleDateString()}</p>
                                    <p><strong>Score:</strong> {game.team1Score} - {game.team2Score}</p>
                                    <p><strong>Season:</strong> {team.season?.seasonNumber ?? "N/A"}</p>
                                    <p><strong>Stage: </strong> {game.stage}</p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p>No playoff games found.</p>
                    )
                )}
            </div>


            {/* Team Totals Section */}
            <div className="team-totals">
                <h2>Team Totals</h2>
                <button
                    className="toggle-button"
                    onClick={() => setShowTeamTotals(prev => !prev)}
                >
                    {showTeamTotals ? 'Hide Team Totals' : 'Show Team Totals'}
                </button>

                {showTeamTotals && (
                    allStats.length > 0 ? (
                        <div className="totals-columns">
                            <div className="totals-column">
                                <div className="totals-item">
                                    <strong>Spike Kills:</strong> {teamTotals.spikeKills}
                                </div>
                                <div className="totals-item">
                                    <strong>Spike Attempts:</strong> {teamTotals.spikeAttempts}
                                </div>
                                <div className="totals-item">
                                    <strong>Spike %:</strong> {teamTotals.spikeAttempts > 0 ? ((teamTotals.spikeKills / teamTotals.spikeAttempts) * 100).toFixed(1) : '0.0'}%
                                </div>
                                <div className="totals-item">
                                    <strong>Ape Kills:</strong> {teamTotals.apeKills}
                                </div>
                                <div className="totals-item">
                                    <strong>Ape Attempts:</strong> {teamTotals.apeAttempts}
                                </div>
                                <div className="totals-item">
                                    <strong>Spiking Errors:</strong> {teamTotals.spikingErrors}
                                </div>
                                <div className="totals-item">
                                    <strong>Misc Errors:</strong> {teamTotals.miscErrors}
                                </div>
                            </div>
                            <div className="totals-column">
                                <div className="totals-item">
                                    <strong>Assists:</strong> {teamTotals.assists}
                                </div>
                                <div className="totals-item">
                                    <strong>Blocks:</strong> {teamTotals.blocks}
                                </div>
                                <div className="totals-item">
                                    <strong>Digs:</strong> {teamTotals.digs}
                                </div>
                                <div className="totals-item">
                                    <strong>Aces:</strong> {teamTotals.aces}
                                </div>
                                <div className="totals-item">
                                    <strong>Serving Errors:</strong> {teamTotals.servingErrors}
                                </div>
                                <div className="totals-item">
                                    <strong>Block Follows:</strong> {teamTotals.blockFollows}
                                </div>
                                <div className="totals-item">
                                    <strong>Setting Errors:</strong> {teamTotals.settingErrors}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p>No stats recorded for this team yet.</p>
                    )
                )}
            </div>

        </div>
    );
};

export default SingleTeam;