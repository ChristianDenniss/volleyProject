// src/pages/SingleTeam.tsx
import React, { useState }                           from 'react';
import { useParams, Link }                           from 'react-router-dom';
import { Player, Stats, Game, Team }                 from '../../types/interfaces';
import { useSingleTeam }                             from '../../hooks/allFetch';
import "../../styles/SingleTeam.css";
import SEO from "../SEO";
import { formatGameStage } from "../../utils/gameLabels";
import TeamStaffEdit from "../TeamStaffEdit";

/* The second .team-details rule overrode contain from `layout style paint`
   to `layout style`. content-visibility from the first rule still applies. */
const teamDetails =
    "[font-family:'Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] my-[40px] mx-auto p-[20px] " +
    "text-text capitalize max-w-[1600px] w-[90%] box-border min-h-screen " +
    "[contain:layout_style] [content-visibility:auto] " +
    "upto-md:min-h-[80vh] " +
    "[&_p]:text-[1.4rem] [&_p]:text-center [&_p]:mb-[10px] [&_p]:min-h-[2rem] [&_p]:text-text-muted"

const teamTitleContainer =
    "flex items-center justify-center gap-[1rem] mb-[30px]"

const teamLogoInline =
    "w-[80px] h-[80px] object-contain upto-md:w-[60px] upto-md:h-[60px]"

const teamLogoMirrored = `${teamLogoInline} [transform:scaleX(-1)]`

const teamTitle =
    "text-center text-[3rem] font-extrabold text-brand-primary mb-[30px] min-h-[4rem]"

const sectionHeading =
    "text-[2rem] mt-[30px] mx-0 mb-[15px] text-brand-primary border-b-[3px] border-b-brand-primary " +
    "pb-[8px] tracking-[1px] min-h-[3rem]"

const toggleButton =
    "bg-brand-primary text-text-on-brand border border-brand-primary text-[1rem] " +
    "py-[10px] px-[15px] mb-[20px] cursor-pointer rounded-sm " +
    "transition-[background-color,border-color] duration-200 ease-[ease] " +
    "min-h-[2.5rem] min-w-[120px] " +
    "hover:bg-brand-primary-hover hover:border-brand-primary-hover"

const totalsToggleButton = `${toggleButton} mt-[10px] mr-0 mb-[20px] ml-0`

const gamesSection = "mt-[40px] min-h-[200px]"

const gamesScroll =
    "flex overflow-x-auto gap-[16px] py-[12px] px-0 min-h-[300px] [contain:layout_style] " +
    "upto-md:min-h-[250px]"

/* Card p rules beat .team-details p (same specificity, later source).
   Important is how those winners are picked now that both are utilities. */
const gameCard =
    "min-w-[270px] max-w-[270px] min-h-[250px] bg-bg border border-accent-border " +
    "py-[14px] px-[12px] rounded-lg shadow-sm shrink-0 flex flex-col " +
    "[transition:transform_0.2s_ease-in-out,border-color_0.2s_ease,box-shadow_0.2s_ease] " +
    "text-left no-underline text-inherit box-border justify-start " +
    "[will-change:transform] [transform:translateZ(0)] [backface-visibility:hidden] [contain:layout_style] " +
    "hover:[transform:translateY(-3px)] hover:border-brand-primary hover:shadow-md " +
    "[&_p]:my-[6px]! [&_p]:mx-0! [&_p]:text-[18px]! [&_p]:text-text! [&_p]:text-left! " +
    "[&_p]:whitespace-normal! [&_p]:break-words [&_p]:block [&_p]:w-full [&_p]:min-h-[1.5rem]! " +
    "[&_p:first-child]:text-[1.1em]! [&_p:first-child]:mb-[30px]! " +
    "[&_p:first-child]:text-brand-primary! [&_p:first-child]:min-h-[2rem]!"

const teamTotalsSection = "mt-[40px] min-h-[200px] upto-md:min-h-[250px]"

const totalsColumns =
    "flex gap-[4rem] mt-[1rem] flex-wrap w-full justify-start min-h-[200px]"

const totalsColumn =
    "flex-1 min-w-[45%] bg-bg border border-accent-border p-[25px] rounded-md shadow-sm " +
    "mb-[1rem] box-border min-h-[150px]"

const totalsItem =
    "flex justify-between items-center py-[12px] px-0 border-b border-b-dashed border-b-border " +
    "min-h-[2rem] text-text last:[border-bottom:none] " +
    "[&_strong]:font-bold [&_strong]:text-[1.2rem] [&_strong]:text-text [&_strong]:mr-[1rem] [&_strong]:whitespace-nowrap"

const playersList =
    "min-h-[200px] upto-md:min-h-[300px] " +
    "[&_li]:list-none [&_li]:mt-0 [&_li]:mx-0 [&_li]:mb-[20px] [&_li]:min-h-[40px]"

const playerDetails =
    "bg-bg border border-accent-border border-l-[6px]! border-l-brand-primary! rounded-md " +
    "shadow-sm overflow-hidden min-h-[40px] [contain:layout_style]"

const playerStats =
    "bg-bg-light p-[15px] border-t border-t-accent-border rounded-bl-md rounded-br-md " +
    "m-0 flex flex-col gap-[0.5rem] min-h-[200px]"

/* grid-cols-3 is 3× minmax(0,1fr); the original is repeat(3, 1fr). */
const statRow =
    "grid grid-cols-[repeat(3,1fr)] gap-x-[2rem] items-center " +
    "border-b border-b-dashed border-b-border py-[6px] px-0 w-full min-h-[2rem] last:[border-bottom:none]"

const statItem =
    "flex justify-between w-full min-h-[1.5rem] " +
    "[&_span]:text-[1.2rem] [&_span]:text-text " +
    "[&_span:last-child]:font-bold [&_span:last-child]:text-brand-primary"

const teamSkeleton = "mb-[40px]"

const skeletonSweep =
    "bg-[image:var(--skeleton-shimmer)] bg-[length:200%_100%] animate-skeleton-sweep"

const skeletonTitle =
    `${skeletonSweep} rounded-md h-[4rem] mb-[20px] w-[60%] mx-auto upto-md:w-[80%]`
const skeletonInfo =
    `${skeletonSweep} rounded-md h-[2rem] mb-[10px] w-[40%] mx-auto upto-md:w-[60%]`
const skeletonSectionTitle =
    `${skeletonSweep} rounded-md h-[3rem] mb-[15px] w-[30%] upto-md:w-[50%]`
const skeletonButton =
    `${skeletonSweep} rounded-sm h-[2.5rem] mb-[20px] w-[120px]`
const skeletonPlayers = "flex flex-col gap-[20px]"
const skeletonPlayerItem = `${skeletonSweep} rounded-md h-[60px] w-full`
const skeletonGames = "flex gap-[16px] overflow-x-auto py-[12px] px-0"
const skeletonGameCard = `${skeletonSweep} rounded-lg h-[250px] w-[270px] shrink-0`
const skeletonTotals = `${skeletonSweep} rounded-md h-[200px] w-full`

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
            <div className={`${teamDetails} opacity-80 pointer-events-none`}>
                <div className={teamSkeleton}>
                    <div className={skeletonTitle}></div>
                    <div className={skeletonInfo}></div>
                    <div className={skeletonInfo}></div>
                    <div className={skeletonInfo}></div>
                </div>
                
                <div className={playersList}>
                    <div className={skeletonSectionTitle}></div>
                    <div className={skeletonButton}></div>
                    <div className={skeletonPlayers}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className={skeletonPlayerItem}></div>
                        ))}
                    </div>
                </div>
                
                <div className={gamesSection}>
                    <div className={skeletonSectionTitle}></div>
                    <div className={skeletonButton}></div>
                    <div className={skeletonGames}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className={skeletonGameCard}></div>
                        ))}
                    </div>
                </div>
                
                <div className={teamTotalsSection}>
                    <div className={skeletonSectionTitle}></div>
                    <div className={skeletonButton}></div>
                    <div className={skeletonTotals}></div>
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
        <div className={teamDetails}>
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
            <div className={teamTitleContainer}>
                {team.logoUrl && (
                    <img
                        src={team.logoUrl}
                        alt={`${team.name} logo`}
                        className={teamLogoInline}
                    />
                )}
                <h1 className={teamTitle}>{team.name}</h1>
                {team.logoUrl && (
                    <img
                        src={team.logoUrl}
                        alt={`${team.name} logo`}
                        className={teamLogoMirrored}
                    />
                )}
            </div>
            <p>Season: {team.season.seasonNumber ?? 'N/A'}</p>
            <p>Playoff Games Played: {team.games?.length ?? 0}</p>
            <p>Placement: {team.placement}</p>

            <TeamStaffEdit team={team} />

            {/* Players Section */}
            <div className={playersList}>
                <h2 className={sectionHeading}>Players</h2>
                <button
                    className={toggleButton}
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
                                    <details className={playerDetails}>
                                        <summary className="team-player-summary">
                                            <strong>{player.name}</strong> — Position: {player.position}
                                        </summary>

                                        {statsForPlayer.length > 0 ? (
                                            <div className={playerStats}>

                                                {/* Row 1: Spike metrics */}
                                                <div className={statRow}>
                                                    <div className={statItem}>
                                                        <span>Spike Kills:</span><span>{combined.spikeKills}</span>
                                                    </div>
                                                    <div className={statItem}>
                                                        <span>Spike Attempts:</span><span>{combined.spikeAttempts}</span>
                                                    </div>
                                                    <div className={statItem}>
                                                        <span>Spiking Errors:</span><span>{combined.spikingErrors}</span>
                                                    </div>
                                                </div>

                                                {/* Row 2: Ape metrics */}
                                                <div className={statRow}>
                                                    <div className={statItem}>
                                                        <span>Ape Kills:</span><span>{combined.apeKills}</span>
                                                    </div>
                                                    <div className={statItem}>
                                                        <span>Ape Attempts:</span><span>{combined.apeAttempts}</span>
                                                    </div>
                                                </div>

                                                {/* Row 3: Defense metrics */}
                                                <div className={statRow}>
                                                    <div className={statItem}>
                                                        <span>Digs:</span><span>{combined.digs}</span>
                                                    </div>
                                                    <div className={statItem}>
                                                        <span>Block Follows:</span><span>{combined.blockFollows}</span>
                                                    </div>
                                                </div>

                                                {/* Row 4: Setup & blocks */}
                                                <div className={statRow}>
                                                    <div className={statItem}>
                                                        <span>Assists:</span><span>{combined.assists}</span>
                                                    </div>
                                                    <div className={statItem}>
                                                        <span>Setting Errors:</span><span>{combined.settingErrors}</span>
                                                    </div>
                                                    <div className={statItem}>
                                                        <span>Blocks:</span><span>{combined.blocks}</span>
                                                    </div>
                                                </div>

                                                {/* Row 5: Serving & misc */}
                                                <div className={statRow}>
                                                    <div className={statItem}>
                                                        <span>Aces:</span><span>{combined.aces}</span>
                                                    </div>
                                                    <div className={statItem}>
                                                        <span>Serving Errors:</span><span>{combined.servingErrors}</span>
                                                    </div>
                                                    <div className={statItem}>
                                                        <span>Misc Errors:</span><span>{combined.miscErrors}</span>
                                                    </div>
                                                </div>

                                            </div>
                                        ) : (
                                            <div className={playerStats}>
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
            <div className={gamesSection}>
                <h2 className={sectionHeading}>Games</h2>
                <button
                    className={toggleButton}
                    onClick={() => setShowGames(prev => !prev)}
                >
                    {showGames ? 'Hide Games' : 'Show Games'}
                </button>

                {showGames && (
                    team.games && team.games.length > 0 ? (
                        <div className={gamesScroll}>
                            {team.games.map((game: Game) => (
                                <Link
                                    key={game.id}
                                    to={`/games/${game.id}`}
                                    className={gameCard}
                                >
                                    <p><strong>{game.name}</strong></p>
                                    <p><strong>Date:</strong> {new Date(game.date).toLocaleDateString()}</p>
                                    <p><strong>Score:</strong> {game.team1Score} - {game.team2Score}</p>
                                    <p><strong>Season:</strong> {team.season?.seasonNumber ?? "N/A"}</p>
                                    <p><strong>Stage: </strong> {formatGameStage(game)}</p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p>No playoff games found.</p>
                    )
                )}
            </div>


            {/* Team Totals Section */}
            <div className={teamTotalsSection}>
                <h2 className={sectionHeading}>Team Totals</h2>
                <button
                    className={totalsToggleButton}
                    onClick={() => setShowTeamTotals(prev => !prev)}
                >
                    {showTeamTotals ? 'Hide Team Totals' : 'Show Team Totals'}
                </button>

                {showTeamTotals && (
                    allStats.length > 0 ? (
                        <div className={totalsColumns}>
                            <div className={totalsColumn}>
                                <div className={totalsItem}>
                                    <strong>Spike Kills:</strong> {teamTotals.spikeKills}
                                </div>
                                <div className={totalsItem}>
                                    <strong>Spike Attempts:</strong> {teamTotals.spikeAttempts}
                                </div>
                                <div className={totalsItem}>
                                    <strong>Spike %:</strong> {teamTotals.spikeAttempts > 0 ? ((teamTotals.spikeKills / teamTotals.spikeAttempts) * 100).toFixed(1) : '0.0'}%
                                </div>
                                <div className={totalsItem}>
                                    <strong>Ape Kills:</strong> {teamTotals.apeKills}
                                </div>
                                <div className={totalsItem}>
                                    <strong>Ape Attempts:</strong> {teamTotals.apeAttempts}
                                </div>
                                <div className={totalsItem}>
                                    <strong>Spiking Errors:</strong> {teamTotals.spikingErrors}
                                </div>
                                <div className={totalsItem}>
                                    <strong>Misc Errors:</strong> {teamTotals.miscErrors}
                                </div>
                            </div>
                            <div className={totalsColumn}>
                                <div className={totalsItem}>
                                    <strong>Assists:</strong> {teamTotals.assists}
                                </div>
                                <div className={totalsItem}>
                                    <strong>Blocks:</strong> {teamTotals.blocks}
                                </div>
                                <div className={totalsItem}>
                                    <strong>Digs:</strong> {teamTotals.digs}
                                </div>
                                <div className={totalsItem}>
                                    <strong>Aces:</strong> {teamTotals.aces}
                                </div>
                                <div className={totalsItem}>
                                    <strong>Serving Errors:</strong> {teamTotals.servingErrors}
                                </div>
                                <div className={totalsItem}>
                                    <strong>Block Follows:</strong> {teamTotals.blockFollows}
                                </div>
                                <div className={totalsItem}>
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
