import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-6 border-b border-rvl-line px-5 py-12 sm:px-8 sm:py-14 lg:flex-row lg:items-end xl:px-14">
      <div className="max-w-[52ch]">
        <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
          {eyebrow}
        </span>
        <h1 className="mt-4 mb-0 text-balance text-[2.2rem] font-black uppercase leading-[0.95] tracking-[-0.035em] sm:text-[2.7rem]">
          {title}
        </h1>
        {description ? (
          <p className="m-0 mt-4 text-[0.98rem] text-rvl-ink-2">{description}</p>
        ) : null}
        {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {meta ? (
        <div className="flex flex-wrap gap-8 font-mono lg:ml-auto lg:justify-end">{meta}</div>
      ) : null}
    </header>
  );
}

export function PageMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[0.58rem] uppercase tracking-[0.22em] text-rvl-dim">{label}</span>
      <span className="text-[1.05rem] font-medium tabular-nums">{value}</span>
    </div>
  );
}
