import React from "react"
import { Link } from "react-router-dom"
import { Season } from "../types/interfaces"
import { useSeasons } from "../hooks/allFetch"
import "../styles/Season.css"

/* ===== Season card component ===== */
const SeasonCard: React.FC<{ season: Season }> = ({ season }) =>
{
    // Helper to format ISO → “Apr 1, 25”
    const fmt = (iso?: Date) =>
        iso
            ? new Date(iso).toLocaleDateString(
                undefined,
                { month: "short", day: "numeric", year: "numeric" }
              )
            : "Present"

    return (
        <div className="season-card">
            {/* Header */}
            <header className="season-header">
                <span className="season-title">Season&nbsp;{season.seasonNumber}</span>
                <span className="season-dates">
                    •&nbsp;{fmt(season.startDate)}&nbsp;–&nbsp;{fmt(season.endDate)}
                </span>
            </header>

            {/* Quick stats */}
            <ul className="season-stats">
                <li><strong>Teams:</strong>&nbsp;{season.teams?.length ?? 0}</li>
                <li><strong>Games:</strong>&nbsp;{season.games?.length ?? 0}</li>
            </ul>

            {/* View Details link */}
            <footer className="season-footer">
                <Link to={`/seasons/${season.id}`}>View&nbsp;Details&nbsp;→</Link>
            </footer>
        </div>
    )
}

/* ===== Seasons page ===== */
const Seasons: React.FC = () =>
{
    // Fetch season data
    const { data, error } = useSeasons()

    if (error) return <div>Error: {error}</div>
    if (!data) return <div>Loading…</div>

    // Newest first
    const seasons = [...data].sort((a, b) => b.seasonNumber - a.seasonNumber)

    return (
        <div className="seasons-page">
            <h1 className="page-title">All Seasons</h1>

            <div className="seasons-grid">
                {seasons.map(season =>
                    <SeasonCard key={season.id} season={season} />
                )}
            </div>
        </div>
    )
}

export default Seasons
