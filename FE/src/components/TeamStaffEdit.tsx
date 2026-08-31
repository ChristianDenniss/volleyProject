import React, { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import { authFetch } from "../hooks/authFetch";
import { BACKEND_URL } from "../constants/api";
import type { Team, Player } from "../types/interfaces";
import { rosterRow, formActions } from "./teamRegClasses";

const TeamStaffEdit: React.FC<{ team: Team; onUpdated?: (t: Team) => void }> = ({ team, onUpdated }) => {
  const { user, isAuthenticated } = useAuth();
  const [meta, setMeta] = useState<{ captainCanEdit?: boolean; staffRole?: string | null } | null>(null);
  const [name, setName] = useState(team.name);
  const [hexColor, setHexColor] = useState(team.hexColor || "#2D3C50");
  const [brickColor, setBrickColor] = useState(team.brickColor || "");
  const [logoUrl, setLogoUrl] = useState(team.logoUrl || "");
  const [roster, setRoster] = useState(
    (team.players || []).map((p: Player) => ({
      discord: p.discordUsername || "",
      roblox: p.robloxUsername || p.name,
    }))
  );
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    void (async () => {
      const res = await authFetch(`${BACKEND_URL}/api/teams/${team.id}`);
      if (!res.ok) return;
      const data = await res.json();
      // compute can-edit client-side from ownership if API doesn't enrich
      const isStaff =
        data.captainUserId === user.id ||
        data.viceCaptainUserId === user.id ||
        data.courtCaptainUserId === user.id;
      const seasonOk = data.season?.captainEditEnabled !== false;
      const teamOk = data.captainEditEnabled !== false;
      setMeta({
        captainCanEdit: Boolean(isStaff && seasonOk && teamOk),
        staffRole:
          data.captainUserId === user.id
            ? "captain"
            : data.viceCaptainUserId === user.id
              ? "vice_captain"
              : data.courtCaptainUserId === user.id
                ? "court_captain"
                : null,
      });
    })();
  }, [team.id, isAuthenticated, user]);

  if (!meta?.captainCanEdit) {
    if (user && (team.captainUserId === user.id || team.viceCaptainUserId === user.id || team.courtCaptainUserId === user.id)) {
      return <p className="text-[#6b7280] italic">Team editing is locked for this season or team.</p>;
    }
    return null;
  }

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const body: Record<string, unknown> = {
        hexColor: hexColor.startsWith("#") ? hexColor : `#${hexColor}`,
        brickColor,
        logoUrl: logoUrl || null,
        roster,
      };
      if (meta.staffRole === "captain") body.name = name;

      const res = await authFetch(`${BACKEND_URL}/api/teams/${team.id}/staff`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMessage("Saved");
      onUpdated?.(data);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="team-staff-edit" style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #ddd" }}>
      <h3>Edit team ({meta.staffRole})</h3>
      {meta.staffRole === "captain" && (
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
      )}
      <label>
        Hex
        <input value={hexColor} onChange={(e) => setHexColor(e.target.value)} />
      </label>
      <label>
        Brick
        <input value={brickColor} onChange={(e) => setBrickColor(e.target.value)} />
      </label>
      <label>
        Logo URL
        <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
      </label>
      <h4>Roster</h4>
      {roster.map((row, i) => (
        <div key={i} className={rosterRow}>
          <input
            value={row.discord}
            placeholder="Discord"
            onChange={(e) =>
              setRoster((r) => r.map((x, idx) => (idx === i ? { ...x, discord: e.target.value } : x)))
            }
          />
          <input
            value={row.roblox}
            placeholder="Roblox"
            onChange={(e) =>
              setRoster((r) => r.map((x, idx) => (idx === i ? { ...x, roblox: e.target.value } : x)))
            }
          />
        </div>
      ))}
      <button type="button" onClick={() => setRoster((r) => [...r, { discord: "", roblox: "" }])}>
        Add player
      </button>
      <div className={formActions}>
        <button type="button" disabled={saving} onClick={() => void save()}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
      {message && <p>{message}</p>}
    </section>
  );
};

export default TeamStaffEdit;
