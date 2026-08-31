import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useRegion } from "../context/regionContext";
import { authFetch } from "../hooks/authFetch";
import { BACKEND_URL } from "../constants/api";
import { useRegistrationSummary } from "../hooks/useTeamRegistrations";
import type { RegionCode, TeamRegistrationRosterEntry } from "../types/interfaces";
import {
  teamRegForm,
  teamRegsNav,
  teamRegsNavActive,
  teamRegCard,
  teamRegCardH1,
  teamRegGate,
  teamRegGateMuted,
  teamRegGateP,
  teamRegGateLinks,
  teamRegsCta,
  teamRegsCtaSecondary,
  teamRegsMuted,
  teamRegsMutedLead,
  teamRegsError,
  teamRegsSuccess,
  teamRegSection,
  teamRegFormCheck,
  teamRegFormGroup,
  teamRegColorRow,
  rosterRow,
  rosterRowRemove,
  formActions,
} from "./teamRegClasses";

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

  if (authLoading) {
    return (
      <div className={teamRegForm}>
        <div className={teamRegGate}>
          <p className={teamRegGateMuted}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={teamRegForm}>
        <div className={teamRegsNav}>
          <Link to="/teams">League teams</Link>
          <span aria-hidden="true">·</span>
          <Link to="/teams/registrations">Team registrations</Link>
          <span aria-hidden="true">·</span>
          <span className={teamRegsNavActive}>Register a team</span>
        </div>
        <div className={teamRegGate}>
          <h1 className={teamRegCardH1}>Register a team</h1>
          <p className={teamRegGateP}>You must be logged in to submit a team application.</p>
          <div className={teamRegGateLinks}>
            <Link className={teamRegsCta} to="/login">
              Log in
            </Link>
            <Link className={teamRegsCtaSecondary} to="/signup">
              Sign up
            </Link>
          </div>
        </div>
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

  const normalizedHex = hexColor.startsWith("#") ? hexColor : `#${hexColor}`;

  return (
    <div className={teamRegForm}>
      <div className={teamRegsNav}>
        <Link to="/teams">League teams</Link>
        <span aria-hidden="true">·</span>
        <Link to="/teams/registrations">Team registrations</Link>
        <span aria-hidden="true">·</span>
        <span className={teamRegsNavActive}>Register a team</span>
      </div>

      <div className={teamRegCard}>
        <h1 className={teamRegCardH1}>Register your team</h1>
        <p className={teamRegsMutedLead}>
          Anyone with a site account can submit. Season start: <strong>{startLabel}</strong>.
        </p>

        {error && <p className={teamRegsError}>{error}</p>}
        {success && <p className={teamRegsSuccess}>{success}</p>}

        <form onSubmit={handleSubmit}>
          <section className={teamRegSection}>
            <h2>Eligibility</h2>
            <label className={teamRegFormCheck}>
              <input type="checkbox" checked={agreeCivil} onChange={(e) => setAgreeCivil(e.target.checked)} />
              <span>I understand and agree to be civil and accommodating when scheduling matches.</span>
            </label>
            <label className={teamRegFormCheck}>
              <input type="checkbox" checked={confident} onChange={(e) => setConfident(e.target.checked)} />
              <span>
                This season is set to start on {startLabel}. I am confident the team will still participate by then.
              </span>
            </label>
            <div className={teamRegFormGroup}>
              <label htmlFor="team-reg-region">Region</label>
              <select
                id="team-reg-region"
                value={regionCode}
                onChange={(e) => setRegionCode(e.target.value as RegionCode)}
              >
                <option value="na">North American (NA)</option>
                <option value="eu">European (EU)</option>
                <option value="as">Asian (AS)</option>
              </select>
            </div>
            <div className={teamRegFormGroup}>
              <label htmlFor="team-reg-experience">Prior competitive Roblox Volleyball leagues (optional)</label>
              <textarea
                id="team-reg-experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                rows={3}
                placeholder="e.g. previous RVL seasons, other leagues…"
              />
            </div>
          </section>

          <section className={teamRegSection}>
            <h2>Team</h2>
            <div className={teamRegFormGroup}>
              <label htmlFor="team-reg-name">Team name</label>
              <input
                id="team-reg-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
              />
            </div>
            <div className={teamRegFormGroup}>
              <label htmlFor="team-reg-hex">Hex color</label>
              <div className={teamRegColorRow}>
                <input
                  type="color"
                  aria-label="Pick hex color"
                  value={/^#[0-9A-Fa-f]{6}$/.test(normalizedHex) ? normalizedHex : "#2D3C50"}
                  onChange={(e) => setHexColor(e.target.value)}
                />
                <input
                  id="team-reg-hex"
                  value={hexColor}
                  onChange={(e) => setHexColor(e.target.value)}
                  required
                  pattern="#?[0-9A-Fa-f]{6}"
                  placeholder="#2D3C50"
                />
              </div>
            </div>
            <div className={teamRegFormGroup}>
              <label htmlFor="team-reg-brick">Brick color</label>
              <input
                id="team-reg-brick"
                value={brickColor}
                onChange={(e) => setBrickColor(e.target.value)}
                required
                placeholder="Roblox brick color name"
              />
            </div>
            <label className={teamRegFormCheck}>
              <input type="checkbox" checked={logoAck} onChange={(e) => setLogoAck(e.target.checked)} />
              <span>I will prepare a logo &amp; jerseys if accepted to RVL</span>
            </label>
          </section>

          <section className={teamRegSection}>
            <h2>Captain &amp; Vice</h2>
            <div className={teamRegFormGroup}>
              <label htmlFor="team-reg-cap-discord">Captain Discord</label>
              <input
                id="team-reg-cap-discord"
                value={captainDiscord}
                onChange={(e) => setCaptainDiscord(e.target.value)}
                required
              />
            </div>
            <div className={teamRegFormGroup}>
              <label htmlFor="team-reg-cap-roblox">Captain Roblox</label>
              <input
                id="team-reg-cap-roblox"
                value={captainRoblox}
                onChange={(e) => setCaptainRoblox(e.target.value)}
                required
              />
            </div>
            <div className={teamRegFormGroup}>
              <label htmlFor="team-reg-vice-discord">Vice Discord</label>
              <input
                id="team-reg-vice-discord"
                value={viceDiscord}
                onChange={(e) => setViceDiscord(e.target.value)}
                required
              />
            </div>
            <div className={teamRegFormGroup}>
              <label htmlFor="team-reg-vice-roblox">Vice Roblox</label>
              <input
                id="team-reg-vice-roblox"
                value={viceRoblox}
                onChange={(e) => setViceRoblox(e.target.value)}
                required
              />
            </div>
          </section>

          <section className={teamRegSection}>
            <h2>Roster</h2>
            <p className={`${teamRegsMuted} mb-[1rem]`}>
              Minimum 10 players, including captain &amp; vice (rows 1–2).
            </p>
            {roster.map((row, i) => (
              <div className={rosterRow} key={i}>
                <input
                  placeholder={`Player ${i + 1} Discord`}
                  aria-label={`Player ${i + 1} Discord`}
                  value={row.discord}
                  onChange={(e) => updateRoster(i, "discord", e.target.value)}
                  required
                />
                <input
                  placeholder={`Player ${i + 1} Roblox`}
                  aria-label={`Player ${i + 1} Roblox`}
                  value={row.roblox}
                  onChange={(e) => updateRoster(i, "roblox", e.target.value)}
                  required
                />
                {i >= 10 && (
                  <button
                    type="button"
                    className={rosterRowRemove}
                    onClick={() => setRoster((r) => r.filter((_, idx) => idx !== i))}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className={teamRegsCtaSecondary}
              onClick={() => setRoster((r) => [...r, { discord: "", roblox: "" }])}
            >
              Add player
            </button>
          </section>

          <div className={formActions}>
            <Link className={teamRegsCtaSecondary} to="/teams/registrations">
              Cancel
            </Link>
            <button className={teamRegsCta} type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamRegister;
