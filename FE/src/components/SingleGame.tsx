import React from 'react';
import { useParams } from 'react-router-dom';
import { useSingleGame } from '../hooks/allFetch';
import "../styles/SingleGame.css";

// Import your types
import { Stats } from '../types/interfaces';

// MVP version of single game page
const SingleGame: React.FC = () =>
{
    // Get gameId from route
    const { gameId } = useParams<{ gameId: string }>();

    // If no ID, show error
    if (!gameId)
    {
        return <p>Invalid game ID.</p>;
    }

    // Fetch game data using the custom hook
    const { data: games, loading, error } = useSingleGame(gameId);

    // Handle loading state
    if (loading)
    {
        return <p>Loading...</p>;
    }

    // Handle error state
    if (error)
    {
        return <p>{`Error: ${error}`}</p>;
    }

    // Extract the game data from the array (assuming it's an array and taking the first game)
    const game = games?.[0];

    // Handle missing game
    if (!game)
    {
        return <p>Game not found.</p>;
    }

    // Log the full game data for debugging
    console.log('Game Data:', game);

    // Ensure game has necessary properties
    const { teams, stats, team1Score, team2Score, name, date } = game;

    // Log teams and stats
    console.log('Teams:', teams);
    console.log('Stats:', stats);

    // Defensive fallback for missing properties
    const team1 = teams?.[0];
    const team2 = teams?.[1];
    const statsData = stats || [];

    // Filter stats where player's teams include this game team
    const team1Stats = statsData.filter((stat: Stats) =>
        stat?.playerBelongingTo?.teams?.some(team => team.id === team1?.id)
    );

    const team2Stats = statsData.filter((stat: Stats) =>
        stat?.playerBelongingTo?.teams?.some(team => team.id === team2?.id)
    );

    // Log filtered stats for each team
    console.log('Team 1 Stats:', team1Stats);
    console.log('Team 2 Stats:', team2Stats);

    return (
        <div className="game-detail">
            <h1>{name}</h1>
            <p>{new Date(date).toLocaleDateString()}</p>

            <div className="score">
                <p>{team1?.name || 'Team 1'}: {team1Score}</p>
                <p>{team2?.name || 'Team 2'}: {team2Score}</p>
            </div>

            <div className="team-section">
                <h2>{team1?.name || 'Team 1'} Stats</h2>
                {team1Stats.length > 0 ? (
                    team1Stats.map((stat, i) => (
                        <div key={i} className="stat-block">
                            <p><strong>{stat.playerBelongingTo?.name || 'Unnamed Player'}</strong></p>
                            <p>Spike Kills: {stat.spikeKills}</p>
                            <p>Assists: {stat.assists}</p>
                            <p>Digs: {stat.digs}</p>
                        </div>
                    ))
                ) : (
                    <p>No stats available for this team.</p>
                )}
            </div>

            <div className="team-section">
                <h2>{team2?.name || 'Team 2'} Stats</h2>
                {team2Stats.length > 0 ? (
                    team2Stats.map((stat, i) => (
                        <div key={i} className="stat-block">
                            <p><strong>{stat.playerBelongingTo?.name || 'Unnamed Player'}</strong></p>
                            <p>Spike Kills: {stat.spikeKills}</p>
                            <p>Assists: {stat.assists}</p>
                            <p>Digs: {stat.digs}</p>
                        </div>
                    ))
                ) : (
                    <p>No stats available for this team.</p>
                )}
            </div>
        </div>
    );
};

export default SingleGame;
