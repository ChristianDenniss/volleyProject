import React from "react";

interface SeasonFilterProps {
  selectedSeason: number | null;
  onSeasonChange: (season: number | null) => void;
}

/* StatsLeaderboard.css used to restyle this select with !important (8px/16px
   padding, 32px chevron gutter, navy fill + white chevron). This component is
   only used on that page, so the stats winner is the look. max-h-[200px] was
   never overridden and stays. */
const seasonSelect =
  "max-h-[200px] py-[8px] px-[16px] pr-[32px] text-[15px] rounded-[4px] " +
  "border border-brand-primary bg-brand-primary text-white cursor-pointer " +
  "bg-[image:var(--chevron-down-white)] bg-no-repeat bg-[right_8px_center] bg-[length:20px] " +
  "shadow-none appearance-none " +
  "transition-[background-color] duration-200 ease-[ease] " +
  "hover:bg-brand-primary-hover hover:border-brand-primary-hover " +
  "focus:bg-brand-primary-hover focus:border-brand-primary-hover " +
  "focus:outline-none focus:shadow-[0_0_0_2px_var(--color-focus-ring)]";

const SeasonFilter: React.FC<SeasonFilterProps> = ({ selectedSeason, onSeasonChange }) => {
  const seasons = Array.from({ length: 14 }, (_, i) => i + 1); // Generates seasons 1 to 14

  return (
    <div className="flex items-center">
      <select
        id="season"
        aria-label="Season"
        className={seasonSelect}
        value={selectedSeason ?? ""}
        onChange={(e) => onSeasonChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option className="px-[8px] py-[4px]" value="">
          All Seasons
        </option>
        {seasons.map((season) => (
          <option className="px-[8px] py-[4px]" key={season} value={season}>
            Season {season}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SeasonFilter;
