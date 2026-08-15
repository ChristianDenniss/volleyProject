import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="border-b border-border bg-brand-surface dark:bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-10 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-steel">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-3xl font-semibold tracking-tight text-brand-navy dark:text-foreground sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <div className="max-w-2xl text-sm text-muted-foreground">{description}</div>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Section({
  title,
  description,
  actions,
  children,
}: {
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {title ? (
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/40 px-6 py-12 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
