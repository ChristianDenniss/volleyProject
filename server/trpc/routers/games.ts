import { env } from "cloudflare:workers";
import { TRPCError } from "@trpc/server";
import { games } from "@server/services";
import { adminProcedure, publicProcedure, router } from "../init";
import { revalidate } from "../revalidate";
import {
  byId,
  gameCreate,
  gameCreateByNames,
  gameCreateMany,
  gameImportChallonge,
  gameUpdate,
  optionalSeason,
} from "../schemas";

const schedulePaths = ["/schedules", "/portal/games", "/"];

export const gamesRouter = router({
  list: publicProcedure.query(({ ctx }) => games.list(ctx.db)),

  listPlayed: publicProcedure.query(({ ctx }) => games.listPlayed(ctx.db)),

  listSchedule: publicProcedure
    .input(optionalSeason)
    .query(({ ctx, input }) => games.listSchedule(ctx.db, input.seasonId)),

  byId: publicProcedure.input(byId).query(({ ctx, input }) => games.getById(ctx.db, input.id)),

  count: adminProcedure.query(({ ctx }) => games.count(ctx.db)),

  create: adminProcedure.input(gameCreate).mutation(async ({ ctx, input }) => {
    const row = await games.create(ctx.db, input);
    revalidate("/games", "/portal/games", "/profile", ...schedulePaths);
    return row;
  }),

  createMany: adminProcedure.input(gameCreateMany).mutation(async ({ ctx, input }) => {
    const rows = await games.createMany(ctx.db, input.games);
    revalidate("/games", "/portal/games", "/profile");
    return rows;
  }),

  createByNames: adminProcedure.input(gameCreateByNames).mutation(async ({ ctx, input }) => {
    const row = await games.createByNames(ctx.db, input);
    revalidate("/games", "/portal/games", "/profile");
    return row;
  }),

  update: adminProcedure.input(gameUpdate).mutation(async ({ ctx, input }) => {
    const row = await games.update(ctx.db, input.id, input.patch);
    revalidate("/games", `/games/${input.id}`, "/portal/games", "/profile", ...schedulePaths);
    return row;
  }),

  delete: adminProcedure.input(byId).mutation(async ({ ctx, input }) => {
    const row = await games.remove(ctx.db, input.id);
    revalidate("/games", "/portal/games", "/profile", ...schedulePaths);
    return row;
  }),

  importFromChallonge: adminProcedure
    .input(gameImportChallonge)
    .mutation(async ({ ctx, input }) => {
      const apiKey = env.CHALLONGE_API_KEY;
      if (!apiKey) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "CHALLONGE_API_KEY is not configured for this worker",
        });
      }
      const result = await games.importFromChallonge(ctx.db, { ...input, apiKey });
      revalidate(...schedulePaths);
      return result;
    }),
});
