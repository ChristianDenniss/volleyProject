interface UsernameLookup {
  data?: { id: number }[];
}

interface ThumbnailLookup {
  data?: { imageUrl: string }[];
}

export async function avatarByUsername(
  username: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const userResponse = await fetchImpl("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernames: [username] }),
  });
  if (!userResponse.ok) return null;

  const { data } = (await userResponse.json()) as UsernameLookup;
  const userId = data?.[0]?.id;
  if (!userId) return null;

  const thumbnailResponse = await fetchImpl(
    `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=720x720&format=Png&isCircular=false`,
  );
  if (!thumbnailResponse.ok) return null;

  const thumbnail = (await thumbnailResponse.json()) as ThumbnailLookup;
  const imageUrl = thumbnail.data?.[0]?.imageUrl;
  if (!imageUrl) return null;

  return imageUrl.startsWith("https://") ? imageUrl : `https://${imageUrl}`;
}
