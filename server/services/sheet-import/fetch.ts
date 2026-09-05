import { BadRequestError } from "../errors";

const SHEET_ID_RE = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;

export type FetchImpl = typeof fetch;

export function extractSpreadsheetId(url: string): string {
  const match = url.match(SHEET_ID_RE);
  if (!match?.[1]) {
    throw new BadRequestError(`Could not parse a Google Sheets id from "${url}"`);
  }
  return match[1];
}

function decodeSheetLabel(raw: string): string {
  return raw
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

/** Parse tab titles from a public Sheets htmlview/edit document. */
export function parseSheetNamesFromHtml(html: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();

  const add = (raw: string | undefined) => {
    if (!raw) return;
    const name = decodeSheetLabel(raw);
    if (!name || seen.has(name)) return;
    seen.add(name);
    names.push(name);
  };

  // Current public htmlview embeds: items.push({name: "NA TEAMS", pageUrl: "...", gid: "..."})
  for (const match of html.matchAll(/items\.push\(\{\s*name:\s*"((?:\\.|[^"\\])*)"/gi)) {
    add(match[1]);
  }

  if (names.length === 0) {
    for (const match of html.matchAll(/name:\s*"((?:\\.|[^"\\])*)"\s*,\s*pageUrl:/gi)) {
      add(match[1]);
    }
  }

  if (names.length === 0) {
    for (const match of html.matchAll(/id="sheet-button-\d+"[^>]*>\s*([^<]+)/gi)) {
      add(match[1]);
    }
  }

  if (names.length === 0) {
    for (const match of html.matchAll(/class="[^"]*sheet-button[^"]*"[^>]*>\s*([^<]+)/gi)) {
      add(match[1]);
    }
  }

  return names;
}

export async function listSheetNames(
  spreadsheetId: string,
  fetchImpl: FetchImpl = fetch,
): Promise<string[]> {
  const response = await fetchImpl(
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlview`,
  );
  if (!response.ok) {
    throw new BadRequestError(
      `Could not open spreadsheet ${spreadsheetId} (${response.status}). Share it as "Anyone with the link can view".`,
    );
  }

  const html = await response.text();
  const names = parseSheetNamesFromHtml(html);

  if (names.length === 0) {
    const looksPrivate =
      /accounts\.google\.com|Sign in|ServiceLogin/i.test(html) &&
      !/items\.push\(\{\s*name:/i.test(html);
    throw new BadRequestError(
      looksPrivate
        ? `Spreadsheet ${spreadsheetId} looks private. Share it as "Anyone with the link can view".`
        : `No tabs found in spreadsheet ${spreadsheetId}. Confirm the link is public.`,
    );
  }

  return names;
}

export async function fetchSheetCsv(
  spreadsheetId: string,
  sheetName: string,
  fetchImpl: FetchImpl = fetch,
): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new BadRequestError(
      `Failed to fetch tab "${sheetName}" (${response.status}) from ${spreadsheetId}`,
    );
  }
  const text = await response.text();
  if (text.includes("google.visualization.Query.setResponse") && text.includes("error")) {
    throw new BadRequestError(`Tab "${sheetName}" could not be read from ${spreadsheetId}`);
  }
  return text;
}

export type TabFilter = (name: string) => boolean;

export const masterTabFilter: TabFilter = (name) =>
  /^(NA|EU|AS)\s+(TEAMS|QUALIFIERS|PLAYOFFS)$/i.test(name.trim());

export const regionalTabFilter: TabFilter = (name) => {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, " ");
  if (["teams", "players", "players per set", "main", "main tab"].includes(normalized)) {
    return false;
  }
  if (normalized.endsWith("per set")) return false;
  return true;
};

export async function loadWorkbook(
  url: string,
  fetchImpl: FetchImpl = fetch,
  tabFilter: TabFilter = () => true,
): Promise<{ id: string; tabs: Map<string, string[]> }> {
  const id = extractSpreadsheetId(url);
  const names = await listSheetNames(id, fetchImpl);
  const tabs = new Map<string, string[]>();

  for (const name of names) {
    if (!tabFilter(name)) continue;
    const csv = await fetchSheetCsv(id, name, fetchImpl);
    tabs.set(name, csv.split(/\r?\n/));
  }

  return { id, tabs };
}
