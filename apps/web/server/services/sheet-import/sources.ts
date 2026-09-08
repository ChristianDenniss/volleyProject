import {
  loadWorkbook,
  listSheetNames,
  fetchSheetCsv,
  extractSpreadsheetId,
  masterTabFilter,
  regionalTabFilter,
  type FetchImpl,
} from "./fetch";
import { parseMasterWorkbook } from "./parse-master";
import { parseRegionalWorkbook } from "./parse-regional";
import type { ParsedGame, ParsedScoreBlock, ParsedTeam, SheetRegion } from "./types";

export interface MasterSourcePayload {
  teams: ParsedTeam[];
  games: ParsedGame[];
  warnings: string[];
  tabCount: number;
  tabNames: string[];
}

export interface RegionalSourcePayload {
  region: SheetRegion;
  teams: ParsedTeam[];
  blocks: ParsedScoreBlock[];
  warnings: string[];
  tabCount: number;
  tabNames: string[];
  loadedTabs: string[];
  nextIndex: number;
  done: boolean;
}

export async function inspectSheetTabs(
  url: string,
  role: "master" | "regional",
  fetchImpl: FetchImpl = fetch,
): Promise<{ spreadsheetId: string; tabNames: string[] }> {
  const spreadsheetId = extractSpreadsheetId(url);
  const all = await listSheetNames(spreadsheetId, fetchImpl);
  const filter = role === "master" ? masterTabFilter : regionalTabFilter;
  return { spreadsheetId, tabNames: all.filter(filter) };
}

export async function loadMasterSource(
  url: string,
  fallbackYear: number,
  fetchImpl: FetchImpl = fetch,
): Promise<MasterSourcePayload> {
  const workbook = await loadWorkbook(url, fetchImpl, masterTabFilter);
  const tabNames = [...workbook.tabs.keys()];
  const parsed = parseMasterWorkbook(workbook.tabs, fallbackYear);
  return {
    teams: parsed.teams,
    games: parsed.games,
    warnings: parsed.warnings,
    tabCount: tabNames.length,
    tabNames,
  };
}

const REGIONAL_BATCH = 4;

async function fetchRegionalPlayersTab(
  spreadsheetId: string,
  tabNames: string[],
  fetchImpl: FetchImpl,
): Promise<string[] | undefined> {
  const playersTab = tabNames.find((name) => name.trim().toLowerCase() === "players");
  if (!playersTab) return undefined;
  const csv = await fetchSheetCsv(spreadsheetId, playersTab, fetchImpl);
  return csv.split(/\r?\n/);
}

export async function loadRegionalSourceBatch(
  input: {
    url: string;
    region: SheetRegion;
    startIndex?: number;
    batchSize?: number;
  },
  fetchImpl: FetchImpl = fetch,
): Promise<RegionalSourcePayload> {
  const spreadsheetId = extractSpreadsheetId(input.url);
  const all = await listSheetNames(spreadsheetId, fetchImpl);
  const tabNames = all.filter(regionalTabFilter);
  const startIndex = input.startIndex ?? 0;
  const batchSize = input.batchSize ?? REGIONAL_BATCH;
  const slice = tabNames.slice(startIndex, startIndex + batchSize);

  const teams: ParsedTeam[] = [];
  const blocks: ParsedScoreBlock[] = [];
  const warnings: string[] = [];

  const playersLines = await fetchRegionalPlayersTab(spreadsheetId, all, fetchImpl);
  const tabs = new Map<string, string[]>();
  if (playersLines) tabs.set("PLAYERS", playersLines);

  for (const name of slice) {
    const csv = await fetchSheetCsv(spreadsheetId, name, fetchImpl);
    tabs.set(name, csv.split(/\r?\n/));
  }

  const parsed = parseRegionalWorkbook(tabs, input.region);
  teams.push(...parsed.teams);
  blocks.push(...parsed.blocks);
  warnings.push(...parsed.warnings);

  const nextIndex = startIndex + slice.length;
  return {
    region: input.region,
    teams,
    blocks,
    warnings,
    tabCount: tabNames.length,
    tabNames,
    loadedTabs: slice,
    nextIndex,
    done: nextIndex >= tabNames.length,
  };
}

/** Full regional load (used by commit / one-shot preview). */
export async function loadRegionalSource(
  url: string,
  region: SheetRegion,
  fetchImpl: FetchImpl = fetch,
): Promise<Omit<RegionalSourcePayload, "loadedTabs" | "nextIndex" | "done">> {
  const spreadsheetId = extractSpreadsheetId(url);
  const all = await listSheetNames(spreadsheetId, fetchImpl);
  const workbook = await loadWorkbook(url, fetchImpl, regionalTabFilter);
  const tabs = new Map(workbook.tabs);
  const playersLines = await fetchRegionalPlayersTab(spreadsheetId, all, fetchImpl);
  if (playersLines) tabs.set("PLAYERS", playersLines);
  const tabNames = [...workbook.tabs.keys()];
  const parsed = parseRegionalWorkbook(tabs, region);
  return {
    region,
    teams: parsed.teams,
    blocks: parsed.blocks,
    warnings: parsed.warnings,
    tabCount: tabNames.length,
    tabNames,
  };
}
