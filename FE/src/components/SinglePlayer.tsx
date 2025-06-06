import React, { useEffect, useState } from "react"
import { useSinglePlayer } from "../hooks/allFetch"
import { useParams } from "react-router-dom"
import { getRobloxAvatarUrl } from "../utils/fetchAvatarRoblox"
import Select from "react-select"
import "../styles/SinglePlayer.css"

const PlayerProfiles: React.FC = () =>
{
    const { id } = useParams<{ id: string }>()
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const { data, error } = useSinglePlayer(id || "")
    const [selectedSeason, setSelectedSeason] = useState<number>(0)
    const [showAllGames, setShowAllGames] = useState<boolean>(false)

    useEffect(() =>
    {
        if (data?.name)
        {
            getRobloxAvatarUrl(data.name)
                .then(url => { if (url) setAvatarUrl(url) })
                .catch(err => console.error("Error fetching avatar:", err))
        }
    }, [data?.name])

    if (!id) return <div className="player-profile-container">URL ID is undefined</div>
    if (!data && !error) return <div className="player-profile-container">Loading…</div>
    if (error) return <div className="player-profile-container">Error: {error}</div>
    if (!data) return <div className="player-profile-container">No player found.</div>

    const player = data
    const allStats = Array.isArray(player.stats) ? player.stats : []

    const uniqueSeasons = Array.from(
        new Set(
            allStats
                .map(stat => stat.game?.season?.seasonNumber)
                .filter((num): num is number => typeof num === "number")
        )
    ).sort((a, b) => a - b)

    const filteredStats = selectedSeason === 0
        ? allStats
        : allStats.filter(stat => stat.game?.season?.seasonNumber === selectedSeason)

    const careerTotals = filteredStats.reduce((acc, stat) => ({
        spikeKills: acc.spikeKills + stat.spikeKills,
        spikeAttempts: acc.spikeAttempts + stat.spikeAttempts,
        apeKills: acc.apeKills + stat.apeKills,
        apeAttempts: acc.apeAttempts + stat.apeAttempts,
        spikingErrors: acc.spikingErrors + stat.spikingErrors,
        digs: acc.digs + stat.digs,
        blocks: acc.blocks + stat.blocks,
        assists: acc.assists + stat.assists,
        aces: acc.aces + stat.aces,
        settingErrors: acc.settingErrors + stat.settingErrors,
        blockFollows: acc.blockFollows + stat.blockFollows,
        servingErrors: acc.servingErrors + stat.servingErrors,
        miscErrors: acc.miscErrors + stat.miscErrors,
        gamesPlayed: acc.gamesPlayed + 1
    }), {
        spikeKills: 0,
        spikeAttempts: 0,
        apeKills: 0,
        apeAttempts: 0,
        spikingErrors: 0,
        digs: 0,
        blocks: 0,
        assists: 0,
        aces: 0,
        settingErrors: 0,
        blockFollows: 0,
        servingErrors: 0,
        miscErrors: 0,
        gamesPlayed: 0
    })

    const averages = {
        spikeKills: careerTotals.gamesPlayed ? (careerTotals.spikeKills / careerTotals.gamesPlayed).toFixed(1) : "0",
        spikeAttempts: careerTotals.gamesPlayed ? (careerTotals.spikeAttempts / careerTotals.gamesPlayed).toFixed(1) : "0",
        apeKills: careerTotals.gamesPlayed ? (careerTotals.apeKills / careerTotals.gamesPlayed).toFixed(1) : "0",
        apeAttempts: careerTotals.gamesPlayed ? (careerTotals.apeAttempts / careerTotals.gamesPlayed).toFixed(1) : "0",
        spikingErrors: careerTotals.gamesPlayed ? (careerTotals.spikingErrors / careerTotals.gamesPlayed).toFixed(1) : "0",
        digs: careerTotals.gamesPlayed ? (careerTotals.digs / careerTotals.gamesPlayed).toFixed(1) : "0",
        blocks: careerTotals.gamesPlayed ? (careerTotals.blocks / careerTotals.gamesPlayed).toFixed(1) : "0",
        assists: careerTotals.gamesPlayed ? (careerTotals.assists / careerTotals.gamesPlayed).toFixed(1) : "0",
        aces: careerTotals.gamesPlayed ? (careerTotals.aces / careerTotals.gamesPlayed).toFixed(1) : "0",
        settingErrors: careerTotals.gamesPlayed ? (careerTotals.settingErrors / careerTotals.gamesPlayed).toFixed(1) : "0",
        blockFollows: careerTotals.gamesPlayed ? (careerTotals.blockFollows / careerTotals.gamesPlayed).toFixed(1) : "0",
        servingErrors: careerTotals.gamesPlayed ? (careerTotals.servingErrors / careerTotals.gamesPlayed).toFixed(1) : "0",
        miscErrorsPerGame: careerTotals.gamesPlayed ? (careerTotals.miscErrors / careerTotals.gamesPlayed).toFixed(1) : "0"
    }

    const currentSeasonTeam = player.teams?.find(team => team.season?.seasonNumber === 14)?.name || "Not Active"
    const mostRecentTeam = player.teams?.reduce((mostRecent, team) =>
    {
        if (!team.season) return mostRecent
        if (!mostRecent || team.season.id > mostRecent.season.id) return team
        return mostRecent
    }, null as typeof player.teams[0] | null)?.name || "N/A"

    const seenGames = new Set<number>()
    const dedupedGames = player.teams?.flatMap(team => team.games || []).filter(game =>
    {
        if (seenGames.has(game.id)) return false
        seenGames.add(game.id)
        return true
    }) || []

    const visibleGamesList = showAllGames ? dedupedGames : dedupedGames.slice(0, 5)
    const hasMoreGames = dedupedGames.length > 5

    const handleToggleGames = () => {
        setShowAllGames(prev => !prev)
    }

    const formatStatName = (key: string): string => {
        const nameMap: { [key: string]: string } = {
            spikeKills: "Spike Kills",
            spikeAttempts: "Spike Attempts",
            apeKills: "Ape Kills",
            apeAttempts: "Ape Attempts",
            spikingErrors: "Spiking Errors",
            digs: "Digs",
            blocks: "Blocks",
            assists: "Assists",
            aces: "Aces",
            settingErrors: "Setting Errors",
            blockFollows: "Block Follows",
            servingErrors: "Serving Errors",
            miscErrors: "Misc Errors",
            gamesPlayed: "Games Played",
            miscErrorsPerGame: "Misc Errors Per Game"
        }
        return nameMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    }

    return (
        <div className="player-profile-container">
            <div className="player-main-header">
                <div className="avatar-header-info">
                    {avatarUrl && (
                        <div className="avatar-left">
                            <img src={avatarUrl} alt={`${player.name}'s avatar`} className="player-avatar" />
                        </div>
                    )}
                    <div className="avatar-right">
                        <h1 className="player-name-large">{player.name}</h1>
                        <div className="player-meta">
                            <span>Username: {player.name}</span>
                            <span>Position: {player.position}</span>
                            <span>Current Team: {currentSeasonTeam}</span>
                            <span>Most Recent Team: {mostRecentTeam}</span>
                            <span>Total Teams: {player.teams?.length || 0}</span>
                            <span>Total Possible Games Played: {dedupedGames.length}</span>
                            <span>Total Stat Entries: {filteredStats.length}</span>
                            
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: "1.5rem", maxWidth: "300px" }}>
                <label htmlFor="season-select" style={{ color: "#ccc", marginBottom: "0.5rem", display: "block" }}>
                    View stats for:
                </label>
                <Select
                    id="season-select"
                    value={{ value: selectedSeason, label: selectedSeason === 0 ? "Career" : `Season ${selectedSeason}` }}
                    onChange={(option) => setSelectedSeason(option?.value || 0)}
                    options={[
                        { value: 0, label: "Career" },
                        ...uniqueSeasons.map(season => ({ value: season, label: `Season ${season}` }))
                    ]}
                    styles={{
                        control: (base) => ({
                            ...base,
                            backgroundColor: "#1a1a1a",
                            borderColor: "#333",
                            color: "#fff",
                            boxShadow: "none"
                        }),
                        singleValue: (base) => ({
                            ...base,
                            color: "#fff"
                        }),
                        menu: (base) => ({
                            ...base,
                            backgroundColor: "#1a1a1a",
                            color: "#fff"
                        }),
                        option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused ? "#8f54ff" : "#1a1a1a",
                            color: "#fff",
                            cursor: "pointer"
                        }),
                    }}
                />
            </div>

            {filteredStats.length === 0 ? (
                <p>No stats available for this season.</p>
            ) : (
                <div className="player-profiles-grid">
                    <div className="player-card">
                        <div className="player-stats">
                            <div className="stat-category">
                                <h3>{selectedSeason === 0 ? "Career Totals" : `Season ${selectedSeason} Totals`}</h3>
                                <div className="stat-grid">
                                    {Object.entries(careerTotals).map(([label, value]) => (
                                        <div key={label} className="stat-item">
                                            <span className="stat-label">{formatStatName(label)}</span>
                                            <span className="stat-value">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="stat-category">
                                <h3>Per Game Averages</h3>
                                <div className="stat-grid">
                                    {Object.entries(averages).map(([label, value]) => (
                                        <div key={label} className="stat-item">
                                            <span className="stat-label">{formatStatName(label)}</span>
                                            <span className="stat-value">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="player-teams-section">
                <h3>Teams</h3>
                <ul className="team-list">
                    {player.teams?.map(team => (
                        <li key={team.id}>
                            <a href={`/teams/${encodeURIComponent(team.name.toLowerCase().replace(/\s+/g, "-"))}`}>
                                {team.name}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="player-games-section">
                <h3>Games Played</h3>
                {dedupedGames.length === 0 ? (
                    <p>No games found.</p>
                ) : (
                    <>
                        <ul className={`game-list ${showAllGames ? 'expanded' : ''}`}>
                            {visibleGamesList.map(game => (
                                <li key={game.id}>
                                    <a href={`/games/${game.id}`}>{game.name}</a>
                                </li>
                            ))}
                        </ul>
                        {hasMoreGames && (
                            <button 
                                className="show-more-games"
                                onClick={handleToggleGames}
                            >
                                {showAllGames ? 'Show Less' : 'See More Games'}
                            </button>
                        )}
                    </>
                )}
            </div>

            <div className="player-awards-section">
                <h3>Awards</h3>
                <p>No awards yet.</p>
            </div>
        </div>
    )
}

export default PlayerProfiles
