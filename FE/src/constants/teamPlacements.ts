/** Curated placement order, mirrored in BE/src/modules/teams/team.service.ts (PLACEMENT_ORDER). */
export const TEAM_PLACEMENTS = [
  "1st Place",
  "2nd Place",
  "3rd Place",
  "Top 4",
  "Top 6",
  "Top 8",
  "Top 12",
  "Top 16",
  "TBD",
  "Didnt make playoffs",
  "G.O.A.T.",
] as const;

/** Full placement options for admin create/edit forms (includes division variants). */
export const TEAM_PLACEMENT_OPTIONS = [
  "Didnt make playoffs",
  "TBD",
  "1st Place",
  "1st Place (D1)",
  "1st Place (D2)",
  "1st Place (D3)",
  "2nd Place",
  "2nd Place (D1)",
  "2nd Place (D2)",
  "2nd Place (D3)",
  "3rd Place",
  "3rd Place (D1)",
  "3rd Place (D2)",
  "3rd Place (D3)",
  "Top 4",
  "Top 6",
  "Top 8",
  "Top 12",
  "Top 16",
  "G.O.A.T.",
] as const;
