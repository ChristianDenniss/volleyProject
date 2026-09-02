import type { ReactNode } from "react";

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="border border-rvl-line px-5 py-4">
      <p className="m-0 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-rvl-dim">
        {label}
      </p>
      <p className="m-0 mt-2.5 font-mono text-[1.9rem] font-bold leading-none tracking-[-0.045em] tabular-nums text-rvl-accent">
        {value}
      </p>
      {hint ? (
        <p className="m-0 mt-2 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-rvl-dim">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}
