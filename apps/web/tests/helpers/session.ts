import type { Db } from "@db";
import { session } from "@db/schema";

export const SESSION_COOKIE = "better-auth.session_token";

const algorithm = { name: "HMAC", hash: "SHA-256" } as const;

export async function signedSessionCookie(token: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    algorithm,
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    algorithm.name,
    key,
    new TextEncoder().encode(token),
  );
  const encoded = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${SESSION_COOKIE}=${encodeURIComponent(`${token}.${encoded}`)}`;
}

export async function createSessionFor(
  db: Db,
  userId: string,
  secret: string,
): Promise<{ token: string; cookie: string; headers: Headers }> {
  const token = `token-${userId}`;
  await db.insert(session).values({
    id: `session-${userId}`,
    token,
    userId,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });

  const cookie = await signedSessionCookie(token, secret);
  return { token, cookie, headers: new Headers({ cookie }) };
}
