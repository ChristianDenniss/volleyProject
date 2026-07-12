import { useCallback, useMemo, useState } from "react";
import { useRegion } from "../context/regionContext";
import { useSkinnySeasons } from "./allFetch";
import type { RegionCode } from "../context/regionContext";

export type SeasonValueKey = "id" | "seasonNumber";

export function useFormRegionSeason(seasonValueKey: SeasonValueKey = "id") {
  const { regions, activeRegion, loading: regionsLoading } = useRegion();
  const [regionId, setRegionIdState] = useState<number | "">("");
  const [seasonValue, setSeasonValue] = useState<number | "">("");

  const selectedRegion = useMemo(
    () => regions.find((r) => r.id === regionId) ?? null,
    [regions, regionId]
  );

  const regionQuery = useMemo(
    () =>
      selectedRegion
        ? { region: selectedRegion.code as RegionCode, regionId: selectedRegion.id }
        : {},
    [selectedRegion]
  );

  const { data: seasons, loading: seasonsLoading } = useSkinnySeasons({
    page: 1,
    limit: 100,
    ...regionQuery,
  });

  const setRegionId = useCallback((id: number | "") => {
    setRegionIdState(id);
    setSeasonValue("");
  }, []);

  const initFromActiveRegion = useCallback(() => {
    setRegionIdState(activeRegion?.id ?? "");
    setSeasonValue("");
  }, [activeRegion]);

  const regionPayload = selectedRegion
    ? { regionId: selectedRegion.id, region: selectedRegion.code as RegionCode }
    : {};

  return {
    regions,
    regionsLoading,
    regionId,
    seasonValue,
    seasons: seasons ?? [],
    seasonsLoading: !!regionId && seasonsLoading,
    selectedRegion,
    seasonValueKey,
    setRegionId,
    setSeasonValue,
    initFromActiveRegion,
    regionPayload,
  };
}
