import type { Metadata } from "next";
import { api } from "@server/trpc/server";
import { getSiteRegionQuery } from "@server/site-region";
import { MATCH_STATUSES } from "@db/schema";
import { numberParam, pageParam, stringParam, type SearchParams } from "@/lib/search-params";
import { PageHeader } from "@components/site/page-header";
import { SchedulesBoard } from "@components/site/schedules-board";

export const dynamic = "force-dynamic";

const DAYS_PER_PAGE = 12;

export const metadata: Metadata = {
  title: "Schedules",
  description: "Upcoming and completed matches for the selected region.",
};

function matchStatus(value: string | undefined): (typeof MATCH_STATUSES)[number] | undefined {
  return MATCH_STATUSES.find((entry) => entry === value);
}

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [trpc, { query }] = await Promise.all([api(), getSiteRegionQuery(params)]);

  const seasonId = numberParam(params, "season");
  const status = matchStatus(stringParam(params, "status"));

  const [page, allSeasons, filters] = await Promise.all([
    trpc.games.schedulePage({
      ...query,
      ...(seasonId === undefined ? {} : { seasonId }),
      ...(status === undefined ? {} : { status }),
      page: pageParam(params),
      perPage: DAYS_PER_PAGE,
      search: stringParam(params, "q"),
      round: stringParam(params, "round"),
    }),
    trpc.seasons.list(query),
    trpc.games.scheduleFilters({ ...query, ...(seasonId === undefined ? {} : { seasonId }) }),
  ]);

  return (
    <div className="font-display">
      <PageHeader
        eyebrow="Fixtures"
        title="Schedules"
        description="Matches in the selected region, grouped by the day they were played."
      />

      <SchedulesBoard
        days={page.rows.map((day) => ({
          date: day.date,
          matches: day.matches.map((match) => ({
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
          })),
        }))}
        seasons={allSeasons.map((entry) => ({ id: entry.id, seasonNumber: entry.seasonNumber }))}
        statuses={filters.statuses}
        rounds={filters.rounds}
        totalDays={page.total}
        totalPages={page.totalPages}
      />
    </div>
  );
}
