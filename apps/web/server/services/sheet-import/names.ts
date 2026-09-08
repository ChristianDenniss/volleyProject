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
  /^(?:(?:season|chapter)\s+[ivxlcdm\d]+\s*)+[-–|:\s]*(?:n\.?\s*a\.?|e\.?\s*u\.?|a\.?\s*s\.?)?\s*teams?\s+/i;

/** Headers like `Teiko | 143 C VC` or `SEASON I - EU TEAMS Kaka | 11 C VC`. */
export function parseTeamHeader(raw: string): string | null {
  const cleaned = raw.replace(/\u00a0/g, " ").trim();
  if (!cleaned) return null;

  const pipe = cleaned.match(/^(.+?)\s*\|\s*\d+/);
  if (!pipe?.[1]) return null;

  // Strip the glued region title before displayName turns leftover `|` into spaces.
  let rawName = pipe[1];
  if (SEASON_TEAMS_PREFIX.test(rawName)) {
    rawName = rawName.replace(SEASON_TEAMS_PREFIX, "");
  }
  const name = displayName(rawName);
  if (!name || name.length < 2 || name.length > 40) return null;
  if (/^\d+$/.test(name)) return null;
  // Reject bare section titles ("SEASON I - N.A TEAMS 00 | 112")
  if (/\b(season|chapter|teams|group|qualifiers?|playoffs?)\b/i.test(name)) return null;
  return name;
}

export function namesEqual(a: string, b: string): boolean {
  return normalizeName(a) === normalizeName(b);
}

/** Collapse spaces and treat 0/O as the same so FairyTail/Fairy Tail and CP0/CPO match. */
export function teamMatchKey(value: string): string {
  return normalizeName(value).replace(/\s+/g, "").replace(/0/g, "o");
}

export function teamNamesEqual(a: string, b: string): boolean {
  return teamMatchKey(a) === teamMatchKey(b);
}

/** Bracket sheets use score-like placeholders (e.g. "0 0") instead of real team names. */
export function isPlaceholderTeamName(value: string): boolean {
  const name = normalizeName(value);
  if (!name) return true;
  return /^(?:0(?:\s+0)*)$/.test(name);
}
