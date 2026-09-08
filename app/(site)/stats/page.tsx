import type { Metadata } from "next";
import { api } from "@server/trpc/server";
import { getSiteRegionQuery } from "@server/site-region";
import { numberParam, pageParam, stringParam, type SearchParams } from "@/lib/search-params";
import {
  decodeFilterConditions,
  defaultSortDirection,
  isLeaderboardSortKey,
  isSortDirection,
  isStatType,
  type LeaderboardSortKey,
  type SortDirection,
  type StatType,
} from "@/lib/stats/leaderboard-filters";
import { StatsLeaderboard } from "@components/site/stats-leaderboard";
import { isStageRound } from "@/lib/stats/stage-rounds";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stat leaders",
  description: "Career and per-season statistical leaders across the Roblox Volleyball League.",
};

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [trpc, { query }] = await Promise.all([api(), getSiteRegionQuery(params)]);

  const seasonId = numberParam(params, "season");
  const round = stringParam(params, "round");
  const stageRound = round && isStageRound(round) ? round : undefined;

  const rawType = stringParam(params, "type");
  const statType: StatType = rawType && isStatType(rawType) ? rawType : "total";

  const rawSort = stringParam(params, "sort");
  const sort: LeaderboardSortKey =
    rawSort && isLeaderboardSortKey(rawSort) ? rawSort : "totalKills";

  const rawDir = stringParam(params, "dir");
  const dir: SortDirection = rawDir && isSortDirection(rawDir) ? rawDir : defaultSortDirection(sort);

  const conditions = decodeFilterConditions(stringParam(params, "f")).map(
    ({ stat, operator, value }) => ({ stat, operator, value }),
  );

  const [page, allSeasons] = await Promise.all([
    trpc.stats.leaderboardPage({
      ...query,
      ...(seasonId === undefined ? {} : { seasonId }),
      ...(stageRound === undefined ? {} : { stageRound }),
      page: pageParam(params),
      search: stringParam(params, "q"),
      statType,
      sort,
      dir,
      conditions,
    }),
    trpc.seasons.list(query),
  ]);

  return (
    <div className="font-display">
      <StatsLeaderboard
        rows={page.rows.map((row) => ({
          playerId: row.playerId,
          playerName: row.playerName,
          position: row.position ?? "N/A",
          teamName: row.teamName,
          teamLogoUrl: row.teamLogoUrl,
          gamesPlayed: row.gamesPlayed,
          totalSets: row.totalSets,
          spikeKills: row.spikeKills,
          spikeAttempts: row.spikeAttempts,
          apeKills: row.apeKills,
          apeAttempts: row.apeAttempts,
          totalKills: row.totalKills,
          totalAttempts: row.totalAttempts,
          spikingPercentage: row.spikingPercentage,
          spikingErrors: row.spikingErrors,
          assists: row.assists,
          settingErrors: row.settingErrors,
          blocks: row.blocks,
          blockFollows: row.blockFollows,
          digs: row.digs,
          aces: row.aces,
          servingErrors: row.servingErrors,
          miscErrors: row.miscErrors,
          totalErrors: row.totalErrors,
        }))}
        seasons={allSeasons.map((entry) => ({
          id: entry.id,
          seasonNumber: entry.seasonNumber,
        }))}
        seasonId={seasonId}
        statType={statType}
        sort={sort}
        dir={dir}
        page={page.page}
        perPage={page.perPage}
        total={page.total}
        totalPages={page.totalPages}
      />
    </div>
  );
}
