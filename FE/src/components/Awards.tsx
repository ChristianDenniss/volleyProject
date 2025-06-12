import React, { useMemo, useState, useEffect } from "react";
import { useAwards } from "../hooks/allFetch";
import { Link, useLocation } from "react-router-dom";
import "../styles/Awards.css";
import SeasonFilter from "./SeasonFilterBar";

const Awards: React.FC = () => {
  const { data, loading, error } = useAwards();
  const awards = data || [];
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string>("");
  const location = useLocation();

  // Handle pre-selected season from URL state
  useEffect(() => {
    if (location.state?.selectedSeason) {
      setSelectedSeason(location.state.selectedSeason);
    }
  }, [location.state]);

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
    <div className="volley-awards-container">
      <h1 className="volley-awards-header">All Awards</h1>
      <div className="volley-awards-controls">
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
      <div className="volley-awards-grid">
        {filteredAwards.map((award: any) => (
          <Link to={`/awards/${award.id}`} key={award.id} className="volley-award-item-link">
            <div className="volley-award-item" style={{ backgroundImage: `url(${award.imageUrl})` }}>
              <div className="volley-award-category">{award.type}</div>
              <Link to={`/seasons/${award.season?.id}`} className="volley-award-season-link">
                <div className="volley-award-season">Season {award.season?.seasonNumber}</div>
              </Link>
              <Link to={`/players/${award.players?.[0]?.id}`} className="volley-award-player-link">
                <div className="volley-award-winner">{award.players?.[0]?.name || "N/A"}</div>
              </Link>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Awards; 