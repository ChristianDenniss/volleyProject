"use client";

import { useState } from "react";
import { toast } from "sonner";
import { signInWithRoblox } from "@/lib/auth-client";

export function RobloxSignIn({ callbackURL }: { callbackURL: string }) {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      className="mt-4 w-full cursor-pointer rounded-md border-none bg-brand-sky px-4 py-3.5 text-base font-semibold text-white transition-colors duration-300 hover:enabled:bg-brand-sky-dark disabled:cursor-not-allowed disabled:bg-[#AACCEE]"
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
