"use client";

import { useState } from "react";
import { toast } from "sonner";
import { signInWithRoblox } from "@/lib/auth-client";

export function RobloxSignIn({ callbackURL }: { callbackURL: string }) {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      className="w-full cursor-pointer border-none bg-rvl-accent-bg px-5 py-4 font-mono text-[0.72rem] font-bold uppercase tracking-[0.14em] text-rvl-on-accent transition-opacity hover:enabled:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await signInWithRoblox(callbackURL);
        } catch {
          toast.error("Roblox sign-in could not be started. Try again in a moment.");
          setPending(false);
        }
      }}
    >
      {pending ? "Redirecting…" : "Sign in with Roblox"}
    </button>
  );
}
