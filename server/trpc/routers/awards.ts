import { awards } from "@server/services";
import { adminProcedure, publicProcedure, router } from "../init";
import { revalidate } from "../revalidate";
import { awardCreate, awardCreateWithNames, awardUpdate, byId } from "../schemas";

export const awardsRouter = router({
  list: publicProcedure.query(({ ctx }) => awards.list(ctx.db)),

  byId: publicProcedure.input(byId).query(({ ctx, input }) => awards.getById(ctx.db, input.id)),

  count: adminProcedure.query(({ ctx }) => awards.count(ctx.db)),

  create: adminProcedure.input(awardCreate).mutation(async ({ ctx, input }) => {
    const row = await awards.create(ctx.db, input);
    await revalidate("/awards", "/portal/awards");
    return row;
  }),

  createWithPlayerNames: adminProcedure
    .input(awardCreateWithNames)
    .mutation(async ({ ctx, input }) => {
      const row = await awards.createWithPlayerNames(ctx.db, input);
      await revalidate("/awards", "/portal/awards");
      return row;
    }),

  update: adminProcedure.input(awardUpdate).mutation(async ({ ctx, input }) => {
    const row = await awards.update(ctx.db, input.id, input.patch);
    await revalidate("/awards", `/awards/${input.id}`, "/portal/awards");
    return row;
  }),

  delete: adminProcedure.input(byId).mutation(async ({ ctx, input }) => {
    const row = await awards.remove(ctx.db, input.id);
    await revalidate("/awards", "/portal/awards");
    return row;
  }),
});
