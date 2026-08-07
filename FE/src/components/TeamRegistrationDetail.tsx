import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authFetch } from "../hooks/authFetch";
import { BACKEND_URL } from "../constants/api";
import { useAuth } from "../context/authContext";
import type { TeamRegistration } from "../types/interfaces";
import { RegStatusBadge } from "./RegStatusBadge";
import "../styles/TeamRegistrations.css";

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
      <div className="team-reg-form">
        <div className="team-reg-card team-reg-gate">
          <p className="team-regs-muted">Loading…</p>
        </div>
      </div>
    );
  }

  if (error || !row) {
    return (
      <div className="team-reg-form">
        <div className="team-reg-card">
          <Link className="team-reg-back" to="/teams/registrations">
            ← Back to registrations
          </Link>
          <p className="form-error">{error || "Not found"}</p>
        </div>
      </div>
    );
  }

  const isOwner = isAuthenticated && user?.id === row.submittedByUserId;

  return (
    <div className="team-reg-form">
      <div className="team-regs-nav">
        <Link to="/teams">League teams</Link>
        <span aria-hidden="true">·</span>
        <Link to="/teams/registrations">Team registrations</Link>
        <span aria-hidden="true">·</span>
        <span className="team-regs-nav-active">{row.teamName}</span>
      </div>

      <div className="team-reg-card">
        <Link className="team-reg-back" to="/teams/registrations">
          ← Back to registrations
        </Link>

        <div className="team-reg-detail-title-row">
          <h1>{row.teamName}</h1>
          <RegStatusBadge status={row.status} />
        </div>

        <dl className="team-regs-detail-stats" style={{ margin: "1.25rem 0" }}>
          <div className="team-regs-detail-stat">
            <dt>Captain</dt>
            <dd>
              {row.captainDiscord} / {row.captainRoblox}
            </dd>
          </div>
          {(row.viceDiscord || row.viceRoblox) && (
            <div className="team-regs-detail-stat">
              <dt>Vice captain</dt>
              <dd>
                {row.viceDiscord} / {row.viceRoblox}
              </dd>
            </div>
          )}
          {row.hexColor && (
            <div className="team-regs-detail-stat">
              <dt>Colors</dt>
              <dd>
                <span className="team-regs-color-swatch" style={{ background: row.hexColor }} aria-hidden />
                {row.hexColor}
                {row.brickColor ? ` · ${row.brickColor}` : ""}
              </dd>
            </div>
          )}
          {row.priorLeagueExperience && (
            <div className="team-regs-detail-stat team-regs-detail-stat--wide">
              <dt>Prior experience</dt>
              <dd>{row.priorLeagueExperience}</dd>
            </div>
          )}
        </dl>

        {row.roster && row.roster.length > 0 && (
          <section className="team-reg-section">
            <h2>Roster</h2>
            <ul className="team-regs-roster">
              {row.roster.map((p, i) => (
                <li key={i}>
                  <span className="team-regs-roster-label">P{i + 1}</span>
                  <span>{p.discord}</span>
                  <span className="team-regs-muted">·</span>
                  <span>{p.roblox}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {isOwner && (row.status === "pending" || row.status === "conflict") && (
          <div className="form-actions">
            <button type="button" className="team-regs-cta team-regs-cta--danger" onClick={() => void withdraw()}>
              Withdraw application
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamRegistrationDetail;
