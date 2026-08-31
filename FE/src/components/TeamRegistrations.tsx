import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRegion } from "../context/regionContext";
import { useAuth } from "../context/authContext";
import { useTeamRegistrations, useRegistrationSummary } from "../hooks/useTeamRegistrations";
import type { RegionCode, TeamRegistration } from "../types/interfaces";
import { RegStatusBadge, REGISTRATION_STATUSES } from "./RegStatusBadge";
import {
  teamRegsPage,
  teamRegsNav,
  teamRegsNavActive,
  teamRegsHeader,
  teamRegsHeaderBody,
  teamRegsSpots,
  teamRegsMuted,
  teamRegsHeaderActions,
  teamRegsCta,
  teamRegsCtaSecondary,
  teamRegsLegend,
  teamRegsLegendItem,
  teamRegsRegionTabs,
  teamRegsRegionTab,
  teamRegsRegionTabActive,
  teamRegsError,
  teamRegsTableWrap,
  teamRegsTable,
  teamRegsTableRowClickable,
  teamRegsTableRowSelected,
  teamRegsTableRow,
  teamRegsDetailRow,
  teamRegsEmptyCell,
  teamRegsDetail,
  teamRegsDetailStats,
  teamRegsDetailStat,
  teamRegsColorSwatch,
} from "./teamRegClasses";

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
      ? `${summary.spotsLeft} team spot${summary.spotsLeft === 1 ? "" : "s"} left`
      : null;

  return (
    <div className={teamRegsPage}>
      <div className={teamRegsNav}>
        <Link to="/teams">League teams</Link>
        <span aria-hidden="true">·</span>
        <span className={teamRegsNavActive}>Team registrations</span>
        <span aria-hidden="true">·</span>
        <Link to="/teams/register">{isAuthenticated ? "Register a team" : "Log in to register"}</Link>
      </div>

      <header className={teamRegsHeader}>
        <div className={teamRegsHeaderBody}>
          <h1>Team registrations</h1>
          <p>
            Public applications for the current registration window. Select a row for a quick
            preview, or open full details.
          </p>
          <p className={teamRegsSpots}>{header}</p>
          {spotsLine && <p className={teamRegsMuted}>{spotsLine}</p>}
        </div>
        <div className={teamRegsHeaderActions}>
          <Link className={teamRegsCta} to="/teams/register">
            {isAuthenticated ? "Register a team" : "Log in to register"}
          </Link>
          <div className={teamRegsLegend} aria-label="Status legend">
            {REGISTRATION_STATUSES.map((status) => (
              <div className={teamRegsLegendItem} key={status}>
                <RegStatusBadge status={status} />
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className={teamRegsRegionTabs} role="tablist" aria-label="Region">
        {REGIONS.map((r) => (
          <button
            key={r.code}
            type="button"
            role="tab"
            aria-selected={activeCode === r.code}
            className={activeCode === r.code ? teamRegsRegionTabActive : teamRegsRegionTab}
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

      {loading && <p className={teamRegsMuted}>Loading registrations…</p>}
      {error && <p className={teamRegsError}>{error}</p>}

      {!loading && !error && (
        <div className={teamRegsTableWrap}>
          <table className={teamRegsTable}>
            <thead>
              <tr>
                <th>Team</th>
                <th>Captain Discord</th>
                <th>Captain Roblox</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const isSelected = selected?.id === row.id;
                return (
                  <React.Fragment key={row.id}>
                    <tr
                      className={isSelected ? teamRegsTableRowSelected : teamRegsTableRowClickable}
                      onClick={() => setSelected(isSelected ? null : row)}
                    >
                      <td className="team-name-cell">{row.teamName}</td>
                      <td>{row.captainDiscord}</td>
                      <td>{row.captainRoblox}</td>
                      <td>
                        <RegStatusBadge status={row.status} />
                      </td>
                    </tr>
                    {isSelected && (
                      <tr className={teamRegsDetailRow}>
                        <td colSpan={4}>
                          <div className={teamRegsDetail}>
                            <dl className={teamRegsDetailStats}>
                              <div className={teamRegsDetailStat}>
                                <dt>Status</dt>
                                <dd>
                                  <RegStatusBadge status={row.status} />
                                </dd>
                              </div>
                              <div className={teamRegsDetailStat}>
                                <dt>Captain</dt>
                                <dd>
                                  {row.captainDiscord} / {row.captainRoblox}
                                </dd>
                              </div>
                              {row.hexColor && (
                                <div className={teamRegsDetailStat}>
                                  <dt>Colors</dt>
                                  <dd>
                                    <span
                                      className={teamRegsColorSwatch}
                                      style={{ background: row.hexColor }}
                                      aria-hidden
                                    />
                                    {row.hexColor}
                                    {row.brickColor ? ` · ${row.brickColor}` : ""}
                                  </dd>
                                </div>
                              )}
                            </dl>
                            <Link className={teamRegsCtaSecondary} to={`/teams/registrations/${row.id}`}>
                              View full details
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {data.length === 0 && (
                <tr className={teamRegsTableRow}>
                  <td colSpan={4} className={teamRegsEmptyCell}>
                    No registrations yet for this region.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeamRegistrations;
