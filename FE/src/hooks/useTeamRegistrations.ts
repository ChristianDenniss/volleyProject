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

export async function startRobloxOAuth(intent: "connect" | "signup" | "login") {
  const res = await authFetch(`${BACKEND_URL}/api/auth/roblox/start?intent=${intent}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to start Roblox OAuth");
  window.location.href = data.url;
}
