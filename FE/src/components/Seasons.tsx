import React from "react"
import { Link } from "react-router-dom"
import { Season } from "../types/interfaces"
import { useMediumSeasons } from "../hooks/allFetch"
import { useRegion } from "../context/regionContext"
import defaultBanner from "../images/callToAction.png"
import {
    FaRegCalendarAlt,
    FaStar,
    FaVolleyballBall,
    FaUsers
} from "react-icons/fa"
import { listingTableEmpty } from "./listingClasses"

const seasonsPage =
    "max-w-[1480px] mx-auto pt-[3.5rem] px-[2rem] pb-[4rem] " +
    "[font-family:'Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] text-text " +
    "min-h-screen box-border [contain:layout_style_paint]"

/* Original is `repeat(3, 1fr)` / `repeat(2, 1fr)` / `1fr`, not Tailwind's
   minmax(0,1fr) grid-cols-N. */
const seasonsGrid =
    "grid grid-cols-[1fr_1fr_1fr] gap-[2.4rem] min-h-[600px] " +
    "[content-visibility:auto] [contain-intrinsic-size:600px] " +
    "upto-lg:grid-cols-[1fr_1fr] upto-lg:min-h-[500px] " +
    "upto-sm:grid-cols-[1fr] upto-sm:min-h-[400px] " +
    "empty:before:content-[''] empty:before:block empty:before:h-[600px] empty:before:w-full"

const seasonImage =
    "w-full aspect-[16/6] object-cover rounded-t-[14px]"

const seasonCard =
    "flex flex-col bg-bg border border-accent-border rounded-[14px] shadow-sm overflow-hidden " +
    "min-w-[325px] min-h-[300px] box-border [contain:layout_style] " +
    "[transform:translateZ(0)] [backface-visibility:hidden] " +
    "transition-[transform,box-shadow] duration-[0.18s] ease-[ease] " +
    "hover:[transform:translateY(-3px)] hover:shadow-[0_6px_12px_rgba(0,0,0,0.08)]"

/* `.season-card > *:not(.season-image)` padding and flex. Applied on the
   content nodes rather than a :not() descendant so the image is left alone. */
/* `.season-card > *:not(.season-image)` set flex-column, flex 1, and padding
   on every non-image child. Header does not override flex-direction, so it
   stays a column. Each node carries that winner rather than composing a
   shared string that would fight `flex` vs `flex-col`. */
const seasonHeader =
    "flex flex-col flex-[1_1_auto] items-center gap-[0.75rem] m-0 " +
    "pt-0 px-[2.6rem] pb-[2rem] upto-sm:px-[2.2rem]"

const seasonTitle = "text-[1.6rem] font-bold m-0 text-brand-primary"

const seasonDates = "flex items-center text-[1rem] font-semibold text-text-muted m-0"

const seasonStats =
    "flex flex-col flex-[1_1_auto] list-none p-0 m-0 text-[1.1rem] font-semibold " +
    "leading-[1.6] text-text-muted [&_li+li]:mt-[0.8rem] " +
    "pt-0 px-[2.6rem] pb-[2rem] upto-sm:px-[2.2rem]"

const seasonFooter =
    "flex flex-col flex-[1_1_auto] -m-[1rem] text-right " +
    "pt-0 px-[2.6rem] pb-[2rem] upto-sm:px-[2.2rem]"

const seasonFooterLink =
    "text-[0.95rem] font-bold text-brand-primary no-underline leading-none " +
    "hover:text-brand-primary-hover hover:underline"

const iconBase =
    "text-[1.1rem] fill-current transition-[color,fill] duration-[0.18s] ease-[ease]"

const seasonIcon = `${iconBase} text-brand-primary`

const themeIcon = `${iconBase} text-warning`

const teamIcon = `${iconBase} text-brand-primary`

const volleyballIcon = `${iconBase} text-text-muted-alt`

const seasonsSkeleton =
    "bg-[image:var(--skeleton-shimmer)] bg-[length:200%_100%] animate-skeleton-sweep " +
    "rounded-[14px] h-[300px] w-full min-w-[325px]"

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
        <div className={seasonCard}>
            {/* Banner image */}
            <img
                src={imageSrc}
                alt={`Season ${season.seasonNumber} banner`}
                className={seasonImage}
            />

            {/* Header (title + dates inline) */}
            <header className={seasonHeader}>
                <h2 className={seasonTitle}>
                    Season&nbsp;{season.seasonNumber}
                </h2>
                <div className={seasonDates}>
                    <FaRegCalendarAlt className={seasonIcon} />
                    &nbsp;{fmt(season.startDate)}&nbsp;–&nbsp;{fmt(season.endDate)}
                </div>
            </header>

            {/* Quick stats including Theme */}
            <ul className={seasonStats}>
                <li>
                    <FaStar className={themeIcon} />
                    &nbsp;<strong>Theme:</strong>&nbsp;{season.theme}
                </li>
                <li>
                    <FaUsers className={teamIcon} />
                    &nbsp;<strong>Teams:</strong>&nbsp;{season.teams?.length ?? 0}
                </li>
                <li>
                    <FaVolleyballBall className={volleyballIcon} />
                    &nbsp;<strong>Games:</strong>&nbsp;{season.games?.length ?? 0}
                </li>
            </ul>

            {/* View Details link */}
            <footer className={seasonFooter}>
                <Link to={`/seasons/${season.id}`} className={seasonFooterLink}>View&nbsp;Details&nbsp;→</Link>
            </footer>
        </div>
    )
}

/* ===== Seasons page ===== */
const Seasons: React.FC = () =>
{
    const { regionQuery } = useRegion();
    const { data, loading, error } = useMediumSeasons(regionQuery)
    
    if (error) return <div>Error: {error}</div>
    
    return (
        <div className={`${seasonsPage} ${loading ? "opacity-80 pointer-events-none" : ""}`}>
            <div className={seasonsGrid}>
                {loading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className={seasonsSkeleton}></div>
                    ))
                ) : (data ?? []).length === 0 ? (
                    <div className={listingTableEmpty}>No seasons found.</div>
                ) : (
                    [...(data ?? [])].sort((a, b) => b.seasonNumber - a.seasonNumber).map(season =>
                        <SeasonCard key={season.id} season={season} />
                    )
                )}
            </div>
        </div>
    )
}

export default Seasons
