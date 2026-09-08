import type { ReactNode } from "react";

export function PortalPage({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8 font-display">
      <header className="flex flex-col gap-4 border-b border-rvl-line pb-6 sm:flex-row sm:items-end">
        <div className="max-w-[60ch]">
          <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.24em] text-rvl-accent">
            Portal
          </span>
          <h1 className="mt-2.5 mb-0 text-[1.9rem] font-black uppercase leading-none tracking-[-0.03em]">
            {title}
          </h1>
          {description ? (
            <p className="m-0 mt-3 text-[0.92rem] text-rvl-ink-2">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2 sm:ml-auto">{actions}</div> : null}
      </header>

      {children}
    </div>
  );
}
