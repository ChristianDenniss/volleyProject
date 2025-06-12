import React, { useMemo, useState } from "react";
import { useAwards } from "../hooks/allFetch";
import "../styles/Awards.css";
import SeasonFilter from "./SeasonFilterBar";

const Awards: React.FC = () => {
  const { data, loading, error } = useAwards();
  const awards = data || [];
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string>("");

  // Extract unique award types from the data
  const uniqueTypes = useMemo(() => {
    const types = awards.map((a: any) => a.type).filter(Boolean);
    return Array.from(new Set(types)).sort();
  }, [awards]);

  // Filter awards by selected season and type
  const filteredAwards = useMemo(() => {
    return awards.filter((award: any) => {
      const matchesSeason = selectedSeason === null || award.season?.seasonNumber === selectedSeason;
      const matchesType = !selectedType || award.type === selectedType;
      return matchesSeason && matchesType;
    });
  }, [awards, selectedSeason, selectedType]);

  return (
    <div className="awards-page">
      <h1 className="awards-title">All Awards</h1>
      <div className="awards-filter-bar">
        <SeasonFilter selectedSeason={selectedSeason} onSeasonChange={setSelectedSeason} />
        <label htmlFor="award-type-select" style={{ marginRight: 8 }}>Award Type:</label>
        <select
          id="award-type-select"
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
        >
          <option value="">All Types</option>
          {uniqueTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      {loading && <p>Loading awards…</p>}
      {error && <p>Error: {error}</p>}
      {!loading && !error && filteredAwards.length === 0 && <p>No awards found.</p>}
      <div className="awards-grid">
        {filteredAwards.map((award: any) => (
          <div key={award.id} className="award-card">
            <div className="award-type">{award.type}</div>
            <div className="award-player">{award.players?.[0]?.name || "N/A"}</div>
            <div className="award-season">Season {award.season?.seasonNumber}</div>
            <div className="award-details-box">
              <div className="award-description">{award.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Awards; 