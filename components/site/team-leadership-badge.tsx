import { cn } from "@/lib/utils";

export type TeamLeadershipRole = "C" | "VC" | "CC";

const ROLE_META: Record<
  TeamLeadershipRole,
  { label: string; title: string; className: string }
> = {
  C: {
    label: "C",
    title: "Captain",
    className: "border-rvl-accent-soft bg-rvl-accent-bg text-rvl-on-accent",
  },
  VC: {
    label: "VC",
    title: "Vice Captain",
    className: "border-rvl-line-strong bg-rvl-panel text-rvl-ink",
  },
  CC: {
    label: "CC",
    title: "Co-Captain",
    className: "border-rvl-line bg-transparent text-rvl-ink-2",
  },
};

export function TeamLeadershipBadge({
  role,
  className,
}: {
  role: TeamLeadershipRole | null | undefined;
  className?: string;
}) {
  if (!role) return null;
  const meta = ROLE_META[role];

  return (
    <span
      title={meta.title}
      aria-label={meta.title}
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center border font-mono text-[0.62rem] font-bold uppercase tracking-[0.08em]",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
