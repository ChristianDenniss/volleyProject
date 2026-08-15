"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { signInWithRoblox } from "@/lib/auth-client";

export function RobloxSignIn({ callbackURL }: { callbackURL: string }) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      className="w-full"
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
    </Button>
  );
}
