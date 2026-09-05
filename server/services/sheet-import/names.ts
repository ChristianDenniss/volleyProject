const NON_NAME = /[^\p{L}\p{N}\s._'-]+/gu;

/** Normalize team/player display names for matching. */
export function normalizeName(value: string): string {
  return value
    .normalize("NFKC")
    .replace(NON_NAME, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function displayName(value: string): string {
  return value
    .normalize("NFKC")
    .replace(NON_NAME, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SEASON_TEAMS_PREFIX =
  /^(?:season|chapter)\s+[ivxlcdm\d]+\s*[-–]\s*(?:n\.?\s*a\.?|e\.?\s*u\.?|a\.?\s*s\.?)?\s*teams?\s+/i;

/** Headers like `Teiko | 143 C VC` or `SEASON I - EU TEAMS Kaka | 11 C VC`. */
export function parseTeamHeader(raw: string): string | null {
  const cleaned = raw.replace(/\u00a0/g, " ").trim();
  if (!cleaned) return null;

  const pipe = cleaned.match(/^(.+?)\s*\|\s*\d+/);
  if (!pipe?.[1]) return null;

  let name = displayName(pipe[1]);
  // Master sheets often glue the region title onto the first team cell.
  if (SEASON_TEAMS_PREFIX.test(name)) {
    name = displayName(name.replace(SEASON_TEAMS_PREFIX, ""));
  }
  if (!name || name.length < 2 || name.length > 40) return null;
  if (/^\d+$/.test(name)) return null;
  // Reject bare section titles ("SEASON I - N.A TEAMS 00 | 112")
  if (/\b(season|chapter|teams|group|qualifiers?|playoffs?)\b/i.test(name)) return null;
  return name;
}

export function namesEqual(a: string, b: string): boolean {
  return normalizeName(a) === normalizeName(b);
}
