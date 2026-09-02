import type { ReactNode } from "react";

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="border border-rvl-line px-6 py-16 text-center font-mono text-[0.78rem] uppercase tracking-[0.14em] text-rvl-dim">
      {children}
    </div>
  );
}
