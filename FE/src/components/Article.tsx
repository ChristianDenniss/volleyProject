import React from "react";
import { useArticles } from "../hooks/allFetch";

const Articles: React.FC = () => {
    // Use custom hook to get games data
    const { data, error } = useArticles();

    return (
        <div>
            <h1>show Articles</h1>
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

export default Articles;
