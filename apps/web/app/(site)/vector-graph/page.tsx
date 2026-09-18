import type { Metadata } from "next";
import { publicSite } from "@server/trpc/server";
import type { SearchParams } from "@/lib/search-params";
import { VectorGraphClient } from "@components/site/vector-graph-client";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Stats vector",
  description:
    "Explore player statistical profiles in 3D space. Each point is a season of normalized per-set stats.",
};

export default async function VectorGraphRoute({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { query, trpc } = publicSite(params);
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
