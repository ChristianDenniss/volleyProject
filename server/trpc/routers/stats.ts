import { stats } from "@server/services";
import { adminProcedure, publicProcedure, router } from "../init";
import { revalidate } from "../revalidate";
import {
  byId,
  optionalSeason,
  statCreate,
  statCreateByName,
  statRows,
  statUpdate,
} from "../schemas";

export const statsRouter = router({
  list: adminProcedure.query(({ ctx }) => stats.list(ctx.db)),

  leaderboard: publicProcedure
    .input(optionalSeason)
    .query(({ ctx, input }) => stats.leaderboard(ctx.db, input.seasonId)),

  vectorGraph: publicProcedure.query(({ ctx }) => stats.vectorGraph(ctx.db)),

  count: adminProcedure.query(({ ctx }) => stats.count(ctx.db)),

  create: adminProcedure.input(statCreate).mutation(async ({ ctx, input }) => {
    const row = await stats.create(ctx.db, input);
    revalidate("/stats", "/vector-graph", `/games/${input.gameId}`, "/portal/stats");
    return row;
  }),

  createByName: adminProcedure.input(statCreateByName).mutation(async ({ ctx, input }) => {
    const row = await stats.createByName(ctx.db, input);
    revalidate("/stats", "/vector-graph", `/games/${input.gameId}`, "/portal/stats");
    return row;
  }),

  createManyFromRows: adminProcedure.input(statRows).mutation(async ({ ctx, input }) => {
    const result = await stats.createManyFromRows(ctx.db, input.gameId, input.rows);
    revalidate("/stats", "/vector-graph", `/games/${input.gameId}`, "/portal/stats");
    return result;
  }),

  addToGame: adminProcedure.input(statRows).mutation(async ({ ctx, input }) => {
    const result = await stats.addToGame(ctx.db, input.gameId, input.rows);
    revalidate("/stats", "/vector-graph", `/games/${input.gameId}`, "/portal/stats");
    return result;
  }),

  update: adminProcedure.input(statUpdate).mutation(async ({ ctx, input }) => {
    const row = await stats.update(ctx.db, input.id, input.patch);
    revalidate("/stats", "/vector-graph", "/portal/stats");
    return row;
  }),

  delete: adminProcedure.input(byId).mutation(async ({ ctx, input }) => {
    const row = await stats.remove(ctx.db, input.id);
    revalidate("/stats", "/vector-graph", "/portal/stats");
    return row;
  }),
});
