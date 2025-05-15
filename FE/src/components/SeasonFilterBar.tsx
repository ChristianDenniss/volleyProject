import React from "react";
import "../styles/SeasonFilterBar.css";

interface SeasonFilterProps {
  selectedSeason: number | null;
  onSeasonChange: (season: number | null) => void;
}

const SeasonFilter: React.FC<SeasonFilterProps> = ({ selectedSeason, onSeasonChange }) => {
  const seasons = Array.from({ length: 13 }, (_, i) => i + 1); // Generates seasons 1 to 13

  return (
    <div className="filter-bar">  {/* Apply the same class as the filter bar */}
      <label htmlFor="season">Filter by Season:</label>
      <select
        id="season"
        value={selectedSeason ?? ""}
        onChange={(e) => onSeasonChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">All Seasons</option>
        {seasons.map((season) => (
          <option key={season} value={season}>
            Season {season}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SeasonFilter;
