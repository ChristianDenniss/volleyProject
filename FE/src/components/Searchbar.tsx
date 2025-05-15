// SearchBar.tsx
import React, { useState } from "react";
import "../styles/Searchbar.css";

interface SearchBarProps {
    onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
    const [query, setQuery] = useState<string>("");

    // Handle input change and pass the query to the parent component
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        onSearch(e.target.value);  // Pass the query to the parent component
    };

    return (
        <div className="search-bar">
            <input
                type="text"
                placeholder="Search players..."
                value={query}
                onChange={handleInputChange}
            />
        </div>
    );
};

export default SearchBar;
