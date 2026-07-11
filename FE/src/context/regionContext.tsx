import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

export type RegionCode = "na" | "eu" | "as";

export interface Region {
  id: number;
  code: RegionCode;
  name: string;
  sortOrder: number;
}

interface RegionContextType {
  regions: Region[];
  activeRegion: Region | null;
  setActiveRegion: (region: Region) => void;
  regionQuery: { region?: RegionCode; regionId?: number };
  loading: boolean;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);
const STORAGE_KEY = "rvl-active-region";
const DEFAULT_REGION_CODE: RegionCode = "na";

export const RegionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);

  const urlRegion = searchParams.get("region")?.toLowerCase() as RegionCode | null;

  const activeRegion = useMemo(() => {
    if (!regions.length) return null;
    const stored = (localStorage.getItem(STORAGE_KEY) ?? DEFAULT_REGION_CODE) as RegionCode;
    const code = urlRegion ?? stored ?? DEFAULT_REGION_CODE;
    return regions.find((r) => r.code === code) ?? regions[0];
  }, [regions, urlRegion]);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
    fetch(`${backendUrl}/api/regions`)
      .then((res) => res.json())
      .then((data: Region[]) => setRegions(data))
      .catch((err) => console.error("Failed to load regions:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeRegion) return;
    localStorage.setItem(STORAGE_KEY, activeRegion.code);
    if (urlRegion !== activeRegion.code) {
      const next = new URLSearchParams(searchParams);
      next.set("region", activeRegion.code);
      setSearchParams(next, { replace: true });
    }
  }, [activeRegion, urlRegion, searchParams, setSearchParams]);

  const setActiveRegion = useCallback(
    (region: Region) => {
      localStorage.setItem(STORAGE_KEY, region.code);
      const next = new URLSearchParams(searchParams);
      next.set("region", region.code);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const regionQuery = useMemo(
    () => ({
      region: activeRegion?.code,
      regionId: activeRegion?.id,
    }),
    [activeRegion]
  );

  return (
    <RegionContext.Provider value={{ regions, activeRegion, setActiveRegion, regionQuery, loading }}>
      {children}
    </RegionContext.Provider>
  );
};

export const useRegion = (): RegionContextType => {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error("useRegion must be used within RegionProvider");
  return ctx;
};
