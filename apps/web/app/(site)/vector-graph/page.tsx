import type { Metadata } from "next";
import { api } from "@server/trpc/server";
import { getSiteRegionQuery } from "@server/site-region";
import { VectorGraphClient } from "@components/site/vector-graph-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stats vector",
  description:
    "Explore player statistical profiles in 3D space. Each point is a season of normalized per-set stats.",
};

export default async function VectorGraphRoute() {
  const [trpc, { query }] = await Promise.all([api(), getSiteRegionQuery()]);
  const [players, seasons] = await Promise.all([
    trpc.stats.vectorGraph(query),
    trpc.seasons.list(query),
  ]);

  return (
    <VectorGraphClient
      players={players}
      seasons={seasons.map((season) => ({
        id: season.id,
        seasonNumber: season.seasonNumber,
        theme: season.theme,
      }))}
    />
  );
}
