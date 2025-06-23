// src/pages/SingleSeason.tsx

import React from "react";
import { useParams, Link } from "react-router-dom";  // added Link import
import { useSingleSeason } from "../../hooks/allFetch";
import "../../styles/SingleSeason.css";
import { Team as ITeam, Player as IPlayer } from "../../types/interfaces";
import SEO from "../SEO";

type TeamCardProps = {
    team: ITeam;
    headerColor: string;
    positionNumber: number;
};

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
            className="ss-team-card"
        >
            <div
                className="ss-team-card-badge"
                style={{ backgroundColor: headerColor }}
            >
                {positionNumber}
            </div>

            <div
                className="ss-team-card-header"
                style={{ backgroundColor: headerColor }}
            >
                <h3 className="ss-team-name">{team.name}</h3>
                <div className="ss-team-id">#{team.id}</div>
            </div>

            {team.placement && (
                <div className="ss-team-placement">
                    {team.placement}
                </div>
            )}

            <ul className="ss-team-players">
                {team.players?.map(( player: IPlayer, idx: number ) => (
                    <li key={player.id}>
                        <span className="ss-player-index">{idx + 1}.</span>
                        <span className="ss-player-name">{player.name}</span>
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
        return <div className="ss-container">URL ID is undefined</div>;
    }

    return (
        <div className={`ss-container ${loading ? 'loading' : ''}`}>
            {loading ? (
                <>
                    <header className="ss-header">
                        <div className="ss-skeleton-title"></div>
                    </header>

                    <div className="ss-meta">
                        <div className="ss-skeleton-meta"></div>
                    </div>
                    
                    <div className="ss-awards-button-container">
                        <div className="ss-skeleton-button"></div>
                    </div>

                    <div className="ss-teams-grid">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="ss-skeleton-team-card"></div>
                        ))}
                    </div>
                </>
            ) : error ? (
                <div className="ss-container">Error: {error}</div>
            ) : !seasons ? (
                <div className="ss-container">Season not found</div>
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

                    <header className="ss-header">
                        Season {(Array.isArray(seasons) ? seasons[0] : seasons).seasonNumber}
                    </header>

                    <div className="ss-meta">
                        <span>Theme: {(Array.isArray(seasons) ? seasons[0] : seasons).theme}</span>
                        <span>Start Date: {new Date((Array.isArray(seasons) ? seasons[0] : seasons).startDate).toLocaleDateString()}</span>
                        <span>End Date: {(Array.isArray(seasons) ? seasons[0] : seasons).endDate ? new Date((Array.isArray(seasons) ? seasons[0] : seasons).endDate!).toLocaleDateString() : 'TBD'}</span>
                    </div>
                    
                    <div className="ss-awards-button-container">
                        <Link 
                            to="/awards" 
                            state={{ selectedSeason: (Array.isArray(seasons) ? seasons[0] : seasons).seasonNumber }}
                            className="ss-awards-button"
                        >
                            View Awards
                        </Link>
                    </div>

                    <div className="ss-teams-grid">
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
