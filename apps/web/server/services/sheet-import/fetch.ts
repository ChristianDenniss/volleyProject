import { waffleHtmlToLines } from "./parse-waffle";
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

export interface SheetTab {
  name: string;
  gid: string;
}

function addSheetTab(
  tabs: SheetTab[],
  seen: Set<string>,
  rawName: string | undefined,
  rawGid: string | undefined,
) {
  if (!rawName) return;
  const name = decodeSheetLabel(rawName);
  if (!name || seen.has(name)) return;
  seen.add(name);
  tabs.push({ name, gid: rawGid?.trim() ?? "" });
}

/** Parse tab titles and gids from a public Sheets htmlview/edit document. */
export function parseSheetTabsFromHtml(html: string): SheetTab[] {
  const tabs: SheetTab[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(
    /items\.push\(\{\s*name:\s*"((?:\\.|[^"\\])*)"[\s\S]*?gid:\s*"([^"]+)"/gi,
  )) {
    addSheetTab(tabs, seen, match[1], match[2]);
  }

  if (tabs.length === 0) {
    for (const match of html.matchAll(/name:\s*"((?:\\.|[^"\\])*)"\s*,\s*pageUrl:/gi)) {
      addSheetTab(tabs, seen, match[1], undefined);
    }
  }

  if (tabs.length === 0) {
    for (const match of html.matchAll(/id="sheet-button-\d+"[^>]*>\s*([^<]+)/gi)) {
      addSheetTab(tabs, seen, match[1], undefined);
    }
  }

  if (tabs.length === 0) {
    for (const match of html.matchAll(/class="[^"]*sheet-button[^"]*"[^>]*>\s*([^<]+)/gi)) {
      addSheetTab(tabs, seen, match[1], undefined);
    }
  }

  return tabs;
}

/** Parse tab titles from a public Sheets htmlview/edit document. */
export function parseSheetNamesFromHtml(html: string): string[] {
  return parseSheetTabsFromHtml(html).map((tab) => tab.name);
}

async function fetchHtmlview(
  spreadsheetId: string,
  fetchImpl: FetchImpl,
  gid?: string,
): Promise<string> {
  const url =
    gid === undefined || gid === ""
      ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlview`
      : `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlview/sheet?headers=true&gid=${encodeURIComponent(gid)}`;
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new BadRequestError(
      gid
        ? `Failed to fetch tab gid ${gid} (${response.status}) from ${spreadsheetId}`
        : `Could not open spreadsheet ${spreadsheetId} (${response.status}). Share it as "Anyone with the link can view".`,
    );
  }
  return response.text();
}

export async function listSheetTabs(
  spreadsheetId: string,
  fetchImpl: FetchImpl = fetch,
): Promise<SheetTab[]> {
  const html = await fetchHtmlview(spreadsheetId, fetchImpl);
  const tabs = parseSheetTabsFromHtml(html);

  if (tabs.length === 0) {
    const looksPrivate =
      /accounts\.google\.com|Sign in|ServiceLogin/i.test(html) &&
      !/items\.push\(\{\s*name:/i.test(html);
    throw new BadRequestError(
      looksPrivate
        ? `Spreadsheet ${spreadsheetId} looks private. Share it as "Anyone with the link can view".`
        : `No tabs found in spreadsheet ${spreadsheetId}. Confirm the link is public.`,
    );
  }

  return tabs;
}

export async function listSheetNames(
  spreadsheetId: string,
  fetchImpl: FetchImpl = fetch,
): Promise<string[]> {
  return (await listSheetTabs(spreadsheetId, fetchImpl)).map((tab) => tab.name);
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

export async function fetchSheetHtml(
  spreadsheetId: string,
  gid: string,
  fetchImpl: FetchImpl = fetch,
): Promise<string> {
  return fetchHtmlview(spreadsheetId, fetchImpl, gid);
}

function isMasterTeamsTab(name: string): boolean {
  return /^(NA|EU|AS)\s*-?\s*TEAMS$/i.test(name.trim());
}

export type TabFilter = (name: string) => boolean;

export const masterTabFilter: TabFilter = (name) =>
  /^(NA|EU|AS)\s*-?\s*(TEAMS|QUALIFIERS|QUALI|PLAYOFFS|PFS)$/i.test(name.trim());

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
  const sheets = await listSheetTabs(id, fetchImpl);
  const tabs = new Map<string, string[]>();

  for (const sheet of sheets) {
    if (!tabFilter(sheet.name)) continue;

    if (isMasterTeamsTab(sheet.name) && sheet.gid) {
      const html = await fetchSheetHtml(id, sheet.gid, fetchImpl);
      const lines = waffleHtmlToLines(html);
      if (lines.length > 0) {
        tabs.set(sheet.name, lines);
        continue;
      }
    }

    const csv = await fetchSheetCsv(id, sheet.name, fetchImpl);
    tabs.set(sheet.name, csv.split(/\r?\n/));
  }

  return { id, tabs };
}
