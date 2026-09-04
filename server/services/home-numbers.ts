import type { Db } from "@db";
import { cacheDelete, cacheRead, cacheWrite } from "../cache";
import { avatarByUsername } from "./roblox";
import * as records from "./records";
import * as stats from "./stats";

export const HOME_NUMBERS_TTL = 60 * 60 * 24;
const HOME_NUMBERS_KEY = "https://volley.internal/cache/home-numbers";

export interface HomeNumber {
  metric: string;
  value: number;
  name: string;
  context: string;
  href: string;
}

export interface HomeNumbersPayload {
  seasonId: number | null;
  numbers: HomeNumber[];
  avatars: Record<string, string | null>;
}

export type AvatarLookup = (name: string) => Promise<string | null>;

async function defaultAvatar(name: string) {
  try {
    return await avatarByUsername(name);
  } catch {
    return null;
  }
}

function leaderIn(
  leaders: Awaited<ReturnType<typeof stats.leaderboard>>,
  key: "totalKills" | "assists" | "digs",
) {
  return [...leaders].sort((a, b) => Number(b[key] ?? 0) - Number(a[key] ?? 0))[0] ?? null;
}

export async function computeHomeNumbers(
  db: Db,
  seasonId: number | null,
  avatarFor: AvatarLookup = defaultAvatar,
): Promise<HomeNumbersPayload> {
  const [leaders, killRecords, blockRecords, aceRecords] = await Promise.all([
    seasonId ? stats.leaderboard(db, seasonId) : Promise.resolve([]),
    records.listByMetric(db, "total kills", undefined, "game"),
    records.listByMetric(db, "blocks", undefined, "game"),
    records.listByMetric(db, "aces", undefined, "game"),
  ]);

  const killLeader = leaderIn(leaders, "totalKills");
  const assistLeader = leaderIn(leaders, "assists");
  const digLeader = leaderIn(leaders, "digs");

  const numbers = [
    killLeader && {
      metric: "Kills · season",
      value: Number(killLeader.totalKills ?? 0),
      name: killLeader.playerName,
      context: `${killLeader.gamesPlayed} games`,
      href: `/players/${killLeader.playerId}`,
    },
    assistLeader && {
      metric: "Assists · season",
      value: Number(assistLeader.assists ?? 0),
      name: assistLeader.playerName,
      context: `${assistLeader.gamesPlayed} games`,
      href: `/players/${assistLeader.playerId}`,
    },
    digLeader && {
      metric: "Digs · season",
      value: Number(digLeader.digs ?? 0),
      name: digLeader.playerName,
      context: `${digLeader.gamesPlayed} games`,
      href: `/players/${digLeader.playerId}`,
    },
    killRecords[0] && {
      metric: "Kills · one game",
      value: killRecords[0].value,
      name: killRecords[0].playerName,
      context: `S${killRecords[0].seasonNumber ?? "-"} · record`,
      href: "/records",
    },
    blockRecords[0] && {
      metric: "Blocks · one game",
      value: blockRecords[0].value,
      name: blockRecords[0].playerName,
      context: `S${blockRecords[0].seasonNumber ?? "-"} · record`,
      href: "/records",
    },
    aceRecords[0] && {
      metric: "Aces · one game",
      value: aceRecords[0].value,
      name: aceRecords[0].playerName,
      context: `S${aceRecords[0].seasonNumber ?? "-"} · record`,
      href: "/records",
    },
  ].flatMap((entry) => (entry ? [entry] : []));

  const avatars = Object.fromEntries(
    await Promise.all(
      [...new Set(numbers.map((entry) => entry.name))].map(
        async (name) => [name, await avatarFor(name)] as const,
      ),
    ),
  );

  return { seasonId, numbers, avatars };
}

export async function loadHomeNumbers(
  db: Db,
  seasonId: number | null,
  options: { avatarFor?: AvatarLookup } = {},
): Promise<HomeNumbersPayload> {
  const cached = await cacheRead<HomeNumbersPayload>(HOME_NUMBERS_KEY);
  if (cached && cached.seasonId === seasonId) return cached;

  const payload = await computeHomeNumbers(db, seasonId, options.avatarFor ?? defaultAvatar);
  await cacheWrite(HOME_NUMBERS_KEY, payload, HOME_NUMBERS_TTL);
  return payload;
}

export async function invalidateHomeNumbers() {
  await cacheDelete(HOME_NUMBERS_KEY);
}
