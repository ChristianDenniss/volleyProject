"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
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
        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
      >
        <option value="">Every season</option>
        {seasons.map((season) => (
          <option key={season.id} value={String(season.id)}>
            {season.label}
          </option>
        ))}
      </select>

      <Button
        size="sm"
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
      </Button>
    </div>
  );
}
