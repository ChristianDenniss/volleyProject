import type { Metadata } from "next";
import { getDb } from "@db";
import { records } from "@server/services";
import { EmptyState } from "@components/site/empty-state";
import { RecordsBoard } from "@components/site/records-board";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Records",
  description: "Top ten league records for every metric, per game and per season.",
};

export default async function RecordsPage() {
  const rows = await records.list(getDb());

  return (
    <div className="box-border min-h-screen bg-white px-8 text-[#1a1a1a] max-md:px-4">
      <h1 className="relative mx-auto my-8 max-w-fit min-h-20 text-center text-[4rem] font-black uppercase leading-tight text-[#1a1a1a] max-md:text-[2.5rem] max-[480px]:text-[2rem]">
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 -z-1 h-[0.25em] w-[120%] -translate-x-1/2 -translate-y-1/2 -skew-x-[25deg] bg-brand-navy"
        />
        Records
      </h1>

      {rows.length === 0 ? (
        <EmptyState>
          No records have been calculated yet. An administrator can trigger a recalculation from the
          portal.
        </EmptyState>
      ) : (
        <RecordsBoard
          records={rows.map((row) => ({
            id: row.id,
            type: row.type,
            metric: row.metric,
            minAttempts: row.minAttempts ?? null,
            rank: row.rank,
            value: row.value,
            playerId: row.playerId,
            playerName: row.playerName,
            seasonId: row.seasonId ?? null,
            seasonNumber: row.seasonNumber ?? null,
            gameId: row.gameId ?? null,
            gameName: row.gameName ?? null,
          }))}
        />
      )}
    </div>
  );
}
