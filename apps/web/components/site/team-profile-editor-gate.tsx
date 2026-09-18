"use client";

import { trpc } from "@/lib/trpc";
import { TeamProfileEditor } from "./team-profile-editor";
import { useLiveSession } from "./use-live-session";

export function TeamProfileEditorGate({
  teamId,
  teamName,
  logoUrl,
  description,
}: {
  teamId: number;
  teamName: string;
  logoUrl: string | null;
  description: string | null;
}) {
  const live = useLiveSession();
  const allowed = trpc.teams.canManageProfile.useQuery(
    { id: teamId },
    { enabled: live.isSignedIn === true },
  );

  if (allowed.data !== true) return null;

  return (
    <TeamProfileEditor
      teamId={teamId}
      teamName={teamName}
      logoUrl={logoUrl}
      description={description}
    />
  );
}
