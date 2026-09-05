import { z } from "zod";
import { sheetImport } from "@server/services";
import { adminProcedure, router } from "../init";
import { sheetImportFull, sheetImportTeams, isoDate } from "../schemas";

const sheetUrl = z.string().url();

const parsedTeam = z.object({
  name: z.string(),
  region: z.enum(["na", "eu", "as"]).nullable(),
  playerNames: z.array(z.string()),
});

const parsedGame = z.object({
  key: z.string(),
  region: z.enum(["na", "eu", "as"]),
  phase: z.enum(["qualifiers", "playoffs"]),
  round: z.string(),
  date: z.string(),
  team1Name: z.string(),
  team2Name: z.string(),
  team1Score: z.number().nullable(),
  team2Score: z.number().nullable(),
  setScores: z.array(z.string()),
  forfeit: z.boolean(),
});

const statCounts = z.object({
  spikeKills: z.number(),
  spikeAttempts: z.number(),
  spikingErrors: z.number(),
  apeKills: z.number(),
  apeAttempts: z.number(),
  assists: z.number(),
  settingErrors: z.number(),
  blocks: z.number(),
  blockFollows: z.number(),
  digs: z.number(),
  aces: z.number(),
  servingErrors: z.number(),
  miscErrors: z.number(),
});

const parsedBlock = z.object({
  teamName: z.string(),
  region: z.enum(["na", "eu", "as"]),
  winnerName: z.string(),
  teamScore: z.number(),
  opponentScore: z.number(),
  rows: z.array(statCounts.extend({ playerName: z.string() })),
});

const assembledSources = z.object({
  masterTeams: z.array(parsedTeam),
  masterGames: z.array(parsedGame),
  regionalTeams: z.array(parsedTeam),
  regionalBlocks: z.array(parsedBlock),
  sourceWarnings: z.array(z.string()),
});

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
        startIndex: input.startIndex,
        batchSize: input.batchSize,
      });
    }),

  assemblePreview: adminProcedure
    .input(
      z.union([
        sheetImportFull.omit({ masterUrl: true, regionalUrls: true }).extend({
          sources: assembledSources,
        }),
        sheetImportTeams.omit({ masterUrl: true, regionalUrls: true }).extend({
          sources: assembledSources,
        }),
      ]),
    )
    .mutation(async ({ ctx, input }) => {
      const { sources, ...meta } = input;
      return sheetImport.assembleSheetImportPreview(ctx.db, meta, sources);
    }),
});
