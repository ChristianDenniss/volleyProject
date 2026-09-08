import { z } from "zod";
import { sheetImport, type AssembledSources } from "@server/services";
import { adminProcedure, router } from "../init";
import {
  sheetImportAssembleFull,
  sheetImportAssembleTeams,
  isoDate,
} from "../schemas";

const sheetUrl = z.string().url();
const sessionId = z.string().uuid();

export const sheetImportRouter = router({
  startSession: adminProcedure.mutation(async () => {
    return { sessionId: await sheetImport.createSheetImportSession() };
  }),

  loadMaster: adminProcedure
    .input(z.object({ url: sheetUrl, startDate: isoDate.optional(), sessionId: sessionId.optional() }))
    .mutation(async ({ input }) => {
      const year = input.startDate
        ? Number.parseInt(input.startDate.slice(0, 4), 10)
        : new Date().getUTCFullYear();
      const master = await sheetImport.loadMasterSource(input.url, year);
      if (input.sessionId) {
        await sheetImport.mergeSheetImportSession(input.sessionId, {
          masterTeams: master.teams,
          masterGames: master.games,
          sourceWarnings: master.warnings,
        });
      }
      return master;
    }),

  loadRegionalBatch: adminProcedure
    .input(
      z.object({
        url: sheetUrl,
        region: z.enum(["na", "eu", "as"]),
        startIndex: z.number().int().nonnegative().optional(),
        batchSize: z.number().int().positive().max(12).optional(),
        sessionId: sessionId.optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const batch = await sheetImport.loadRegionalSourceBatch({
        url: input.url,
        region: input.region,
        ...(input.startIndex != null ? { startIndex: input.startIndex } : {}),
        ...(input.batchSize != null ? { batchSize: input.batchSize } : {}),
      });
      if (input.sessionId) {
        await sheetImport.mergeSheetImportSession(input.sessionId, {
          regionalTeams: batch.teams,
          regionalBlocks: batch.blocks,
          sourceWarnings: batch.warnings,
        });
      }
      return batch;
    }),

  assemblePreview: adminProcedure
    .input(z.union([sheetImportAssembleFull, sheetImportAssembleTeams]))
    .mutation(async ({ ctx, input }) => {
      const { sources: posted, sessionId: importSessionId, ...meta } = input;
      const sources = posted
        ? (posted as AssembledSources)
        : await sheetImport.requireSheetImportSession(importSessionId!);
      const preview = await sheetImport.assembleSheetImportPreview(ctx.db, meta, sources);
      return sheetImport.toClientPreview(preview);
    }),
});
