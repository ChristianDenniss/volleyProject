import { seasons } from "@server/services";
import { adminProcedure, router } from "../init";
import { revalidate } from "../revalidate";
import { byId, seasonCreate, seasonUpdate } from "../schemas";

export const seasonsRouter = router({
  create: adminProcedure.input(seasonCreate).mutation(async ({ ctx, input }) => {
    const row = await seasons.create(ctx.db, input);
    revalidate("/seasons", "/portal/seasons");
    return row;
  }),

  update: adminProcedure.input(seasonUpdate).mutation(async ({ ctx, input }) => {
    const row = await seasons.update(ctx.db, input.id, input.patch);
    revalidate("/seasons", `/seasons/${input.id}`, "/portal/seasons");
    return row;
  }),

  delete: adminProcedure.input(byId).mutation(async ({ ctx, input }) => {
    const row = await seasons.remove(ctx.db, input.id);
    revalidate("/seasons", "/portal/seasons");
    return row;
  }),
});
