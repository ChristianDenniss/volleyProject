import type { Metadata } from "next";
import { getDb } from "@db";
import { matches, seasons } from "@server/services";
import { EmptyState } from "@components/site/empty-state";
import { SchedulesBoard } from "@components/site/schedules-board";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Schedules",
  description: "Upcoming and completed matches across every region and phase.",
};

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const { season } = await searchParams;
  const db = getDb();
  const parsed = season ? Number.parseInt(season, 10) : Number.NaN;
  const seasonId = Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;

  const [rows, allSeasons] = await Promise.all([
    seasonId === undefined ? matches.list(db) : matches.listBySeason(db, seasonId),
    seasons.list(db),
  ]);

  return (
    <div className="box-border w-full overflow-x-hidden p-24 max-lg:p-10 max-md:p-5">
      <header className="mb-8 flex items-center justify-between border-b-2 border-[#e5e7eb] pb-5">
        <h1 className="m-0 text-[2rem] font-bold text-[#1f2937]">Schedules</h1>
      </header>

      {rows.length === 0 ? (
        <EmptyState>No matches have been scheduled.</EmptyState>
      ) : (
        <SchedulesBoard
          matches={rows.map((match) => ({
            id: match.id,
            matchNumber: match.matchNumber,
            round: match.round,
            status: match.status,
            region: match.region,
            date: match.date,
            team1Name: match.team1Name ?? null,
            team2Name: match.team2Name ?? null,
            team1LogoUrl: match.team1LogoUrl ?? null,
            team2LogoUrl: match.team2LogoUrl ?? null,
            team1Score: match.team1Score ?? null,
            team2Score: match.team2Score ?? null,
            setScores: [
              match.set1Score ?? null,
              match.set2Score ?? null,
              match.set3Score ?? null,
              match.set4Score ?? null,
              match.set5Score ?? null,
            ],
          }))}
          seasons={allSeasons.map((entry) => ({ id: entry.id, seasonNumber: entry.seasonNumber }))}
          seasonId={seasonId}
        />
      )}
    </div>
  );
}
