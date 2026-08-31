import type { TeamRegistrationStatus } from "../types/interfaces";

const STATUS_LABEL: Record<TeamRegistrationStatus, string> = {
  pending: "Pending",
  conflict: "Conflict",
  accepted: "Accepted",
  denied: "Denied",
};

export const REGISTRATION_STATUSES = Object.keys(STATUS_LABEL) as TeamRegistrationStatus[];

const badgeBase =
  "inline-flex items-center gap-[0.3rem] py-[0.25rem] px-[0.75rem] rounded-[999px] " +
  "text-[0.75rem] font-bold uppercase tracking-[0.04em] leading-[1.2] whitespace-nowrap";

const badgeByStatus: Record<TeamRegistrationStatus, string> = {
  pending: `${badgeBase} bg-[#fff3cd] text-[#856404]`,
  conflict: `${badgeBase} bg-[#ffe8cc] text-[#9a5b00]`,
  accepted: `${badgeBase} bg-[#d4edda] text-[#155724]`,
  denied: `${badgeBase} bg-[#f8d7da] text-[#721c24]`,
};

export function RegStatusBadge({ status }: { status: TeamRegistrationStatus }) {
  return <span className={badgeByStatus[status]}>{STATUS_LABEL[status]}</span>;
}
