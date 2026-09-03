import type { Metadata } from "next";
import { api } from "@server/trpc/server";
import { EmptyState } from "@components/site/empty-state";
import { PageHeader } from "@components/site/page-header";
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
  const trpc = await api();
  const parsed = season ? Number.parseInt(season, 10) : Number.NaN;
  const seasonId = Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;

  const [rows, allSeasons] = await Promise.all([
    trpc.matches.list({ seasonId }),
    trpc.seasons.list(),
  ]);

  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Fixtures"
        title="Schedules"
        description="Every match across regions and phases, grouped by the day it was played."
      />

      {rows.length === 0 ? (
        <div className="px-5 py-14 sm:px-8 xl:px-14">
          <EmptyState>No matches have been scheduled.</EmptyState>
        </div>
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
