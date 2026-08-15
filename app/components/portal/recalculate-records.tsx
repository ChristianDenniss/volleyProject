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
        className="rounded border border-[#ccc] bg-white px-3 py-2 text-base text-[#374151] focus:border-[#38bdf8] focus:outline-none"
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
        className="cursor-pointer rounded border-none bg-[#007bff] px-4 py-2 text-base text-white transition-colors duration-200 hover:enabled:bg-[#0056b3] disabled:cursor-not-allowed disabled:bg-[#ccc]"
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
