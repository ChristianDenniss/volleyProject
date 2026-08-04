import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authFetch } from "../hooks/authFetch";
import { BACKEND_URL } from "../constants/api";
import { useAuth } from "../context/authContext";
import type { TeamRegistration } from "../types/interfaces";
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

  if (loading) return <div className="team-reg-form">Loading…</div>;
  if (error || !row) return <div className="team-reg-form form-error">{error || "Not found"}</div>;

  const isOwner = isAuthenticated && user?.id === row.submittedByUserId;

  return (
    <div className="team-reg-form">
      <Link to="/teams/registrations">← Back to registrations</Link>
      <h1>{row.teamName}</h1>
      <p className={`status-${row.status}`}>Status: {row.status}</p>
      <p>
        Captain: {row.captainDiscord} / {row.captainRoblox}
      </p>
      {row.viceDiscord && (
        <p>
          Vice: {row.viceDiscord} / {row.viceRoblox}
        </p>
      )}
      {row.hexColor && (
        <p>
          Colors: <span style={{ color: row.hexColor }}>{row.hexColor}</span> / {row.brickColor}
        </p>
      )}
      {row.priorLeagueExperience && <p>Experience: {row.priorLeagueExperience}</p>}
      {row.roster && (
        <>
          <h2>Roster</h2>
          <ul>
            {row.roster.map((p, i) => (
              <li key={i}>
                {p.discord} — {p.roblox}
              </li>
            ))}
          </ul>
        </>
      )}
      {isOwner && (row.status === "pending" || row.status === "conflict") && (
        <button type="button" onClick={() => void withdraw()}>
          Withdraw application
        </button>
      )}
    </div>
  );
};

export default TeamRegistrationDetail;
