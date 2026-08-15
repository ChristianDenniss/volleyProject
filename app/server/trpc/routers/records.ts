import { env } from "cloudflare:workers";
import { records } from "@server/services";
import { enqueueRecalculation } from "@server/queue";
import { adminProcedure, router } from "../init";
import { revalidate } from "../revalidate";
import { byId, recordCreate, recordRecalculate, recordUpdate } from "../schemas";

export const recordsRouter = router({
  create: adminProcedure.input(recordCreate).mutation(async ({ ctx, input }) => {
    const row = await records.create(ctx.db, input);
    revalidate("/records");
    return row;
  }),

  update: adminProcedure.input(recordUpdate).mutation(async ({ ctx, input }) => {
    const row = await records.update(ctx.db, input.id, input.patch);
    revalidate("/records");
    return row;
  }),

  delete: adminProcedure.input(byId).mutation(async ({ ctx, input }) => {
    const row = await records.remove(ctx.db, input.id);
    revalidate("/records");
    return row;
  }),

  recalculate: adminProcedure.input(recordRecalculate).mutation(async ({ ctx, input }) => {
    return enqueueRecalculation(ctx.db, env.RECORDS_QUEUE, {
      seasonId: input.seasonId ?? null,
      requestedBy: ctx.user.id,
    });
  }),
});
