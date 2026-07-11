import React from "react";
import { useRegion } from "../context/regionContext";
import "../styles/RegionSwitcher.css";

const RegionSwitcher: React.FC = () => {
  const { regions, activeRegion, setActiveRegion, loading } = useRegion();

  if (loading || !activeRegion) return null;

  return (
    <div className="region-switcher">
      <label htmlFor="region-select" className="region-switcher-label">
        Region
      </label>
      <select
        id="region-select"
        className="region-switcher-select"
        value={activeRegion.code}
        onChange={(e) => {
          const next = regions.find((r) => r.code === e.target.value);
          if (next) setActiveRegion(next);
        }}
      >
        {regions.map((region) => (
          <option key={region.id} value={region.code}>
            {region.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default RegionSwitcher;
