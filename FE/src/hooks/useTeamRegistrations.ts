import { authFetch } from "./authFetch";
import { BACKEND_URL } from "../constants/api";
import type { TeamRegistration, RegionCode } from "../types/interfaces";
import { useEffect, useState, useCallback } from "react";

export function useTeamRegistrations(params: {
  region?: RegionCode;
  seasonId?: number;
  full?: boolean;
}) {
  const [data, setData] = useState<TeamRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (params.region) q.set("region", params.region);
      if (params.seasonId) q.set("seasonId", String(params.seasonId));
      if (params.full) q.set("full", "1");
      const res = await authFetch(`${BACKEND_URL}/api/team-registrations?${q.toString()}`);
      if (!res.ok) throw new Error("Failed to load registrations");
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [params.region, params.seasonId, params.full]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}

/**
 * Loads a single registration by id, plus a `withdraw` action for the submitter.
 *
 * The detail page used to call `authFetch` inline; per CLAUDE.md Rule 3 the request belongs
 * here so the view stays render-only and the withdraw + reload sequence lives in one place.
 */
export function useTeamRegistration(id: string | undefined) {
  const [data, setData] = useState<TeamRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Not found");
      setLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(`${BACKEND_URL}/api/team-registrations/${id}`);
        if (!res.ok) throw new Error("Not found");
        const row = (await res.json()) as TeamRegistration;
        if (!cancelled) setData(row);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /** Resolves true when the registration was withdrawn (204 or 200). */
  const withdraw = useCallback(async (): Promise<boolean> => {
    if (!id) return false;
    const res = await authFetch(`${BACKEND_URL}/api/team-registrations/${id}`, {
      method: "DELETE",
    });
    return res.ok || res.status === 204;
  }, [id]);

  return { data, loading, error, withdraw };
}

export function useRegistrationSummary(region?: RegionCode) {
  const [summary, setSummary] = useState<{
    accepted: number;
    spotsLeft: number | null;
    capacity: number | null;
    seasonId: number | null;
    startDate?: string;
    registrationsOpen?: boolean;
    seasonNumber?: number;
  } | null>(null);

  useEffect(() => {
    const q = region ? `?region=${region}` : "";
    void fetch(`${BACKEND_URL}/api/team-registrations/summary${q}`)
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [region]);

  return summary;
}

/**
 * Submits a new team application.
 *
 * Returns the created registration's id so the caller can navigate straight to its detail
 * page. Errors surface through the thrown message, which the form renders inline.
 */
export function useSubmitTeamRegistration() {
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(async (body: Record<string, unknown>): Promise<number> => {
    setSubmitting(true);
    try {
      const res = await authFetch(`${BACKEND_URL}/api/team-registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Submission failed");
      return data.id as number;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submit, submitting };
}

/** A blocking conflict returned by the accept endpoint with a 409. */
export interface RegistrationConflict {
  type: string;
  teamName?: string;
  roblox?: string;
  existingTeamName?: string;
  existingTeamId?: number;
}

export type PlayerConflictAction = "transfer" | "exclude";

/**
 * Moderation actions for the portal's registrations hub: accept, deny, revoke, and the
 * conflict-resolution flow that `accept` can trigger.
 *
 * Accepting a registration can come back 409 with a list of conflicts (a duplicate team name,
 * or a player already rostered elsewhere). That is a normal outcome, not an error, so this hook
 * captures the conflicts into state for the caller to render a resolution dialog rather than
 * surfacing it as a failure. `onChanged` runs after any action that actually mutated something.
 */
export function useRegistrationModeration(onChanged: () => void | Promise<void>) {
  const [conflicts, setConflicts] = useState<RegistrationConflict[] | null>(null);
  const [conflictId, setConflictId] = useState<number | null>(null);
  const [conflictTeamName, setConflictTeamName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const act = useCallback(
    async (id: number, path: string, body?: unknown) => {
      setMessage(null);
      setErrorMessage(null);

      const res = await authFetch(`${BACKEND_URL}/api/team-registrations/${id}/${path}`, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = await res.json().catch(() => ({}));

      // 409 + conflicts is the "needs a decision" path, not a failure.
      if (res.status === 409 && payload.conflicts) {
        setConflictId(id);
        setConflicts(payload.conflicts as RegistrationConflict[]);
        setConflictTeamName(payload.registration?.teamName || "");
        return;
      }

      if (!res.ok) {
        setErrorMessage(payload.error || "Action failed");
        return;
      }

      setConflicts(null);
      setConflictId(null);
      setMessage("Updated");
      await onChanged();
    },
    [onChanged],
  );

  const closeConflicts = useCallback(() => {
    setConflicts(null);
    setConflictId(null);
  }, []);

  /** Pass a `decision` to short-circuit ("send back to pending" / "deny"), or omit it to
   *  apply the rename + per-player choices and accept. */
  const resolveConflicts = useCallback(
    async (
      decision?: "pending" | "denied",
      playerActions?: Record<string, PlayerConflictAction>,
    ) => {
      if (!conflictId) return;

      if (decision) {
        await act(conflictId, "resolve", { decision });
        return;
      }

      await act(conflictId, "resolve", {
        teamName: conflictTeamName || undefined,
        players: Object.entries(playerActions ?? {}).map(([roblox, action]) => ({
          roblox,
          action,
        })),
      });
    },
    [act, conflictId, conflictTeamName],
  );

  return {
    accept: (id: number) => act(id, "accept"),
    deny: (id: number) => act(id, "deny"),
    revoke: (id: number) => act(id, "revoke"),
    conflicts,
    conflictId,
    conflictTeamName,
    setConflictTeamName,
    resolveConflicts,
    closeConflicts,
    message,
    errorMessage,
  };
}

export async function startRobloxOAuth(intent: "connect" | "signup" | "login") {
  const res = await authFetch(`${BACKEND_URL}/api/auth/roblox/start?intent=${intent}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to start Roblox OAuth");
  window.location.href = data.url;
}
