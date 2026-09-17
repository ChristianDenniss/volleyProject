"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [adminClient()],
});

export const { useSession, signOut } = authClient;

export async function signInWithRoblox(callbackURL = "/"): Promise<void> {
  const result = await authClient.signIn.social({
    provider: "roblox",
    callbackURL,
    disableRedirect: true,
  });
  if (result.error) {
    throw new Error(result.error.message || "Roblox sign-in could not be started");
  }
  const url = result.data?.url;
  if (typeof url === "string" && url.length > 0) {
    window.location.assign(url);
    return;
  }
  window.location.assign(callbackURL);
}
