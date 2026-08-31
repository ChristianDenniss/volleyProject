import React from "react";

/**
 * FilterSelect — the navy filter dropdown used above the public list pages.
 *
 * The styling it carries (navy fill, white chevron, focus ring) was duplicated
 * verbatim in 14 CSS rules across 7 stylesheets - Game.css, Players.css,
 * Teams.css, Schedules.css, StatsLeaderboard.css, VectorGraphPage.css and
 * PortalApplicationsPage.css. This is that block, once.
 *
 * Options are passed as data rather than as `<option>` children so a caller
 * cannot accidentally style them differently. `placeholder` renders as the
 * empty-value row - the "All Seasons" / "All Stages" entry every filter has.
 */

export interface FilterSelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  /** Accessible name. Filter bars are too tight for a visible label. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly FilterSelectOption[];
  /** Label for the empty-value option, e.g. "All Seasons". */
  placeholder: string;
  id?: string;
  disabled?: boolean;
  /** Extra classes for the wrapper, not the control. */
  className?: string;
}

/* Carried over from the `.games-season-filter select` rule verbatim:
   15px text, 8px/16px padding with 32px on the right for the chevron, a 1px
   navy border at --radius-sm, the chevron drawn 20px wide 8px in from the
   right edge, and a 2px focus ring in the shared focus colour. */
const CONTROL =
  "appearance-none cursor-pointer text-[15px] leading-normal py-2 px-4 pr-8 " +
  "rounded-sm border border-brand-primary bg-brand-primary text-white shadow-none " +
  "bg-[image:var(--chevron-down-white)] bg-no-repeat bg-[right_8px_center] bg-[length:20px] " +
  "transition-[background-color] duration-200 ease-[ease] " +
  "hover:bg-brand-primary-hover hover:border-brand-primary-hover " +
  "focus:bg-brand-primary-hover focus:border-brand-primary-hover " +
  "focus:outline-none focus:shadow-[0_0_0_2px_var(--color-focus-ring)] " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  id,
  disabled = false,
  className = "",
}) => (
  <div className={`m-0 whitespace-nowrap ${className}`}>
    <select
      id={id}
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={CONTROL}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

export default FilterSelect;
