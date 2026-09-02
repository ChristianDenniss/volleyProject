"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await signOut();
        router.refresh();
      }}
      className="cursor-pointer rounded-xs border border-rvl-line bg-transparent px-3 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-dim transition-colors hover:border-rvl-line-strong hover:text-rvl-ink"
    >
      Logout
    </button>
  );
}
