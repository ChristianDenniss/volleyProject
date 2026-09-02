import { env } from "cloudflare:workers";
import { TRPCError } from "@trpc/server";
import { matches } from "@server/services";
import { adminProcedure, publicProcedure, router } from "../init";
import { revalidate } from "../revalidate";
import { byId, matchCreate, matchImportChallonge, matchUpdate, optionalSeason } from "../schemas";

export const matchesRouter = router({
  list: publicProcedure
    .input(optionalSeason)
    .query(({ ctx, input }) =>
      input.seasonId === undefined
        ? matches.list(ctx.db)
        : matches.listBySeason(ctx.db, input.seasonId),
    ),

  count: adminProcedure.query(({ ctx }) => matches.count(ctx.db)),

  create: adminProcedure.input(matchCreate).mutation(async ({ ctx, input }) => {
    const row = await matches.create(ctx.db, input);
    revalidate("/schedules", "/portal/matches");
    return row;
  }),

  update: adminProcedure.input(matchUpdate).mutation(async ({ ctx, input }) => {
    const row = await matches.update(ctx.db, input.id, input.patch);
    revalidate("/schedules", "/portal/matches");
    return row;
  }),

  delete: adminProcedure.input(byId).mutation(async ({ ctx, input }) => {
    const row = await matches.remove(ctx.db, input.id);
    revalidate("/schedules", "/portal/matches");
    return row;
  }),

  importFromChallonge: adminProcedure
    .input(matchImportChallonge)
    .mutation(async ({ ctx, input }) => {
      const apiKey = env.CHALLONGE_API_KEY;
      if (!apiKey) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "CHALLONGE_API_KEY is not configured for this worker",
        });
      }
      const result = await matches.importFromChallonge(ctx.db, { ...input, apiKey });
      revalidate("/schedules", "/portal/matches");
      return result;
    }),
});
