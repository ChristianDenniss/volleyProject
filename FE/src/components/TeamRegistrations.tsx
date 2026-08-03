import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRegion } from "../context/regionContext";
import { useAuth } from "../context/authContext";
import { useTeamRegistrations, useRegistrationSummary } from "../hooks/useTeamRegistrations";
import type { RegionCode, TeamRegistration } from "../types/interfaces";
import "../styles/TeamRegistrations.css";

const REGIONS: { code: RegionCode; label: string }[] = [
  { code: "na", label: "NA" },
  { code: "eu", label: "EU" },
  { code: "as", label: "AS" },
];

const TeamRegistrations: React.FC = () => {
  const { regions, setActiveRegion, activeRegion } = useRegion();
  const { isAuthenticated } = useAuth();
  const activeCode = (activeRegion?.code || "na") as RegionCode;
  const { data, loading, error } = useTeamRegistrations({ region: activeCode });
  const summary = useRegistrationSummary(activeCode);
  const [selected, setSelected] = useState<TeamRegistration | null>(null);

  const header = useMemo(() => {
    if (!summary) return "Accepted teams";
    if (summary.capacity != null) {
      return `Accepted teams ${summary.accepted}/${summary.capacity}`;
    }
    return `Accepted teams ${summary.accepted}`;
  }, [summary]);

  const spotsLine =
    summary?.spotsLeft != null
      ? `${summary.spotsLeft} team spot${summary.spotsLeft === 1 ? "" : "s"} left…`
      : null;

  return (
    <div className="team-regs-page">
      <div className="team-regs-nav">
        <Link to="/teams">League teams</Link>
        <span aria-hidden="true">·</span>
        <span className="team-regs-nav-active">Team registrations</span>
        <span aria-hidden="true">·</span>
        <Link to="/teams/register">{isAuthenticated ? "Register a team" : "Log in to register"}</Link>
      </div>

      <header className="team-regs-header">
        <h1>Team registrations</h1>
        <p>{header}</p>
        {spotsLine && <p className="team-regs-spots">{spotsLine}</p>}
      </header>

      <div className="team-regs-region-tabs" role="tablist">
        {REGIONS.map((r) => (
          <button
            key={r.code}
            type="button"
            role="tab"
            aria-selected={activeCode === r.code}
            className={activeCode === r.code ? "active" : undefined}
            onClick={() => {
              setSelected(null);
              const match = regions.find((x) => x.code === r.code);
              if (match) setActiveRegion(match);
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="team-regs-error">{error}</p>}

      {!loading && !error && (
        <div className="team-regs-table-wrap">
          <table className="team-regs-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Captain Discord</th>
                <th>Captain Roblox</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr
                  key={row.id}
                  className={`status-${row.status} ${selected?.id === row.id ? "selected" : ""}`}
                  onClick={() => setSelected(selected?.id === row.id ? null : row)}
                >
                  <td>{row.teamName}</td>
                  <td>{row.captainDiscord}</td>
                  <td>{row.captainRoblox}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={4}>No registrations yet for this region.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="team-regs-detail">
          <h2>{selected.teamName}</h2>
          <p>
            Status: <strong>{selected.status}</strong>
          </p>
          <p>
            Captain: {selected.captainDiscord} / {selected.captainRoblox}
          </p>
          <Link to={`/teams/registrations/${selected.id}`}>View full details</Link>
        </div>
      )}
    </div>
  );
};

export default TeamRegistrations;
