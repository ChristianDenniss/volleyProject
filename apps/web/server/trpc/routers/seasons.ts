import { env } from "cloudflare:workers";
import { seasons, sheetImport, type AssembledSources, type SheetImportPreview } from "@server/services";
import { adminProcedure, publicProcedure, router, scopedRegion } from "../init";
import { cachedQuery } from "../cached";
import { revalidate } from "../revalidate";
import {
  byId,
  optionalRegion,
  regionValue,
  seasonCreate,
  seasonUpdate,
  sheetImportFull,
} from "../schemas";

export const seasonsRouter = router({
  list: publicProcedure.input(optionalRegion).query(({ ctx, input }) => {
    const region = scopedRegion(ctx, input?.region);
    return cachedQuery("seasons", ["list", region ?? null], () => seasons.list(ctx.db, region));
  }),

  byId: publicProcedure
    .input(byId.extend({ region: regionValue }))
    .query(({ ctx, input }) => seasons.getById(ctx.db, input.id, scopedRegion(ctx, input.region))),

  count: adminProcedure.query(({ ctx }) => seasons.count(ctx.db)),

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

  previewSheetImport: adminProcedure.input(sheetImportFull).mutation(async ({ ctx, input }) => {
    return sheetImport.buildSheetImportPreview(ctx.db, {
      mode: "full",
      seasonNumber: input.seasonNumber,
      startDate: input.startDate,
      endDate: input.endDate,
      theme: input.theme,
      masterUrl: input.masterUrl,
      regionalUrls: input.regionalUrls,
      excludeTeamKeys: input.excludeTeamKeys,
      excludeGameKeys: input.excludeGameKeys,
    });
  }),

  commitSheetImport: adminProcedure.input(sheetImportFull).mutation(async ({ ctx, input }) => {
    const result = await sheetImport.commitSheetImport(
      ctx.db,
      {
        mode: "full",
        seasonNumber: input.seasonNumber,
        startDate: input.startDate,
        endDate: input.endDate,
        theme: input.theme,
        masterUrl: input.masterUrl,
        regionalUrls: input.regionalUrls,
        sessionId: input.sessionId,
        sources: input.sources as AssembledSources | undefined,
        preview: input.preview as SheetImportPreview | undefined,
        excludeTeamKeys: input.excludeTeamKeys,
        excludeGameKeys: input.excludeGameKeys,
      },
      {
        queue: env.RECORDS_QUEUE,
        requestedBy: ctx.user.id,
        d1: env.DB,
      },
    );
    revalidate(
      "/",
      "/seasons",
      "/portal/seasons",
      "/portal/teams",
      "/portal/players",
      "/portal/games",
      "/portal/stats",
      "/teams",
      "/players",
      "/games",
      "/stats",
      "/schedules",
    );
    return result;
  }),
});
