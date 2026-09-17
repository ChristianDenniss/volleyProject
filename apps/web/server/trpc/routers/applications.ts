import { applications } from "@server/services";
import { adminProcedure, publicProcedure, router } from "../init";
import { revalidate } from "../revalidate";
import { applicationUpdate } from "../schemas";

export const applicationsRouter = router({
  list: publicProcedure.query(({ ctx }) => applications.list(ctx.db)),

  count: adminProcedure.query(({ ctx }) => applications.count(ctx.db)),

  update: adminProcedure.input(applicationUpdate).mutation(async ({ ctx, input }) => {
    const row = await applications.updateBySlug(ctx.db, input.slug, {
      url: input.url,
      status: input.status,
    });
    await revalidate("/applications", "/portal/applications");
    return row;
  }),
});
