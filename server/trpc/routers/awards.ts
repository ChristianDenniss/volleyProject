import { awards } from "@server/services";
import { adminProcedure, router } from "../init";
import { revalidate } from "../revalidate";
import { awardCreate, awardCreateWithNames, awardUpdate, byId } from "../schemas";

export const awardsRouter = router({
  create: adminProcedure.input(awardCreate).mutation(async ({ ctx, input }) => {
    const row = await awards.create(ctx.db, input);
    revalidate("/awards", "/portal/awards");
    return row;
  }),

  createWithPlayerNames: adminProcedure
    .input(awardCreateWithNames)
    .mutation(async ({ ctx, input }) => {
      const row = await awards.createWithPlayerNames(ctx.db, input);
      revalidate("/awards", "/portal/awards");
      return row;
    }),

  update: adminProcedure.input(awardUpdate).mutation(async ({ ctx, input }) => {
    const row = await awards.update(ctx.db, input.id, input.patch);
    revalidate("/awards", `/awards/${input.id}`, "/portal/awards");
    return row;
  }),

  delete: adminProcedure.input(byId).mutation(async ({ ctx, input }) => {
    const row = await awards.remove(ctx.db, input.id);
    revalidate("/awards", "/portal/awards");
    return row;
  }),
});
