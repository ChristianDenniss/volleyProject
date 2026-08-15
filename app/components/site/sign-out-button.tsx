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
      className="ml-1 cursor-pointer rounded-md border-none bg-brand-ink px-3 py-2 text-base text-white transition-colors duration-300 hover:bg-brand-line hover:text-brand-ink"
    >
      Logout
    </button>
  );
}
