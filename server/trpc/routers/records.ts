import { env } from "cloudflare:workers";
import { records } from "@server/services";
import { enqueueRecalculation, latestJob } from "@server/queue";
import { adminProcedure, publicProcedure, router, scopedRegion } from "../init";
import { revalidate } from "../revalidate";
import {
  byId,
  optionalRegion,
  recordCreate,
  recordRecalculate,
  recordUpdate,
  recordsByMetric,
} from "../schemas";

export const recordsRouter = router({
  list: publicProcedure
    .input(optionalRegion)
    .query(({ ctx, input }) => records.list(ctx.db, scopedRegion(ctx, input?.region))),

  byMetric: publicProcedure
    .input(recordsByMetric)
    .query(({ ctx, input }) =>
      records.listByMetric(
        ctx.db,
        input.metric,
        input.minAttempts,
        input.type,
        scopedRegion(ctx, input.region),
      ),
    ),

  count: adminProcedure.query(({ ctx }) => records.count(ctx.db)),

  latestJob: adminProcedure.query(({ ctx }) => latestJob(ctx.db)),

  create: adminProcedure.input(recordCreate).mutation(async ({ ctx, input }) => {
    const row = await records.create(ctx.db, input);
    await revalidate("/", "/records");
    return row;
  }),

  update: adminProcedure.input(recordUpdate).mutation(async ({ ctx, input }) => {
    const row = await records.update(ctx.db, input.id, input.patch);
    await revalidate("/", "/records");
    return row;
  }),

  delete: adminProcedure.input(byId).mutation(async ({ ctx, input }) => {
    const row = await records.remove(ctx.db, input.id);
    await revalidate("/", "/records");
    return row;
  }),

  recalculate: adminProcedure.input(recordRecalculate).mutation(async ({ ctx, input }) => {
    return enqueueRecalculation(ctx.db, env.RECORDS_QUEUE, {
      seasonId: input.seasonId ?? null,
      requestedBy: ctx.user.id,
    });
  }),
});
