import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

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
const DEFAULT_REGION_CODE: RegionCode = "na";

export const RegionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState<RegionCode>(DEFAULT_REGION_CODE);

  const activeRegion = useMemo(() => {
    if (!regions.length) return null;
    return (
      regions.find((r) => r.code === selectedCode) ??
      regions.find((r) => r.code === DEFAULT_REGION_CODE) ??
      regions[0]
    );
  }, [regions, selectedCode]);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
    fetch(`${backendUrl}/api/regions`)
      .then((res) => res.json())
      .then((data: Region[]) => setRegions(data))
      .catch((err) => console.error("Failed to load regions:", err))
      .finally(() => setLoading(false));
  }, []);

  const setActiveRegion = useCallback((region: Region) => {
    setSelectedCode(region.code);
  }, []);

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
