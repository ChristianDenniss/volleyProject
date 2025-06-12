// src/pages/SingleSeason.tsx

import React from "react";
import { useParams, Link } from "react-router-dom";  // added Link import
import { useSingleSeason } from "../../hooks/allFetch";
import "../../styles/SingleSeason.css";
import { Season, Team as ITeam, Player as IPlayer } from "../../types/interfaces";

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
    const { data: seasons, error } = useSingleSeason(id!);

    if (!id)
    {
        return <div className="ss-container">URL ID is undefined</div>;
    }

    if (!seasons && !error)
    {
        return <div className="ss-container">Loading…</div>;
    }

    if (error)
    {
        return <div className="ss-container">Error: {error}</div>;
    }

    const season: Season | null = Array.isArray(seasons) ? seasons[0] : seasons;
    if (!season)
    {
        return <div className="ss-container">Season not found</div>;
    }

    return (
        <div className="ss-container">

            <header className="ss-header">
                Season {season.seasonNumber}
                <Link 
                    to="/awards" 
                    state={{ selectedSeason: season.seasonNumber }}
                    className="ss-awards-button"
                >
                    View Awards
                </Link>
            </header>

            <div className="ss-meta">
                <span>Theme: {season.theme}</span>
                <span>Start Date: {new Date(season.startDate).toLocaleDateString()}</span>
                <span>End Date: {season.endDate ? new Date(season.endDate).toLocaleDateString() : 'TBD'}</span>
            </div>

            <div className="ss-teams-grid">
                {season.teams?.map(( team, idx ) => (
                    <TeamCard
                        key={team.id}
                        team={team}
                        headerColor={headerColors[idx % headerColors.length]}
                        positionNumber={idx + 1}
                    />
                ))}
            </div>
        </div>
    );
};

export default SingleSeason;
