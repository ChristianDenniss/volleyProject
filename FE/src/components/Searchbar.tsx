// SearchBar.tsx
import React, { useState } from "react";
import "../styles/Searchbar.css";

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = "Search..." }) => {
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
                placeholder={placeholder}
                value={query}
                onChange={handleInputChange}
            />
        </div>
    );
};

export default SearchBar;
