import React from "react"
import { Link } from "react-router-dom"
import { Season } from "../types/interfaces"
import { useMediumSeasons } from "../hooks/allFetch"
import "../styles/Season.css"
import defaultBanner from "../images/callToAction.png"
import {
    FaRegCalendarAlt,
    FaStar,
    FaVolleyballBall,
    FaUsers
} from "react-icons/fa"

/* ===== Season card component ===== */
const SeasonCard: React.FC<{ season: Season }> = ({ season }) =>
{
    /* Helper to format ISO → "Apr 1, 25" */
    const fmt = (iso?: Date) =>
        iso
        ? new Date(iso).toLocaleDateString(
            undefined,
            { month: "short", day: "numeric", year: "numeric" }
          )
        : "Present"

    /* Fallback to default banner when no image is provided */
    const imageSrc = season.image
        ? season.image.toString()
        : defaultBanner

    return (
        <div className="season-card">
            {/* Banner image */}
            <img
                src={imageSrc}
                alt={`Season ${season.seasonNumber} banner`}
                className="season-image"
            />

            {/* Header (title + dates inline) */}
            <header className="season-header">
                <h2 className="season-title">
                    Season&nbsp;{season.seasonNumber}
                </h2>
                <div className="season-dates">
                    <FaRegCalendarAlt className="icon" />
                    &nbsp;{fmt(season.startDate)}&nbsp;–&nbsp;{fmt(season.endDate)}
                </div>
            </header>

            {/* Quick stats including Theme */}
            <ul className="season-stats">
                <li>
                    <FaStar className="icon theme-icon" />
                    &nbsp;<strong>Theme:</strong>&nbsp;{season.theme}
                </li>
                <li>
                    <FaUsers className="icon team-icon" />
                    &nbsp;<strong>Teams:</strong>&nbsp;{season.teams?.length ?? 0}
                </li>
                <li>
                    <FaVolleyballBall className="icon volleyball-icon" />
                    &nbsp;<strong>Games:</strong>&nbsp;{season.games?.length ?? 0}
                </li>
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
    const { data, error } = useMediumSeasons()
    
    if (error) return <div>Error: {error}</div>
    
    return (
        <div className={`seasons-page ${!data ? 'loading' : ''}`}>
            <h1 className="page-title">All Seasons</h1>
            <div className="seasons-grid">
                {!data ? (
                    // Skeleton loaders
                    Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="seasons-skeleton"></div>
                    ))
                ) : (
                    [...data].sort((a, b) => b.seasonNumber - a.seasonNumber).map(season =>
                        <SeasonCard key={season.id} season={season} />
                    )
                )}
            </div>
        </div>
    )
}

export default Seasons
