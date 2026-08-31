// src/pages/SingleSeason.tsx

import React from "react";
import { useParams, Link } from "react-router-dom";  // added Link import
import { useSingleSeason } from "../../hooks/allFetch";
import { Team as ITeam, Player as IPlayer } from "../../types/interfaces";
import SEO from "../SEO";

type TeamCardProps = {
    team: ITeam;
    headerColor: string;
    positionNumber: number;
};

const ssContainer =
    "bg-white text-[#1a1a1a] min-h-screen m-0 p-0 " +
    "[font-family:'Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] box-border " +
    "[contain:layout_style_paint]";

/* The skewed highlight behind the title was a ::before, so it stays one.
   animate-fade-in uses `both` so the `from` frame (opacity 0, dropped 10px)
   is applied before the animation starts - without that the title would
   flash at rest for one frame. */
const ssHeader =
    "relative text-[4rem] font-black uppercase text-center text-brand-primary " +
    "my-[2rem] mx-auto leading-[1.1] max-w-fit min-h-[80px] animate-fade-in " +
    "before:content-[''] before:absolute before:left-1/2 before:top-1/2 " +
    "before:w-[120%] before:h-[0.4em] before:bg-accent before:z-[-1] " +
    "before:[transform:translate(-50%,-50%)_skewX(-25deg)]";

const ssMeta =
    "flex justify-center items-center gap-[1.5rem] mb-[1rem] min-h-[40px] " +
    "[&_span]:bg-brand-primary [&_span]:text-text-on-brand [&_span]:py-[0.5rem] [&_span]:px-[1rem] " +
    "[&_span]:border [&_span]:border-brand-primary [&_span]:rounded-sm " +
    "[&_span]:text-[1rem] [&_span]:min-w-[8rem] [&_span]:text-center";

/* grid-cols-4 is repeat(4, minmax(0, 1fr)); the original is repeat(4, 1fr). */
const ssTeamsGrid =
    "grid grid-cols-[repeat(4,1fr)] gap-[2rem] p-[1rem] mb-[2rem] box-border " +
    "min-h-[600px] [content-visibility:auto] [contain-intrinsic-size:600px] " +
    "empty:before:content-[''] empty:before:block empty:before:h-[600px] empty:before:w-full";

/* Hover restyles the header strip and its text through descendant rules that
   used !important to beat the inline backgroundColor. `group` plus
   group-hover:! is the same override, now on the elements that change.
   `dark-scrollbar` stays a class: it is defined in App.css. */
const ssTeamCard =
    "group relative flex flex-col w-full h-[425px] bg-[#1a1a1a] border-2 border-brand-primary " +
    "overflow-hidden box-border origin-top no-underline " +
    "transition-[transform,box-shadow] duration-200 ease-[ease] " +
    "[contain:layout_style] [transform:translateZ(0)] [backface-visibility:hidden] " +
    "hover:[transform:scale(1.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.6)]";

const ssTeamCardBadge =
    "absolute top-[8px] left-[8px] w-[24px] h-[24px] rounded-full bg-brand-primary " +
    "flex items-center justify-center font-bold text-text-on-brand no-underline";

const ssTeamCardHeader =
    "w-full h-[48px] flex flex-col justify-center items-center bg-inherit " +
    "font-bold text-[1.1rem] text-white " +
    "transition-[background-color,color] duration-200 ease-[ease] " +
    "group-hover:bg-[#1a1a1a]!";

const ssTeamName = "m-0 leading-none group-hover:text-accent!";
const ssTeamId = "text-[0.8rem] opacity-80 leading-none group-hover:text-accent!";

const ssTeamPlacement =
    "bg-black text-[#ccc] text-center py-[0.25rem] text-[0.85rem] border-t border-t-[#222]";

const ssTeamPlayers =
    "flex-1 overflow-y-auto m-0 p-[0.5rem] list-none text-left box-border " +
    "[&_li]:flex [&_li]:items-center [&_li]:gap-[0.5rem] [&_li]:border-b [&_li]:border-b-[#333] " +
    "[&_li]:py-[0.2rem] [&_li]:text-[#ddd]";

const ssPlayerIndex = "w-[1.2rem] text-right opacity-70";
const ssPlayerName = "flex-1 truncate";

const ssAwardsButtonContainer = "flex justify-center mb-[2rem]";

const ssAwardsButton =
    "text-[1rem] py-[0.5rem] px-[1rem] bg-brand-primary text-text-on-brand no-underline " +
    "border border-brand-primary rounded-sm transition-all duration-200 ease-[ease] " +
    "normal-case font-normal " +
    "hover:bg-brand-primary-hover hover:border-brand-primary-hover " +
    "hover:[transform:translateY(-2px)] hover:shadow-sm";

const skeletonSweep =
    "bg-[linear-gradient(90deg,#f0f0f0_25%,#e0e0e0_50%,#f0f0f0_75%)] bg-[length:200%_100%] " +
    "animate-skeleton-sweep";

/*
    Renders a single team as a colored card with placement badge,
    team name/id header, and a numbered list of players.
    Wraps in Link so clicking goes to /teams/:teamName
*/
const TeamCard: React.FC<TeamCardProps> = ( props ) =>
{
    const { team, headerColor, positionNumber } = props;

    return (
        <Link
            to={`/teams/${encodeURIComponent(team.name)}`}
            className={ssTeamCard}
        >
            <div
                className={ssTeamCardBadge}
                style={{ backgroundColor: headerColor }}
            >
                {positionNumber}
            </div>

            <div
                className={ssTeamCardHeader}
                style={{ backgroundColor: headerColor }}
            >
                <h3 className={ssTeamName}>{team.name}</h3>
                <div className={ssTeamId}>#{team.id}</div>
            </div>

            {team.placement && (
                <div className={ssTeamPlacement}>
                    {team.placement}
                </div>
            )}

            <ul className={`${ssTeamPlayers} dark-scrollbar`}>
                {team.players?.map(( player: IPlayer, idx: number ) => (
                    <li key={player.id}>
                        <span className={ssPlayerIndex}>{idx + 1}.</span>
                        <span className={ssPlayerName}>{player.name}</span>
                    </li>
                ))}
            </ul>
        </Link>
    );
};

const headerColors = [
    "#A8D5BA",
    "#AED4F1",
    "#E57373",
    "#F4A261",
    "#E9C46A",
    "#FFD54F",
    "#8E3A3A",
    "#66BB6A",
];

const SingleSeason: React.FC = () =>
{
    const { id } = useParams<{ id: string }>();
    const { data: seasons, error, loading } = useSingleSeason(id!);

    if (!id)
    {
        return <div className={ssContainer}>URL ID is undefined</div>;
    }

    return (
        <div className={`${ssContainer} ${loading ? "opacity-80 pointer-events-none" : ""}`}>
            {loading ? (
                <>
                    <header className={ssHeader}>
                        <div className={`${skeletonSweep} h-[80px] w-[300px] mx-auto rounded-[8px]`}></div>
                    </header>

                    <div className={ssMeta}>
                        <div className={`${skeletonSweep} h-[40px] w-[200px] mx-auto rounded-[4px]`}></div>
                    </div>
                    
                    <div className={ssAwardsButtonContainer}>
                        <div className={`${skeletonSweep} h-[50px] w-[150px] mx-auto rounded-[8px]`}></div>
                    </div>

                    <div className={ssTeamsGrid}>
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div
                                key={index}
                                className={`${skeletonSweep} h-[425px] w-full rounded-[8px] border-2 border-[#e0e0e0]`}
                            ></div>
                        ))}
                    </div>
                </>
            ) : error ? (
                <div className={ssContainer}>Error: {error}</div>
            ) : !seasons ? (
                <div className={ssContainer}>Season not found</div>
            ) : (
                <>
                    {/* SEO Meta Tags for Social Media Embedding */}
                    {(() => {
                        const season = Array.isArray(seasons) ? seasons[0] : seasons;
                        return (
                            <SEO
                                title={`Season ${season.seasonNumber} - Roblox Volleyball League`}
                                description={`Season ${season.seasonNumber} of the Roblox Volleyball League with theme "${season.theme}". View team standings, players, and results.`}
                                image={season.image || "https://volleyball4-2.com/rvlLogo.png"}
                                url={`https://volleyball4-2.com/seasons/${season.id}`}
                                type="sports_event"
                                publishedTime={new Date(season.startDate).toISOString()}
                                structuredData={{
                                    "@context": "https://schema.org",
                                    "@type": "SportsSeason",
                                    "name": `Season ${season.seasonNumber}`,
                                    "description": `Season ${season.seasonNumber} of the Roblox Volleyball League`,
                                    "url": `https://volleyball4-2.com/seasons/${season.id}`,
                                    "seasonNumber": season.seasonNumber,
                                    "startDate": new Date(season.startDate).toISOString(),
                                    "endDate": season.endDate ? new Date(season.endDate).toISOString() : undefined,
                                    "sport": "Volleyball",
                                    "league": {
                                        "@type": "SportsOrganization",
                                        "name": "Roblox Volleyball League",
                                        "url": "https://volleyball4-2.com"
                                    },
                                    "team": season.teams?.map(team => ({
                                        "@type": "SportsTeam",
                                        "name": team.name,
                                        "url": `https://volleyball4-2.com/teams/${encodeURIComponent(team.name.toLowerCase().replace(/\s+/g, "-"))}`,
                                        "athlete": team.players?.map(player => ({
                                            "@type": "Person",
                                            "name": player.name,
                                            "url": `https://volleyball4-2.com/players/${player.id}`
                                        })) || []
                                    })) || []
                                }}
                            />
                        );
                    })()}

                    <header className={ssHeader}>
                        Season {(Array.isArray(seasons) ? seasons[0] : seasons).seasonNumber}
                    </header>

                    <div className={ssMeta}>
                        <span>Theme: {(Array.isArray(seasons) ? seasons[0] : seasons).theme}</span>
                        <span>Start Date: {new Date((Array.isArray(seasons) ? seasons[0] : seasons).startDate).toLocaleDateString()}</span>
                        <span>End Date: {(Array.isArray(seasons) ? seasons[0] : seasons).endDate ? new Date((Array.isArray(seasons) ? seasons[0] : seasons).endDate!).toLocaleDateString() : 'TBD'}</span>
                    </div>
                    
                    <div className={ssAwardsButtonContainer}>
                        <Link 
                            to="/awards" 
                            state={{ selectedSeason: (Array.isArray(seasons) ? seasons[0] : seasons).seasonNumber }}
                            className={ssAwardsButton}
                        >
                            View Awards
                        </Link>
                    </div>

                    <div className={ssTeamsGrid}>
                        {(Array.isArray(seasons) ? seasons[0] : seasons).teams?.map(( team, idx ) => (
                            <TeamCard
                                key={team.id}
                                team={team}
                                headerColor={headerColors[idx % headerColors.length]}
                                positionNumber={idx + 1}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default SingleSeason;
