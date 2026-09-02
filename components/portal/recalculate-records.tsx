"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export function RecalculateRecords({ seasons }: { seasons: { id: number; label: string }[] }) {
  const router = useRouter();
  const [seasonId, setSeasonId] = useState("");
  const recalculate = trpc.records.recalculate.useMutation();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={seasonId}
        onChange={(event) => setSeasonId(event.target.value)}
        className="cursor-pointer rounded-xs border border-rvl-line bg-transparent px-3.5 py-2.5 font-mono text-[0.78rem] uppercase tracking-[0.08em] text-rvl-ink transition-colors hover:border-rvl-line-strong focus:border-rvl-accent-soft focus:outline-none"
      >
        <option value="">Every season</option>
        {seasons.map((season) => (
          <option key={season.id} value={String(season.id)}>
            {season.label}
          </option>
        ))}
      </select>

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
            toast.error(error instanceof Error ? error.message : "The job was not queued.");
          }
        }}
      >
        {recalculate.isPending ? "Queueing…" : "Recalculate records"}
      </button>
    </div>
  );
}
