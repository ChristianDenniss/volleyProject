import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTeamRegistrations, useRegistrationSummary } from "../../hooks/useTeamRegistrations";
import { authFetch } from "../../hooks/authFetch";
import { BACKEND_URL } from "../../constants/api";
import type { RegionCode, TeamRegistration } from "../../types/interfaces";
import { RegStatusBadge } from "../RegStatusBadge";
import Modal from "../ui/Modal";
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

  const closeConflicts = () => {
    setConflicts(null);
    setConflictId(null);
  };

  return (
    <div className="team-regs-page">
      <header className="team-regs-header">
        <div className="team-regs-header-body">
          <h1>Registrations</h1>
          <p>
            Manage team applications. Other registration types can be added here later.{" "}
            <Link to="/portal/teams">League teams CRUD</Link>
          </p>
          <p className="team-regs-spots">
            Teams · {region.toUpperCase()} · {header}
          </p>
        </div>
      </header>

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

      {msg && <p className={msg === "Updated" ? "form-success" : "form-error"}>{msg}</p>}
      {loading && <p className="team-regs-muted">Loading…</p>}
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
            {data.map((row: TeamRegistration) => {
              const isOpen = expanded === row.id;
              return (
                <React.Fragment key={row.id}>
                  <tr
                    className={`listing-row-clickable ${isOpen ? "selected listing-row-expanded" : ""}`}
                    onClick={() => setExpanded(isOpen ? null : row.id)}
                  >
                    <td className="team-name-cell">{row.teamName}</td>
                    <td>{row.submittedBy?.username || row.submittedByUserId}</td>
                    <td>
                      {row.captainDiscord} / {row.captainRoblox}
                    </td>
                    <td>
                      <RegStatusBadge status={row.status} />
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="listing-table-detail-row">
                      <td colSpan={4}>
                        <div className="team-regs-detail">
                          <dl className="team-regs-detail-stats">
                            <div className="team-regs-detail-stat">
                              <dt>Colors</dt>
                              <dd>
                                {row.hexColor && (
                                  <span
                                    className="team-regs-color-swatch"
                                    style={{ background: row.hexColor }}
                                    aria-hidden
                                  />
                                )}
                                {row.hexColor} · {row.brickColor}
                              </dd>
                            </div>
                            <div className="team-regs-detail-stat">
                              <dt>Vice</dt>
                              <dd>
                                {row.viceDiscord} / {row.viceRoblox}
                              </dd>
                            </div>
                          </dl>
                          <ul className="team-regs-roster">
                            {(row.roster || []).map((p, i) => (
                              <li key={i}>
                                <span className="team-regs-roster-label">P{i + 1}</span>
                                <span>{p.discord}</span>
                                <span className="team-regs-muted">·</span>
                                <span>{p.roblox}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="form-actions" style={{ justifyContent: "flex-start" }}>
                            {(row.status === "pending" || row.status === "conflict") && (
                              <>
                                <button
                                  type="button"
                                  className="team-regs-cta"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void act(row.id, "accept");
                                  }}
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  className="team-regs-cta team-regs-cta--danger"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void act(row.id, "deny");
                                  }}
                                >
                                  Deny
                                </button>
                              </>
                            )}
                            {row.status === "accepted" && (
                              <button
                                type="button"
                                className="team-regs-cta team-regs-cta--secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void act(row.id, "revoke");
                                }}
                              >
                                Revoke (while apps open)
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="listing-table-empty">
                  No registrations for this region.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={Boolean(conflicts && conflictId)}
        onClose={closeConflicts}
        title="Resolve conflicts"
      >
        <div className="team-regs-conflict-modal">
          <label>
            Team name
            <input value={rename} onChange={(e) => setRename(e.target.value)} />
          </label>
          <ul className="team-regs-conflict-list">
            {(conflicts || []).map((c, i) => (
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
            <button type="button" className="team-regs-cta" onClick={() => void resolve()}>
              Apply &amp; accept
            </button>
            <button
              type="button"
              className="team-regs-cta team-regs-cta--secondary"
              onClick={() => void resolve("pending")}
            >
              Revert pending
            </button>
            <button
              type="button"
              className="team-regs-cta team-regs-cta--danger"
              onClick={() => void resolve("denied")}
            >
              Deny
            </button>
            <button type="button" className="team-regs-cta team-regs-cta--secondary" onClick={closeConflicts}>
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RegistrationsHubPage;
