import type { Db } from "@db";
import { cacheDelete, cacheRead, cacheWrite } from "../cache";
import { avatarByUsername } from "./roblox";
import * as stats from "./stats";

export const HOME_NUMBERS_TTL = 60 * 60 * 24;
const HOME_NUMBERS_KEY = "https://volley.internal/cache/home-numbers-season-v2";

const SEASON_METRICS = [
  { key: "totalKills", metric: "Kills · season" },
  { key: "assists", metric: "Assists · season" },
  { key: "digs", metric: "Digs · season" },
  { key: "blocks", metric: "Blocks · season" },
  { key: "blockFollows", metric: "Block follows · season" },
  { key: "aces", metric: "Aces · season" },
] as const;

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
  key: (typeof SEASON_METRICS)[number]["key"],
) {
  return [...leaders].sort((a, b) => Number(b[key] ?? 0) - Number(a[key] ?? 0))[0] ?? null;
}

export async function computeHomeNumbers(
  db: Db,
  seasonId: number | null,
  avatarFor: AvatarLookup = defaultAvatar,
): Promise<HomeNumbersPayload> {
  const leaders = seasonId ? await stats.leaderboard(db, { seasonId }) : [];

  const numbers = SEASON_METRICS.flatMap(({ key, metric }) => {
    const leader = leaderIn(leaders, key);
    return leader
      ? [
          {
            metric,
            value: Number(leader[key] ?? 0),
            name: leader.playerName,
            context: `${leader.gamesPlayed} games`,
            href: `/players/${leader.playerId}`,
          },
        ]
      : [];
  });

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
