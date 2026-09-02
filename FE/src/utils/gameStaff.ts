import type { GameStaffCredit, GameStaffRole } from "../types/interfaces";

export const GAME_STAFF_ROLES: GameStaffRole[] = ["referee", "streamer", "commentator"];

export const GAME_STAFF_LABELS: Record<GameStaffRole, string> = {
  referee: "Referee",
  streamer: "Streamer",
  commentator: "Commentator",
};

export const GAME_STAFF_SECTION: Record<GameStaffRole, string> = {
  referee: "Reffed",
  streamer: "Streamed",
  commentator: "Commentary",
};

export type StaffDraft = {
  userId: number;
  role: GameStaffRole;
  username: string;
};

export function staffCreditsToDraft(staff: GameStaffCredit[] | undefined): StaffDraft[] {
  return (staff ?? []).map((entry) => ({
    userId: entry.user.id,
    role: entry.role,
    username: entry.user.username,
  }));
}

export function staffDraftToPayload(draft: StaffDraft[]): { userId: number; role: GameStaffRole }[] {
  return draft.map(({ userId, role }) => ({ userId, role }));
}

export function formatStaffNames(staff: GameStaffCredit[] | undefined, role: GameStaffRole): string {
  const names = (staff ?? [])
    .filter((entry) => entry.role === role)
    .map((entry) => entry.user.username);
  return names.join(", ");
}
