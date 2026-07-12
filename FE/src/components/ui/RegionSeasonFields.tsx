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
  style?: React.CSSProperties;
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  marginBottom: "0.75rem",
};

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
  style,
}) => {
  const getSeasonOptionValue = (season: Season) =>
    seasonValueKey === "seasonNumber" ? season.seasonNumber : season.id;

  return (
    <>
      <label style={style}>
        Region{required ? "*" : ""}
        <select
          value={regionId || ""}
          onChange={(e) => onRegionChange(Number(e.target.value))}
          required={required}
          style={fieldStyle}
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
      </label>

      {includeSeason && onSeasonChange && (
        <label style={style}>
          Season{required ? "*" : ""}
          <select
            value={seasonValue || ""}
            onChange={(e) => onSeasonChange(Number(e.target.value))}
            required={required}
            disabled={!regionId}
            style={fieldStyle}
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
        </label>
      )}
    </>
  );
};

export default RegionSeasonFields;
