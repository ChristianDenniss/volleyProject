import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useRegion } from "../context/regionContext";
import { authFetch } from "../hooks/authFetch";
import { BACKEND_URL } from "../constants/api";
import { useRegistrationSummary } from "../hooks/useTeamRegistrations";
import type { RegionCode, TeamRegistrationRosterEntry } from "../types/interfaces";
import "../styles/TeamRegistrations.css";

const emptyRoster = (): TeamRegistrationRosterEntry[] =>
  Array.from({ length: 10 }, () => ({ discord: "", roblox: "" }));

const TeamRegister: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { activeRegion } = useRegion();
  const navigate = useNavigate();
  const region = (activeRegion?.code || "na") as RegionCode;
  const summary = useRegistrationSummary(region);

  const [teamName, setTeamName] = useState("");
  const [hexColor, setHexColor] = useState("#2D3C50");
  const [brickColor, setBrickColor] = useState("");
  const [captainDiscord, setCaptainDiscord] = useState("");
  const [captainRoblox, setCaptainRoblox] = useState("");
  const [viceDiscord, setViceDiscord] = useState("");
  const [viceRoblox, setViceRoblox] = useState("");
  const [roster, setRoster] = useState(emptyRoster);
  const [agreeCivil, setAgreeCivil] = useState(false);
  const [confident, setConfident] = useState(false);
  const [experience, setExperience] = useState("");
  const [logoAck, setLogoAck] = useState(false);
  const [regionCode, setRegionCode] = useState<RegionCode>(region);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const startLabel = useMemo(() => {
    if (summary?.startDate) {
      try {
        return new Date(summary.startDate).toLocaleDateString();
      } catch {
        return "TBD";
      }
    }
    return "TBD";
  }, [summary?.startDate]);

  if (authLoading) return <div className="team-reg-form">Loading…</div>;

  if (!isAuthenticated) {
    return (
      <div className="team-reg-form">
        <h1>Register a team</h1>
        <p>
          You must be logged in to submit a team application.{" "}
          <Link to="/login">Log in</Link> or <Link to="/signup">sign up</Link>.
        </p>
      </div>
    );
  }

  const updateRoster = (index: number, field: "discord" | "roblox", value: string) => {
    setRoster((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const syncCaptainViceIntoRoster = (next: TeamRegistrationRosterEntry[]) => {
    const copy = [...next];
    if (captainDiscord && captainRoblox) {
      copy[0] = { discord: captainDiscord, roblox: captainRoblox };
    }
    if (viceDiscord && viceRoblox) {
      copy[1] = { discord: viceDiscord, roblox: viceRoblox };
    }
    return copy;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const body = {
        region: regionCode,
        teamName,
        hexColor: hexColor.startsWith("#") ? hexColor : `#${hexColor}`,
        brickColor,
        captainDiscord,
        captainRoblox,
        viceDiscord,
        viceRoblox,
        roster: syncCaptainViceIntoRoster(roster),
        agreeCivilScheduling: true as const,
        confidentWillParticipate: true as const,
        priorLeagueExperience: experience || null,
        logoJerseyAck: true as const,
      };

      if (!agreeCivil || !confident || !logoAck) {
        throw new Error("Please answer all required yes/no and acknowledgment questions");
      }

      const res = await authFetch(`${BACKEND_URL}/api/team-registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Submission failed");
      setSuccess("Application submitted!");
      navigate(`/teams/registrations/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="team-reg-form">
      <div className="team-regs-nav">
        <Link to="/teams">League teams</Link>
        <span>·</span>
        <Link to="/teams/registrations">Team registrations</Link>
        <span>·</span>
        <span className="team-regs-nav-active">Register a team</span>
      </div>

      <h1>Register your team</h1>
      <p>Anyone with a site account can submit. Season start: {startLabel}.</p>
      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}

      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>Eligibility</legend>
          <label>
            <input type="checkbox" checked={agreeCivil} onChange={(e) => setAgreeCivil(e.target.checked)} /> Do
            you understand and agree to be civil and accommodating when scheduling matches?
          </label>
          <label>
            <input type="checkbox" checked={confident} onChange={(e) => setConfident(e.target.checked)} /> This
            season is set to start on {startLabel}. Are you confident the team will still participate by then?
          </label>
          <label>
            Region
            <select value={regionCode} onChange={(e) => setRegionCode(e.target.value as RegionCode)}>
              <option value="na">NA</option>
              <option value="eu">EU</option>
              <option value="as">AS</option>
            </select>
          </label>
          <label>
            Prior competitive Roblox Volleyball leagues (optional)
            <textarea value={experience} onChange={(e) => setExperience(e.target.value)} rows={3} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Team</legend>
          <label>
            Team name
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} required />
          </label>
          <label>
            Hex color
            <input value={hexColor} onChange={(e) => setHexColor(e.target.value)} required pattern="#?[0-9A-Fa-f]{6}" />
          </label>
          <label>
            Brick color
            <input value={brickColor} onChange={(e) => setBrickColor(e.target.value)} required />
          </label>
          <label>
            <input type="checkbox" checked={logoAck} onChange={(e) => setLogoAck(e.target.checked)} /> I will
            prepare a logo &amp; jerseys if accepted to RVL
          </label>
        </fieldset>

        <fieldset>
          <legend>Captain &amp; Vice</legend>
          <label>
            Captain Discord
            <input value={captainDiscord} onChange={(e) => setCaptainDiscord(e.target.value)} required />
          </label>
          <label>
            Captain Roblox
            <input value={captainRoblox} onChange={(e) => setCaptainRoblox(e.target.value)} required />
          </label>
          <label>
            Vice Discord
            <input value={viceDiscord} onChange={(e) => setViceDiscord(e.target.value)} required />
          </label>
          <label>
            Vice Roblox
            <input value={viceRoblox} onChange={(e) => setViceRoblox(e.target.value)} required />
          </label>
        </fieldset>

        <fieldset>
          <legend>Roster (minimum 10, including captain &amp; vice)</legend>
          {roster.map((row, i) => (
            <div className="roster-row" key={i}>
              <input
                placeholder={`Player ${i + 1} Discord`}
                value={row.discord}
                onChange={(e) => updateRoster(i, "discord", e.target.value)}
                required
              />
              <input
                placeholder={`Player ${i + 1} Roblox`}
                value={row.roblox}
                onChange={(e) => updateRoster(i, "roblox", e.target.value)}
                required
              />
              {i >= 10 && (
                <button type="button" onClick={() => setRoster((r) => r.filter((_, idx) => idx !== i))}>
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setRoster((r) => [...r, { discord: "", roblox: "" }])}>
            Add player
          </button>
        </fieldset>

        <div className="form-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit application"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeamRegister;
