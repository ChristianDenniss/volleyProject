import { env } from "cloudflare:workers";
import { TRPCError } from "@trpc/server";
import { games } from "@server/services";
import { adminProcedure, publicProcedure, router, scopedRegion } from "../init";
import { cachedQuery } from "../cached";
import { revalidate } from "../revalidate";
import {
  byId,
  gameListPage,
  gameCreate,
  gameCreateByNames,
  gameCreateMany,
  gameImportChallonge,
  gameUpdate,
  optionalRegion,
  optionalSeason,
  scheduleFilterOptions,
  schedulePage,
} from "../schemas";

const schedulePaths = ["/schedules", "/portal/games", "/"];

export const gamesRouter = router({
  list: publicProcedure
    .input(optionalRegion)
    .query(({ ctx, input }) => games.list(ctx.db, scopedRegion(ctx, input?.region))),

  listPlayed: publicProcedure
    .input(optionalRegion)
    .query(({ ctx, input }) => games.listPlayed(ctx.db, scopedRegion(ctx, input?.region))),

  listPlayedPage: publicProcedure.input(gameListPage).query(({ ctx, input }) =>
    games.listPlayedPage(ctx.db, {
      ...input,
      region: scopedRegion(ctx, input.region),
    }),
  ),

  listPage: adminProcedure.input(gameListPage).query(({ ctx, input }) =>
    games.listPage(ctx.db, {
      ...input,
      region: scopedRegion(ctx, input.region),
    }),
  ),

  stages: publicProcedure.input(optionalRegion).query(({ ctx, input }) => {
    const region = scopedRegion(ctx, input?.region);
    return cachedQuery("games", ["stages", region ?? null], () => games.listStages(ctx.db, region));
  }),

  listSchedule: publicProcedure.input(optionalSeason).query(({ ctx, input }) => {
    const region = scopedRegion(ctx, input.region);
    return cachedQuery("games", ["schedule", input.seasonId ?? null, region ?? null], () =>
      games.listSchedule(ctx.db, input.seasonId, region),
    );
  }),

  schedulePage: publicProcedure.input(schedulePage).query(({ ctx, input }) =>
    games.listSchedulePage(ctx.db, {
      ...input,
      region: scopedRegion(ctx, input.region),
    }),
  ),

  scheduleFilters: publicProcedure.input(scheduleFilterOptions).query(async ({ ctx, input }) => {
    const region = scopedRegion(ctx, input.region);
    return cachedQuery(
      "games",
      ["schedule-filters", input.seasonId ?? null, region ?? null],
      async () => {
        const [statuses, rounds] = await Promise.all([
          games.listScheduleStatuses(ctx.db, input.seasonId, region),
          games.listScheduleRounds(ctx.db, input.seasonId, region),
        ]);
        return { statuses, rounds };
      },
    );
  }),

  byId: publicProcedure
    .input(byId)
    .query(({ ctx, input }) => games.getById(ctx.db, input.id, scopedRegion(ctx))),

  count: adminProcedure.query(({ ctx }) => games.count(ctx.db)),

  create: adminProcedure.input(gameCreate).mutation(async ({ ctx, input }) => {
    const row = await games.create(ctx.db, input);
    revalidate("/games", "/portal/games", "/profile", ...schedulePaths);
    return row;
  }),

  createMany: adminProcedure.input(gameCreateMany).mutation(async ({ ctx, input }) => {
    const rows = await games.createMany(ctx.db, input.games);
    revalidate("/games", "/portal/games", "/profile", ...schedulePaths);
    return rows;
  }),

  createByNames: adminProcedure.input(gameCreateByNames).mutation(async ({ ctx, input }) => {
    const row = await games.createByNames(ctx.db, input);
    revalidate("/games", "/portal/games", "/profile", ...schedulePaths);
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
