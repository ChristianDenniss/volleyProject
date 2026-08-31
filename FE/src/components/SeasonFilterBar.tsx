import React from "react";

interface SeasonFilterProps {
  selectedSeason: number | null;
  onSeasonChange: (season: number | null) => void;
}

/* The select's own styling. Every value is literal rather than a scale step,
   because the originals were literal too: 15px sits off the type scale, and
   4px is the token radius but was hardcoded here, so it stays hardcoded until
   the tokens are adopted deliberately rather than by accident.

   bg-none is not decorative. The rule this replaces used the `background`
   shorthand, which resets background-image; `bg-brand-primary` alone sets only
   background-color and would leave any inherited image in place. */
const seasonSelect =
  "max-h-[200px] py-[6px] px-[12px] text-[15px] rounded-[4px] " +
  "border border-brand-primary bg-brand-primary bg-none text-white cursor-pointer " +
  "transition-[background-color] duration-200 ease-[ease] " +
  "hover:bg-brand-primary-hover hover:border-brand-primary-hover " +
  "focus:outline-none focus:border-brand-primary-hover " +
  "focus:shadow-[0_0_0_2px_var(--color-focus-ring)]";

const SeasonFilter: React.FC<SeasonFilterProps> = ({ selectedSeason, onSeasonChange }) => {
  const seasons = Array.from({ length: 14 }, (_, i) => i + 1); // Generates seasons 1 to 14

  return (
    /* `season-filter-bar` carries no styles of its own any more, but it is not
       dead: StatsLeaderboard.css reaches this select through
       `.stats-season-filter .season-filter-bar select`. Dropping the class
       would silently unstyle the filter on the stats page. */
    <div className="season-filter-bar flex items-center">
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
