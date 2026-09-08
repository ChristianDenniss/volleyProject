import { homeNumbers, stats } from "@server/services";
import { adminProcedure, publicProcedure, router, scopedRegion } from "../init";
import { cachedQuery } from "../cached";
import { revalidate } from "../revalidate";
import {
  byId,
  leaderboardInput,
  optionalRegion,
  statCreate,
  statCreateByName,
  statListPage,
  statRows,
  statUpdate,
} from "../schemas";

export const statsRouter = router({
  list: adminProcedure.query(({ ctx }) => stats.list(ctx.db)),

  leaderboard: publicProcedure.input(leaderboardInput).query(({ ctx, input }) => {
    const region = scopedRegion(ctx, input.region);
    return cachedQuery(
      "stats",
      ["leaderboard", input.seasonId ?? null, input.stageRound ?? null, region ?? null],
      () =>
        stats.leaderboard(ctx.db, {
          seasonId: input.seasonId,
          stageRound: input.stageRound,
          region,
        }),
    );
  }),

  vectorGraph: publicProcedure.input(optionalRegion).query(({ ctx, input }) => {
    const region = scopedRegion(ctx, input?.region);
    return cachedQuery("stats", ["vector-graph", region ?? null], () =>
      stats.vectorGraph(ctx.db, region),
    );
  }),

  listPage: adminProcedure
    .input(statListPage)
    .query(({ ctx, input }) => stats.listPage(ctx.db, input ?? {})),

  count: adminProcedure.query(({ ctx }) => stats.count(ctx.db)),

  create: adminProcedure.input(statCreate).mutation(async ({ ctx, input }) => {
    const row = await stats.create(ctx.db, input);
    await homeNumbers.invalidateHomeNumbers();
    revalidate("/", "/stats", "/vector-graph", `/games/${input.gameId}`, "/portal/stats");
    return row;
  }),

  createByName: adminProcedure.input(statCreateByName).mutation(async ({ ctx, input }) => {
    const row = await stats.createByName(ctx.db, input);
    await homeNumbers.invalidateHomeNumbers();
    revalidate("/", "/stats", "/vector-graph", `/games/${input.gameId}`, "/portal/stats");
    return row;
  }),

  createManyFromRows: adminProcedure.input(statRows).mutation(async ({ ctx, input }) => {
    const result = await stats.createManyFromRows(ctx.db, input.gameId, input.rows);
    await homeNumbers.invalidateHomeNumbers();
    revalidate("/", "/stats", "/vector-graph", `/games/${input.gameId}`, "/portal/stats");
    return result;
  }),

  addToGame: adminProcedure.input(statRows).mutation(async ({ ctx, input }) => {
    const result = await stats.addToGame(ctx.db, input.gameId, input.rows);
    await homeNumbers.invalidateHomeNumbers();
    revalidate("/", "/stats", "/vector-graph", `/games/${input.gameId}`, "/portal/stats");
    return result;
  }),

  update: adminProcedure.input(statUpdate).mutation(async ({ ctx, input }) => {
    const row = await stats.update(ctx.db, input.id, input.patch);
    await homeNumbers.invalidateHomeNumbers();
    revalidate("/", "/stats", "/vector-graph", "/portal/stats");
    return row;
  }),

  delete: adminProcedure.input(byId).mutation(async ({ ctx, input }) => {
    const row = await stats.remove(ctx.db, input.id);
    await homeNumbers.invalidateHomeNumbers();
    revalidate("/", "/stats", "/vector-graph", "/portal/stats");
    return row;
  }),
});
