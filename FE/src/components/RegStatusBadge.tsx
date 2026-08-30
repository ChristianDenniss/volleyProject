import type { TeamRegistrationStatus } from "../types/interfaces";

const STATUS_LABEL: Record<TeamRegistrationStatus, string> = {
  pending: "Pending",
  conflict: "Conflict",
  accepted: "Accepted",
  denied: "Denied",
};

export const REGISTRATION_STATUSES = Object.keys(STATUS_LABEL) as TeamRegistrationStatus[];

export function RegStatusBadge({ status }: { status: TeamRegistrationStatus }) {
  return <span className={`reg-status-badge ${status}`}>{STATUS_LABEL[status]}</span>;
}
