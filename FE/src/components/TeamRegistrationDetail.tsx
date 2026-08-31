import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authFetch } from "../hooks/authFetch";
import { BACKEND_URL } from "../constants/api";
import { useAuth } from "../context/authContext";
import type { TeamRegistration } from "../types/interfaces";
import { RegStatusBadge } from "./RegStatusBadge";
import {
  teamRegForm,
  teamRegGate,
  teamRegGateMuted,
  teamRegCard,
  teamRegBack,
  teamRegsError,
  teamRegsNav,
  teamRegsNavActive,
  teamRegDetailTitleRow,
  teamRegsDetailStatsSpaced,
  teamRegsDetailStat,
  teamRegsDetailStatWide,
  teamRegsColorSwatch,
  teamRegSection,
  teamRegsRoster,
  teamRegsRosterLabel,
  teamRegsMuted,
  formActions,
  teamRegsCtaDanger,
} from "./teamRegClasses";

const TeamRegistrationDetail: React.FC = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [row, setRow] = useState<TeamRegistration | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await authFetch(`${BACKEND_URL}/api/team-registrations/${id}`);
        if (!res.ok) throw new Error("Not found");
        setRow(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const withdraw = async () => {
    if (!confirm("Withdraw this application?")) return;
    const res = await authFetch(`${BACKEND_URL}/api/team-registrations/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) navigate("/teams/registrations");
  };

  if (loading) {
    return (
      <div className={teamRegForm}>
        <div className={teamRegGate}>
          <p className={teamRegGateMuted}>Loading…</p>
        </div>
      </div>
    );
  }

  if (error || !row) {
    return (
      <div className={teamRegForm}>
        <div className={teamRegCard}>
          <Link className={teamRegBack} to="/teams/registrations">
            ← Back to registrations
          </Link>
          <p className={teamRegsError}>{error || "Not found"}</p>
        </div>
      </div>
    );
  }

  const isOwner = isAuthenticated && user?.id === row.submittedByUserId;

  return (
    <div className={teamRegForm}>
      <div className={teamRegsNav}>
        <Link to="/teams">League teams</Link>
        <span aria-hidden="true">·</span>
        <Link to="/teams/registrations">Team registrations</Link>
        <span aria-hidden="true">·</span>
        <span className={teamRegsNavActive}>{row.teamName}</span>
      </div>

      <div className={teamRegCard}>
        <Link className={teamRegBack} to="/teams/registrations">
          ← Back to registrations
        </Link>

        <div className={teamRegDetailTitleRow}>
          <h1>{row.teamName}</h1>
          <RegStatusBadge status={row.status} />
        </div>

        <dl className={teamRegsDetailStatsSpaced}>
          <div className={teamRegsDetailStat}>
            <dt>Captain</dt>
            <dd>
              {row.captainDiscord} / {row.captainRoblox}
            </dd>
          </div>
          {(row.viceDiscord || row.viceRoblox) && (
            <div className={teamRegsDetailStat}>
              <dt>Vice captain</dt>
              <dd>
                {row.viceDiscord} / {row.viceRoblox}
              </dd>
            </div>
          )}
          {row.hexColor && (
            <div className={teamRegsDetailStat}>
              <dt>Colors</dt>
              <dd>
                <span className={teamRegsColorSwatch} style={{ background: row.hexColor }} aria-hidden />
                {row.hexColor}
                {row.brickColor ? ` · ${row.brickColor}` : ""}
              </dd>
            </div>
          )}
          {row.priorLeagueExperience && (
            <div className={teamRegsDetailStatWide}>
              <dt>Prior experience</dt>
              <dd>{row.priorLeagueExperience}</dd>
            </div>
          )}
        </dl>

        {row.roster && row.roster.length > 0 && (
          <section className={teamRegSection}>
            <h2>Roster</h2>
            <ul className={teamRegsRoster}>
              {row.roster.map((p, i) => (
                <li key={i}>
                  <span className={teamRegsRosterLabel}>P{i + 1}</span>
                  <span>{p.discord}</span>
                  <span className={teamRegsMuted}>·</span>
                  <span>{p.roblox}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {isOwner && (row.status === "pending" || row.status === "conflict") && (
          <div className={formActions}>
            <button type="button" className={teamRegsCtaDanger} onClick={() => void withdraw()}>
              Withdraw application
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamRegistrationDetail;
