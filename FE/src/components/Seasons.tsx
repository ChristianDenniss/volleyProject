import React from "react";
import { useSeasons } from "../hooks/allFetch";

const Seasons: React.FC = () => 
{
    // Use custom hook to get player data
    const { data, error } = useSeasons();

    return (
        <div>
            <h1>show Seasons</h1>
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
