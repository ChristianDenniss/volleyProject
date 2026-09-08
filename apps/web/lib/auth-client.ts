"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [adminClient()],
});

export const { useSession, signOut } = authClient;

export function signInWithRoblox(callbackURL = "/"): Promise<unknown> {
  return authClient.signIn.social({ provider: "roblox", callbackURL });
}
