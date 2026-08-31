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

// Import safe-URL check to guard external links
import { isSafeExternalUrl } from "../../utils/url"

// Import SEO component
import SEO from "../SEO"
import { formatGameStage } from "../../utils/gameLabels"

const sgContainer =
    "max-w-[1100px] mx-auto pt-[0.5rem] px-[1.5rem] pb-[5rem] " +
    "[font-family:'Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] text-text min-h-screen box-border " +
    "[contain:layout_style_paint]"

const gameTitle =
    "text-[3.5rem] font-extrabold leading-[1.1] text-center capitalize tracking-[0.5px] " +
    "mt-[3rem] mb-[1.5rem] min-h-[80px] text-brand-primary"

const metaBlock =
    "flex justify-center gap-[1.25rem] flex-wrap mb-[2.25rem] min-h-[60px] " +
    "upto-700:flex-col upto-700:gap-[0.3rem] " +
    "[&_a]:text-brand-primary [&_a]:font-semibold [&_a]:no-underline " +
    "[&_a:hover]:text-brand-primary-hover [&_a:hover]:underline"

const metaText = "m-0 text-[0.975rem] text-text-muted font-semibold no-underline"

const gameStageBlock = "flex justify-center mt-[-1.25rem] mb-[1.5rem] min-h-[40px]"

const gameStage =
    "text-[1.5rem] font-semibold text-brand-primary text-center mt-[2rem]"

const metaDivider =
    "w-[400px] h-[3px] bg-brand-primary border-none mt-0 mx-auto mb-[3rem] opacity-20"

/* grid-cols-3 is 3× minmax(0,1fr). The middle track is auto, matching the original. */
const scoreboard =
    "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center justify-items-center " +
    "gap-x-[3rem] gap-y-[1rem] max-w-[760px] mx-auto mb-[3rem] min-h-[150px] " +
    "upto-700:grid-cols-[1fr] upto-700:gap-[1.1rem]"

const teamColumn =
    "flex flex-col items-center justify-center gap-[0.35rem] w-full text-center"

const teamName =
    "text-[1.5rem] font-bold m-0 capitalize leading-[1.2] max-w-full break-words"

const teamScore =
    "text-[4.2rem] font-extrabold leading-none m-0 tabular-nums upto-700:text-[3.3rem]"

const vsBadge =
    "text-[1.2rem] font-bold text-brand-primary bg-bg-light border border-border " +
    "py-[0.4rem] px-[0.9rem] rounded-[999px] shadow-none self-center upto-700:hidden"

const upcomingNotice =
    "max-w-[640px] mx-auto py-[2rem] px-[1.5rem] rounded-[16px] border border-accent-border " +
    "bg-[linear-gradient(180deg,var(--color-accent-pale)_0%,var(--color-bg-light)_100%)] text-center"

const upcomingNoticeIcon = "text-[2rem] text-brand-primary mb-[0.75rem]"

const upcomingNoticeTitle = "mt-0 mx-0 mb-[0.75rem] text-[1.75rem] text-brand-primary"

const upcomingNoticeText = "m-0 text-[1.05rem] leading-[1.6] text-text-muted"

const statsSection =
    "mt-[4.5rem] min-h-[400px] [content-visibility:auto] [contain-intrinsic-size:400px]"

/* Same as stats-section except the two properties .stats-section-upcoming overrode. */
const statsSectionUpcoming =
    "mt-[3rem] min-h-auto [content-visibility:auto] [contain-intrinsic-size:400px]"

const statsTitle =
    "text-[2.25rem] font-bold text-center text-brand-primary mb-[1.5rem]"

const statsScroll = "overflow-x-auto"

const statsTable =
    "w-full min-w-[960px] border-collapse text-[0.93rem] " +
    "[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:bg-brand-primary [&_thead_th]:text-text-on-brand " +
    "[&_thead_th]:font-semibold [&_thead_th]:py-[0.9rem] [&_thead_th]:px-[1.1rem] [&_thead_th]:text-center " +
    "[&_thead_th]:whitespace-nowrap [&_thead_th]:z-[1] " +
    "[&_tbody_tr]:transition-[background] [&_tbody_tr]:duration-[0.15s] [&_tbody_tr]:ease-[ease] " +
    "[&_td]:py-[0.8rem] [&_td]:px-[1.1rem] [&_td]:text-center [&_td]:whitespace-nowrap " +
    "[&_td]:border-b [&_td]:border-b-solid [&_td]:border-b-table-border"

const team2Row = "even:bg-row-opponent-stripe odd:bg-bg hover:bg-row-opponent-hover!"

const team1Row = "even:bg-row-stripe hover:bg-row-hover!"

const teamSeparator =
    "h-[16px] bg-[var(--color-brand-primary-separator)] " +
    "[&_td]:p-0 [&_td]:h-[16px] [&_td]:border-none"

const noStats = "text-center text-[1.3rem] text-text-muted mt-[1.5rem]"

/* Same sweep as the shared skeleton-sweep keyframes; the page named it `loading`. */
const skeletonSweep =
    "bg-[image:var(--skeleton-shimmer)] bg-[length:200%_100%] animate-skeleton-sweep"

const sgSkeletonTitle = `${skeletonSweep} h-[80px] w-[80%] mx-auto mb-[1.5rem] rounded-[8px]`
const sgSkeletonStage = `${skeletonSweep} h-[40px] w-[200px] mx-auto mb-[1.5rem] rounded-[4px]`
const sgSkeletonMeta = `${skeletonSweep} h-[20px] w-[120px] rounded-[4px]`
const sgSkeletonScoreboard =
    `${skeletonSweep} h-[150px] w-full max-w-[600px] mx-auto mb-[3rem] rounded-[8px]`
const sgSkeletonStatsTitle =
    `${skeletonSweep} h-[50px] w-[300px] mx-auto mb-[1.5rem] rounded-[8px]`
const sgSkeletonStatsTable = `${skeletonSweep} h-[300px] w-full rounded-[8px]`

function getWinningTeamIndex(game: Game): 0 | 1 | null {
    const winnerId = game.winnerTeamId ?? game.winner?.id ?? null

    if (winnerId != null && game.teams?.length) {
        const winnerIndex = game.teams.findIndex(team => team.id === winnerId)
        if (winnerIndex === 0 || winnerIndex === 1) {
            return winnerIndex
        }
    }

    if (game.status !== "completed") {
        return null
    }

    if (game.team1Score != null && game.team2Score != null && game.team1Score !== game.team2Score) {
        return game.team1Score > game.team2Score ? 0 : 1
    }

    return null
}

function getTeamTone(index: 0 | 1, winningTeam: 0 | 1 | null): string {
    if (winningTeam === null) {
        return ""
    }

    return winningTeam === index ? "text-brand-primary" : "text-text-subtle"
}

// Declare component
const SingleGame: React.FC = () =>
{
    // Grab :id from URL
    const { id } = useParams<{ id: string }>()

    // Early-exit when no id
    if (!id)
    {
        return <div className={sgContainer}>URL ID is undefined</div>
    }

    // Fetch data
    const { data, error, loading } = useSingleGames(id)

    return (
        <div className={`${sgContainer} ${loading ? "opacity-80 pointer-events-none" : ""}`}>
            {loading ? (
                <>
                    {/* Game title skeleton */}
                    <div className={sgSkeletonTitle}></div>
                    
                    <div className={sgSkeletonStage}></div>

                    {/* Metadata skeleton */}
                    <div className={metaBlock}>
                        <div className={sgSkeletonMeta}></div>
                        <div className={sgSkeletonMeta}></div>
                        <div className={sgSkeletonMeta}></div>
                        <div className={sgSkeletonMeta}></div>
                    </div>

                    {/* Divider */}
                    <hr className={metaDivider} />

                    {/* Scoreboard skeleton */}
                    <div className={sgSkeletonScoreboard}></div>

                    {/* Stats skeleton */}
                    <section className={statsSection}>
                        <div className={sgSkeletonStatsTitle}></div>
                        <div className={sgSkeletonStatsTable}></div>
                    </section>
                </>
            ) : error ? (
                <div className={sgContainer}>Error: {error}</div>
            ) : !data ? (
                <div className={sgContainer}>No data found.</div>
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
                            return <div className={sgContainer}>Game not found.</div>
                        }

                        // Pick the matching game
                        const numericId = Number(id)
                        const game      = games.find(g => g.id === numericId) ?? games[0]
                        const isUpcoming = game.status === "scheduled"
                        const winningTeam = isUpcoming ? null : getWinningTeamIndex(game)

                        // Compute total sets
                        const totalSets = (game.team1Score ?? 0) + (game.team2Score ?? 0)

                        // Format date
                        const formattedDate = new Date(game.date).toLocaleDateString(
                            undefined,
                            { year: "numeric", month: "long", day: "numeric" }
                        )
                        const formattedTime = new Date(game.date).toLocaleTimeString(
                            undefined,
                            { hour: "numeric", minute: "2-digit" }
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

                        const team1Tone = getTeamTone(0, winningTeam)
                        const team2Tone = getTeamTone(1, winningTeam)

                        return (
                            <>
                                {/* SEO Meta Tags for Social Media Embedding */}
                                <SEO
                                    title={isUpcoming
                                        ? `${game.name} - Upcoming Match`
                                        : `${game.name} - Game Results`}
                                    description={isUpcoming
                                        ? `${team1.name} vs ${team2.name} - Upcoming ${formatGameStage(game)} match from Season ${game.season.seasonNumber} of the Roblox Volleyball League.`
                                        : `${team1.name} vs ${team2.name} - Final Score: ${game.team1Score}-${game.team2Score}. ${formatGameStage(game)} match from Season ${game.season.seasonNumber} of the Roblox Volleyball League.`}
                                    image="https://volleyball4-2.com/rvlLogo.png"
                                    url={`https://volleyball4-2.com/games/${game.id}`}
                                    type="sports_event"
                                    publishedTime={new Date(game.date).toISOString()}
                                    structuredData={{
                                        "@context": "https://schema.org",
                                        "@type": "SportsEvent",
                                        "name": game.name,
                                        "description": `${team1.name} vs ${team2.name} - ${formatGameStage(game)} match`,
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
                                <h1 className={gameTitle}>{game.name}</h1>

                                <div className={gameStageBlock}>
                                    <h1 className={gameStage}>{formatGameStage(game)}</h1>
                                </div>

                                {/* Metadata */}
                                <div className={metaBlock}>
                                    <p className={metaText}>
                                        <i className="fas fa-layer-group"></i> Season {game.season.seasonNumber}
                                    </p>
                                    <p className={metaText}>
                                        <i className="fas fa-volleyball-ball"></i> Total Sets Played {totalSets}
                                    </p>
                                    {
                                        isSafeExternalUrl(game.videoUrl)
                                        ? <p className={metaText}>
                                            <i className="fas fa-video"></i> Video: <a href={game.videoUrl} target="_blank" rel="noopener noreferrer">Watch Here</a>
                                        </p>
                                        : <p className={metaText}>
                                            <i className="fas fa-video-slash"></i> No Video Found
                                        </p>
                                    }
                                    <p className={metaText}>
                                        <i className="fas fa-calendar-alt"></i> {formattedDate}
                                        {isUpcoming && <> at {formattedTime}</>}
                                    </p>
                                </div>

                                
                                {/* Divider */}
                                <hr className={metaDivider} />

                                {/* Scoreboard */}
                                <div className={scoreboard}>
                                    <div className={teamColumn}>
                                        <div className={`${teamScore} ${team1Tone || "text-text"}`}>
                                            {isUpcoming ? "—" : (game.team1Score ?? "—")}
                                        </div>
                                        <div className={`${teamName} ${team1Tone}`}>{team1.name}</div>
                                    </div>
                                    <div className={vsBadge}>vs</div>
                                    <div className={teamColumn}>
                                        <div className={`${teamScore} ${team2Tone || "text-text"}`}>
                                            {isUpcoming ? "—" : (game.team2Score ?? "—")}
                                        </div>
                                        <div className={`${teamName} ${team2Tone}`}>{team2.name}</div>
                                    </div>
                                </div>


                                {/* Player statistics */}
                                {
                                    isUpcoming
                                        ? (
                                            <section className={statsSectionUpcoming}>
                                                <div className={upcomingNotice}>
                                                    <i className={`fas fa-calendar-day ${upcomingNoticeIcon}`}></i>
                                                    <h2 className={upcomingNoticeTitle}>Match Not Yet Played</h2>
                                                    <p className={upcomingNoticeText}>
                                                        This game is scheduled for {formattedDate} at {formattedTime}.
                                                        Player statistics will be available here after the match is completed.
                                                    </p>
                                                </div>
                                            </section>
                                        )
                                        : hasStats
                                        ? (
                                            <section className={statsSection}>
                                                {/* Section title */}
                                                <h2 className={statsTitle}>Player Statistics</h2>
                                                <div className={statsScroll}>
                                                    <Table
                                                        columns={statsColumns}
                                                        rows={allStats}
                                                        rowKey={(row) => row.id}
                                                        tableClassName={statsTable}
                                                        wrapperClassName=""
                                                        rowClassName={(row) =>
                                                            team2Stats.some((s) => s.id === row.id)
                                                                ? team2Row
                                                                : team1Row
                                                        }
                                                        renderBeforeRow={(_row, index) =>
                                                            team1Stats.length === 0 &&
                                                            team2Stats.length > 0 &&
                                                            index === 0 ? (
                                                                <tr className={teamSeparator} key="sep-before-team2">
                                                                    <td colSpan={statsColumns.length}></td>
                                                                </tr>
                                                            ) : null
                                                        }
                                                        renderAfterRow={(_row, index) =>
                                                            team1Stats.length > 0 &&
                                                            index === team1Stats.length - 1 ? (
                                                                <tr className={teamSeparator} key="sep-after-team1">
                                                                    <td colSpan={statsColumns.length}></td>
                                                                </tr>
                                                            ) : null
                                                        }
                                                    />
                                                </div>
                                            </section>
                                        )
                                        : <p className={noStats}>No statistics have been recorded for this game.</p>
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
