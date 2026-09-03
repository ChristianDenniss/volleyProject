"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { VectorGraphPlayer } from "@/lib/analytics/stats-vectorization";

type Props = {
  players: VectorGraphPlayer[];
  seasons: { id: number; seasonNumber: number; theme: string | null }[];
};

export function VectorGraphClient(props: Props) {
  const [Page, setPage] = useState<ComponentType<Props> | null>(null);

  useEffect(() => {
    void import("./vector-graph-page").then((mod) => setPage(() => mod.VectorGraphPage));
  }, []);

  if (!Page) {
    return (
      <div className="p-5">
        <p className="m-0 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-rvl-dim">
          Loading vector graph...
        </p>
      </div>
    );
  }

  return <Page {...props} />;
}
