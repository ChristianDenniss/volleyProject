import { avatarFor } from "@server/services/roblox";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
): Promise<Response> {
  const { username } = await params;
  const userId = new URL(request.url).searchParams.get("userId");

  try {
    const avatarUrl = await avatarFor({
      name: decodeURIComponent(username),
      robloxUserId: userId,
    });
    if (!avatarUrl) return Response.json({ avatarUrl: null }, { status: 404 });
    return Response.json({ avatarUrl });
  } catch {
    return Response.json({ avatarUrl: null }, { status: 502 });
  }
}
