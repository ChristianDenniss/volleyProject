import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTeamRegistrations, useRegistrationSummary } from "../../hooks/useTeamRegistrations";
import { authFetch } from "../../hooks/authFetch";
import { BACKEND_URL } from "../../constants/api";
import type { RegionCode, TeamRegistration } from "../../types/interfaces";
import "../../styles/TeamRegistrations.css";

type Conflict = {
  type: string;
  teamName?: string;
  roblox?: string;
  existingTeamName?: string;
  existingTeamId?: number;
};

const RegistrationsHubPage: React.FC = () => {
  const [region, setRegion] = useState<RegionCode>("na");
  const { data, loading, error, reload } = useTeamRegistrations({ region, full: true });
  const summary = useRegistrationSummary(region);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null);
  const [conflictId, setConflictId] = useState<number | null>(null);
  const [rename, setRename] = useState("");
  const [playerActions, setPlayerActions] = useState<Record<string, "transfer" | "exclude">>({});
  const [msg, setMsg] = useState<string | null>(null);

  const header = useMemo(() => {
    if (!summary) return "Accepted —";
    if (summary.capacity != null) return `Accepted ${summary.accepted}/${summary.capacity}`;
    return `Accepted ${summary.accepted}`;
  }, [summary]);

  const act = async (id: number, path: string, body?: unknown) => {
    setMsg(null);
    const res = await authFetch(`${BACKEND_URL}/api/team-registrations/${id}/${path}`, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 409 && data.conflicts) {
      setConflictId(id);
      setConflicts(data.conflicts);
      setRename(data.registration?.teamName || "");
      return;
    }
    if (!res.ok) {
      setMsg(data.error || "Action failed");
      return;
    }
    setConflicts(null);
    setConflictId(null);
    setMsg("Updated");
    await reload();
  };

  const resolve = async (decision?: "pending" | "denied") => {
    if (!conflictId) return;
    if (decision) {
      await act(conflictId, "resolve", { decision });
      return;
    }
    const players = Object.entries(playerActions).map(([roblox, action]) => ({ roblox, action }));
    await act(conflictId, "resolve", { teamName: rename || undefined, players });
  };

  return (
    <div className="team-regs-page">
      <h1>Registrations</h1>
      <p>
        Manage team applications. Other registration types can be added here later.{" "}
        <Link to="/portal/teams">League teams CRUD</Link>
      </p>

      <div className="team-regs-region-tabs">
        {(["na", "eu", "as"] as RegionCode[]).map((r) => (
          <button
            key={r}
            type="button"
            className={region === r ? "active" : undefined}
            onClick={() => {
              setRegion(r);
              setExpanded(null);
            }}
          >
            {r.toUpperCase()}
          </button>
        ))}
      </div>

      <h2>Teams · {region.toUpperCase()}</h2>
      <p>{header}</p>
      {msg && <p>{msg}</p>}
      {loading && <p>Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="team-regs-table-wrap">
        <table className="team-regs-table">
          <thead>
            <tr>
              <th>Team</th>
              <th>Submitter</th>
              <th>Captain</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row: TeamRegistration) => (
              <React.Fragment key={row.id}>
                <tr
                  className={`status-${row.status}`}
                  onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                >
                  <td>{row.teamName}</td>
                  <td>{row.submittedBy?.username || row.submittedByUserId}</td>
                  <td>
                    {row.captainDiscord} / {row.captainRoblox}
                  </td>
                  <td>{row.status}</td>
                </tr>
                {expanded === row.id && (
                  <tr className={`status-${row.status}`}>
                    <td colSpan={4}>
                      <div className="team-regs-detail">
                        <p>
                          Hex {row.hexColor} · Brick {row.brickColor}
                        </p>
                        <p>
                          Vice: {row.viceDiscord} / {row.viceRoblox}
                        </p>
                        <ul>
                          {(row.roster || []).map((p, i) => (
                            <li key={i}>
                              {p.discord} — {p.roblox}
                            </li>
                          ))}
                        </ul>
                        <div className="form-actions">
                          {(row.status === "pending" || row.status === "conflict") && (
                            <>
                              <button type="button" onClick={() => void act(row.id, "accept")}>
                                Accept
                              </button>
                              <button type="button" onClick={() => void act(row.id, "deny")}>
                                Deny
                              </button>
                            </>
                          )}
                          {row.status === "accepted" && (
                            <button type="button" onClick={() => void act(row.id, "revoke")}>
                              Revoke (while apps open)
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {conflicts && conflictId && (
        <div className="ui-modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "grid", placeItems: "center", zIndex: 50 }}>
          <div className="ui-modal" style={{ background: "#fff", padding: "1.25rem", maxWidth: 520, width: "90%" }}>
            <h3>Resolve conflicts</h3>
            <label>
              Team name
              <input value={rename} onChange={(e) => setRename(e.target.value)} />
            </label>
            <ul>
              {conflicts.map((c, i) => (
                <li key={i}>
                  {c.type === "name" && <>Name clash: {c.teamName}</>}
                  {c.type === "player" && (
                    <>
                      Player {c.roblox} on {c.existingTeamName}{" "}
                      <select
                        value={playerActions[c.roblox!] || ""}
                        onChange={(e) =>
                          setPlayerActions((prev) => ({
                            ...prev,
                            [c.roblox!]: e.target.value as "transfer" | "exclude",
                          }))
                        }
                      >
                        <option value="">Choose…</option>
                        <option value="transfer">Transfer</option>
                        <option value="exclude">Exclude</option>
                      </select>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <div className="form-actions">
              <button type="button" onClick={() => void resolve()}>
                Apply &amp; accept
              </button>
              <button type="button" onClick={() => void resolve("pending")}>
                Revert pending
              </button>
              <button type="button" onClick={() => void resolve("denied")}>
                Deny
              </button>
              <button type="button" onClick={() => { setConflicts(null); setConflictId(null); }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationsHubPage;
