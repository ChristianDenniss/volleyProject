// SearchBar.tsx
import React, { useState } from "react";

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
    className?: string;
}

/* `search-bar` stays: PortalPlayersPage.css still styles `.search-bar input`
   unlayered (padding, radius, focus ring). Dropping the class would unstyle
   every portal search field. Listing and stats pages override flex / max-width
   from their ancestors in listingClasses.ts and StatsLeaderboard.tsx. */
const searchBar = "search-bar flex items-center min-w-0";

const searchInput =
    "w-full max-w-[22rem] py-[8px] px-[12px] text-[15px] " +
    "border border-border rounded-sm box-border";

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = "Search...", className = "" }) => {
    const [query, setQuery] = useState<string>("");

    // Handle input change and pass the query to the parent component
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        onSearch(e.target.value);  // Pass the query to the parent component
    };

    return (
        <div className={`${searchBar} ${className}`}>
            <input
                type="text"
                className={searchInput}
                placeholder={placeholder}
                aria-label={placeholder}
                value={query}
                onChange={handleInputChange}
            />
        </div>
    );
};

export default SearchBar;
