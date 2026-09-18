import { cacheRead, cacheWrite } from "../cache";

interface UsernameLookup {
  data?: { id: number }[] | undefined;
}

interface ThumbnailLookup {
  data?: { imageUrl: string; state?: string }[] | undefined;
}

const USER_AGENT = "Mozilla/5.0 (compatible; VolleyProject/1.0; +https://volleyball4-2.com)";

const USER_HOSTS = ["https://users.roblox.com", "https://users.roproxy.com"] as const;
const THUMBNAIL_HOSTS = ["https://thumbnails.roblox.com", "https://thumbnails.roproxy.com"] as const;

export type AvatarThumbnail = "full" | "headshot";

function thumbnailEndpoint(type: AvatarThumbnail) {
  return type === "headshot" ? "avatar-headshot" : "avatar";
}

function thumbnailSize(type: AvatarThumbnail) {
  return type === "headshot" ? "150x150" : "720x720";
}

export function numericRobloxUserId(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.match(/\d+/);
  return match?.[0] ?? null;
}

async function firstOkJson<T>(
  urls: string[],
  fetchImpl: typeof fetch,
  init?: RequestInit,
): Promise<T | null> {
  for (const url of urls) {
    try {
      const response = await fetchImpl(url, {
        ...init,
        headers: { "User-Agent": USER_AGENT, ...init?.headers },
      });
      if (!response.ok) continue;
      return (await response.json()) as T;
    } catch {
    }
  }
  return null;
}

function httpsUrl(imageUrl: string): string {
  return imageUrl.startsWith("https://") ? imageUrl : `https://${imageUrl}`;
}

export async function avatarByUserId(
  userId: string,
  fetchImpl: typeof fetch = fetch,
  type: AvatarThumbnail = "full",
): Promise<string | null> {
  const id = numericRobloxUserId(userId);
  if (!id) return null;

  const endpoint = thumbnailEndpoint(type);
  const size = thumbnailSize(type);
  const thumbnail = await firstOkJson<ThumbnailLookup>(
    THUMBNAIL_HOSTS.map(
      (host) => `${host}/v1/users/${endpoint}?userIds=${id}&size=${size}&format=Png&isCircular=false`,
    ),
    fetchImpl,
  );
  const imageUrl = thumbnail?.data?.[0]?.imageUrl;
  return imageUrl ? httpsUrl(imageUrl) : null;
}

export async function avatarHeadshotByUserId(
  userId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  return avatarByUserId(userId, fetchImpl, "headshot");
}

export async function avatarByUsername(
  username: string,
  fetchImpl: typeof fetch = fetch,
  type: AvatarThumbnail = "full",
): Promise<string | null> {
  const trimmed = username.trim();
  if (!trimmed) return null;

  const lookup = await firstOkJson<UsernameLookup>(
    USER_HOSTS.map((host) => `${host}/v1/usernames/users`),
    fetchImpl,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [trimmed], excludeBannedUsers: false }),
    },
  );
  const userId = lookup?.data?.[0]?.id;
  if (!userId) return null;
  return avatarByUserId(String(userId), fetchImpl, type);
}

const AVATAR_TTL = 60 * 60 * 24;

async function cachedAvatar(
  key: string,
  load: () => Promise<string | null>,
  fetchImpl: typeof fetch,
): Promise<string | null> {
  if (fetchImpl !== fetch) return load();
  const cached = await cacheRead<{ url: string | null }>(key);
  if (cached) return cached.url;
  const url = await load();
  await cacheWrite(key, { url }, AVATAR_TTL);
  return url;
}

export async function avatarHeadshotByUsername(
  username: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const trimmed = username.trim();
  if (!trimmed) return null;
  return cachedAvatar(
    `https://volley.internal/cache/roblox-headshot/${trimmed.toLowerCase()}`,
    () => avatarByUsername(trimmed, fetchImpl, "headshot"),
    fetchImpl,
  );
}

export async function avatarFor(
  input: { name: string; robloxUserId?: string | null | undefined },
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const id = numericRobloxUserId(input.robloxUserId) ?? "";
  return cachedAvatar(
    `https://volley.internal/cache/roblox-avatar/${id}/${input.name.trim().toLowerCase()}`,
    async () => {
      const byId = await avatarByUserId(input.robloxUserId ?? "", fetchImpl);
      if (byId) return byId;
      return avatarByUsername(input.name, fetchImpl);
    },
    fetchImpl,
  );
}
