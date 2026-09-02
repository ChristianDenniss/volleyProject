import type { ReactNode } from "react";

export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-[20px] border-2 border-[#CFFFFF] bg-[#e6f2ff] px-5 py-4 shadow-[0_2px_6px_rgba(0,0,0,0.05)]">
      <p className="m-0 text-sm font-semibold uppercase tracking-[0.12em] text-[#005999]">{label}</p>
      <p className="m-0 mt-1 text-2xl font-bold tabular-nums text-[#141414]">{value}</p>
      {hint ? <p className="m-0 text-sm text-[#4b5563]">{hint}</p> : null}
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}
