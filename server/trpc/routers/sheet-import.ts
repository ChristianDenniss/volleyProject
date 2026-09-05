import { z } from "zod";
import { sheetImport, type AssembledSources } from "@server/services";
import { adminProcedure, router } from "../init";
import { sheetImportFull, sheetImportSources, sheetImportTeams, isoDate } from "../schemas";

const sheetUrl = z.string().url();

export const sheetImportRouter = router({
  loadMaster: adminProcedure
    .input(z.object({ url: sheetUrl, startDate: isoDate.optional() }))
    .mutation(async ({ input }) => {
      const year = input.startDate
        ? Number.parseInt(input.startDate.slice(0, 4), 10)
        : new Date().getUTCFullYear();
      return sheetImport.loadMasterSource(input.url, year);
    }),

  loadRegionalBatch: adminProcedure
    .input(
      z.object({
        url: sheetUrl,
        region: z.enum(["na", "eu", "as"]),
        startIndex: z.number().int().nonnegative().optional(),
        batchSize: z.number().int().positive().max(12).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return sheetImport.loadRegionalSourceBatch({
        url: input.url,
        region: input.region,
        ...(input.startIndex != null ? { startIndex: input.startIndex } : {}),
        ...(input.batchSize != null ? { batchSize: input.batchSize } : {}),
      });
    }),

  assemblePreview: adminProcedure
    .input(
      z.union([
        sheetImportFull.omit({ masterUrl: true, regionalUrls: true }).extend({
          sources: sheetImportSources,
        }),
        sheetImportTeams.omit({ masterUrl: true, regionalUrls: true }).extend({
          sources: sheetImportSources,
        }),
      ]),
    )
    .mutation(async ({ ctx, input }) => {
      const { sources, ...meta } = input;
      return sheetImport.assembleSheetImportPreview(ctx.db, meta, sources as AssembledSources);
    }),
});
