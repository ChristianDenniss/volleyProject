import React from "react";
import { useGames } from "../hooks/allFetch";
import "../styles/SingleGame.css";

const Seasons: React.FC = () => 
{
    // Use custom hook to get player data
    const { data, error } = useGames();

    return (
        <div>
            <h1>show Single Game</h1>
            {
                error ? (
                    <div>Error: {error}</div>
                ) : data ? (
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                ) : (
                    <div>Loading...</div>
                )
            }
        </div>
    );
};

export default Seasons;
