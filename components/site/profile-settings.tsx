"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { SignOutButton } from "./sign-out-button";

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

export function ProfileSettings() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const active = mounted ? resolvedTheme : undefined;

  return (
    <dl className="m-0 grid grid-cols-1 border-t border-rvl-line">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-rvl-line py-4">
        <dt className="w-[190px] shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-rvl-dim">
          Appearance
        </dt>
        <dd className="m-0 flex flex-wrap gap-2">
          {THEMES.map((theme) => {
            const selected = active === theme.value;

            return (
              <button
                key={theme.value}
                type="button"
                onClick={() => setTheme(theme.value)}
                aria-pressed={selected}
                className={
                  selected
                    ? "cursor-pointer border border-rvl-accent-soft bg-rvl-accent-bg px-4 py-2 font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-rvl-on-accent"
                    : "cursor-pointer border border-rvl-line bg-transparent px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-dim transition-colors hover:border-rvl-line-strong hover:text-rvl-ink"
                }
              >
                {theme.label}
              </button>
            );
          })}
        </dd>
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-rvl-line py-4">
        <dt className="w-[190px] shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-rvl-dim">
          Session
        </dt>
        <dd className="m-0">
          <SignOutButton />
        </dd>
      </div>
    </dl>
  );
}
