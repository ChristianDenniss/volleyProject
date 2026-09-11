import { getAuth } from "@server/auth";
import { safeInternalPath } from "@/lib/safe-redirect";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const site = request.headers.get("Sec-Fetch-Site");
  if (site && site !== "same-origin" && site !== "same-site" && site !== "none") {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const callbackURL = safeInternalPath(url.searchParams.get("next"));

  try {
    const { headers, response } = await getAuth().api.signInSocial({
      body: { provider: "roblox", callbackURL },
      returnHeaders: true,
    });

    const target = (response as { url?: string }).url;
    if (!target) {
      return Response.redirect(new URL("/login?error=roblox", url.origin).toString(), 302);
    }

    const out = new Headers(headers);
    out.set("Location", target);
    out.set("Cache-Control", "no-store");
    return new Response(null, { status: 302, headers: out });
  } catch {
    return Response.redirect(new URL("/login?error=roblox", url.origin).toString(), 302);
  }
}
