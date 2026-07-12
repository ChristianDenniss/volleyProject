import React from "react";
import type { Season } from "../../types/interfaces";
import type { Region } from "../../context/regionContext";
import type { SeasonValueKey } from "../../hooks/useFormRegionSeason";

interface RegionSeasonFieldsProps {
  regions: Region[];
  regionsLoading?: boolean;
  regionId: number | "";
  onRegionChange: (regionId: number) => void;
  seasons?: Season[];
  seasonsLoading?: boolean;
  seasonValue?: number | "";
  onSeasonChange?: (value: number) => void;
  seasonValueKey?: SeasonValueKey;
  includeSeason?: boolean;
  required?: boolean;
  className?: string;
}

const RegionSeasonFields: React.FC<RegionSeasonFieldsProps> = ({
  regions,
  regionsLoading = false,
  regionId,
  onRegionChange,
  seasons = [],
  seasonsLoading = false,
  seasonValue = "",
  onSeasonChange,
  seasonValueKey = "id",
  includeSeason = true,
  required = true,
  className,
}) => {
  const getSeasonOptionValue = (season: Season) =>
    seasonValueKey === "seasonNumber" ? season.seasonNumber : season.id;

  return (
    <div className={className}>
      <div className="ui-form-field">
        <label htmlFor="region-season-region">
          Region{required ? "*" : ""}
        </label>
        <select
          id="region-season-region"
          className="ui-filter-select ui-filter-select-block"
          value={regionId || ""}
          onChange={(e) => onRegionChange(Number(e.target.value))}
          required={required}
        >
          <option value="">
            {regionsLoading ? "Loading regions..." : "Select a region"}
          </option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
      </div>

      {includeSeason && onSeasonChange && (
        <div className="ui-form-field">
          <label htmlFor="region-season-season">
            Season{required ? "*" : ""}
          </label>
          <select
            id="region-season-season"
            className="ui-filter-select ui-filter-select-block"
            value={seasonValue || ""}
            onChange={(e) => onSeasonChange(Number(e.target.value))}
            required={required}
            disabled={!regionId}
          >
            <option value="">
              {!regionId
                ? "Select a region first"
                : seasonsLoading
                  ? "Loading seasons..."
                  : seasons.length === 0
                    ? "No seasons in this region"
                    : "Select a season"}
            </option>
            {seasons.map((season) => (
              <option key={season.id} value={getSeasonOptionValue(season)}>
                Season {season.seasonNumber}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default RegionSeasonFields;
