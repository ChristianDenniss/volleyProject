"use client";

import { ClearFiltersButton, FilterSelect } from "@components/site/controls";
import { SITE_REGIONS, type MatchRegion } from "@/lib/region";

const MATCH_REGIONS = SITE_REGIONS.filter((region): region is MatchRegion => region !== "all");

export const REGION_FILTER_OPTIONS = [
  { value: "", label: "All regions" },
  ...MATCH_REGIONS.map((region) => ({ value: region, label: region.toUpperCase() })),
];

export function displayRound(round: string | null | undefined, stage: string | null | undefined) {
  return round?.trim() || stage?.trim() || "";
}

export function uniqueRounds(values: Iterable<string>) {
  return [...new Set([...values].filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function applySeasonRegionFilter<
  T extends {
    regionStats?: Record<string, { teamCount: number; gameCount: number }>;
    teamCount: number;
    gameCount: number;
  },
>(rows: T[], region: string): T[] {
  if (!region) return rows;
  return rows.flatMap((row) => {
    const counts = row.regionStats?.[region];
    if (!counts || counts.gameCount === 0) return [];
    return [{ ...row, teamCount: counts.teamCount, gameCount: counts.gameCount }];
  });
}

export function PortalResourceFilters({
  region,
  onRegionChange,
  season,
  onSeasonChange,
  seasons,
  round,
  onRoundChange,
  rounds,
}: {
  region: string;
  onRegionChange: (value: string) => void;
  season?: string;
  onSeasonChange?: (value: string) => void;
  seasons?: { id: number; label: string }[];
  round?: string;
  onRoundChange?: (value: string) => void;
  rounds?: string[];
}) {
  const active = Boolean(region || season || round);

  return (
    <>
      <FilterSelect
        id="portal-region-filter"
        label="Region"
        value={region}
        onChange={onRegionChange}
        options={REGION_FILTER_OPTIONS}
      />

      {onSeasonChange && seasons ? (
        <FilterSelect
          id="portal-season-filter"
          label="Season"
          value={season ?? ""}
          onChange={onSeasonChange}
          options={[
            { value: "", label: "All seasons" },
            ...seasons.map((item) => ({ value: String(item.id), label: item.label })),
          ]}
        />
      ) : null}

      {onRoundChange && rounds ? (
        <FilterSelect
          id="portal-round-filter"
          label="Round"
          value={rounds.includes(round ?? "") ? (round ?? "") : ""}
          onChange={onRoundChange}
          options={[
            { value: "", label: "All rounds" },
            ...rounds.map((item) => ({ value: item, label: item })),
          ]}
        />
      ) : null}

      {active ? (
        <ClearFiltersButton
          onClick={() => {
            onRegionChange("");
            onSeasonChange?.("");
            onRoundChange?.("");
          }}
        />
      ) : null}
    </>
  );
}
