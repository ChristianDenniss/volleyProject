"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { usePortalErrorToast } from "./portal-error-detail";
import { trpc } from "@/lib/trpc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";

const ALL_SEASONS = "__all";

export function RecalculateRecords({ seasons }: { seasons: { id: number; label: string }[] }) {
  const router = useRouter();
  const showErrorToast = usePortalErrorToast();
  const [seasonId, setSeasonId] = useState(ALL_SEASONS);
  const recalculate = trpc.records.recalculate.useMutation();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={seasonId} onValueChange={setSeasonId}>
        <SelectTrigger
          aria-label="Scope"
          className="min-w-[180px] rounded-xs border-rvl-line bg-transparent px-3.5 font-mono text-[0.78rem] uppercase tracking-[0.08em] data-[size=default]:h-10 hover:border-rvl-line-strong focus-visible:border-rvl-accent-soft focus-visible:ring-0"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xs border-rvl-line">
          <SelectItem
            value={ALL_SEASONS}
            className="rounded-xs font-mono text-[0.76rem] uppercase tracking-[0.08em] focus:bg-rvl-panel focus:text-rvl-accent"
          >
            Every season
          </SelectItem>
          {seasons.map((season) => (
            <SelectItem
              key={season.id}
              value={String(season.id)}
              className="rounded-xs font-mono text-[0.76rem] uppercase tracking-[0.08em] focus:bg-rvl-panel focus:text-rvl-accent"
            >
              {season.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        type="button"
        className="cursor-pointer border-none bg-rvl-accent-bg px-5 py-2.5 font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-rvl-on-accent transition-opacity hover:enabled:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={recalculate.isPending}
        onClick={async () => {
          try {
            const parsed = Number.parseInt(seasonId, 10);
            const result = await recalculate.mutateAsync(
              Number.isFinite(parsed) ? { seasonId: parsed } : {},
            );
            toast.success(`Queued as job ${result.jobId.slice(0, 8)}.`);
            router.refresh();
          } catch (error) {
            showErrorToast("Recalculate failed", error);
          }
        }}
      >
        {recalculate.isPending ? "Queueing…" : "Recalculate records"}
      </button>
    </div>
  );
}
