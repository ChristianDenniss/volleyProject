import { cacheRead, cacheWrite, cacheDelete } from "../../cache";
import { BadRequestError } from "../errors";
import type { AssembledSources } from "./types";

const SESSION_TTL_SECONDS = 60 * 60;

function sessionKey(id: string): string {
  return `https://volley.internal/cache/sheet-import-session/${id}`;
}

export function emptyAssembledSources(): AssembledSources {
  return {
    masterTeams: [],
    masterGames: [],
    regionalTeams: [],
    regionalBlocks: [],
    sourceWarnings: [],
  };
}

export async function createSheetImportSession(): Promise<string> {
  const id = crypto.randomUUID();
  await cacheWrite(sessionKey(id), emptyAssembledSources(), SESSION_TTL_SECONDS);
  return id;
}

export async function readSheetImportSession(id: string): Promise<AssembledSources | null> {
  return cacheRead<AssembledSources>(sessionKey(id));
}

export async function requireSheetImportSession(id: string): Promise<AssembledSources> {
  const sources = await readSheetImportSession(id);
  if (!sources) {
    throw new BadRequestError("Import session expired — run preview again");
  }
  return sources;
}

export async function mergeSheetImportSession(
  id: string,
  patch: {
    masterTeams?: AssembledSources["masterTeams"];
    masterGames?: AssembledSources["masterGames"];
    regionalTeams?: AssembledSources["regionalTeams"];
    regionalBlocks?: AssembledSources["regionalBlocks"];
    sourceWarnings?: string[];
  },
): Promise<AssembledSources> {
  const current = (await readSheetImportSession(id)) ?? emptyAssembledSources();
  const next: AssembledSources = {
    masterTeams: patch.masterTeams ?? current.masterTeams,
    masterGames: patch.masterGames ?? current.masterGames,
    regionalTeams: patch.regionalTeams
      ? [...current.regionalTeams, ...patch.regionalTeams]
      : current.regionalTeams,
    regionalBlocks: patch.regionalBlocks
      ? [...current.regionalBlocks, ...patch.regionalBlocks]
      : current.regionalBlocks,
    sourceWarnings: patch.sourceWarnings
      ? [...current.sourceWarnings, ...patch.sourceWarnings]
      : current.sourceWarnings,
  };
  await cacheWrite(sessionKey(id), next, SESSION_TTL_SECONDS);
  return next;
}

export async function deleteSheetImportSession(id: string): Promise<void> {
  await cacheDelete(sessionKey(id));
}
