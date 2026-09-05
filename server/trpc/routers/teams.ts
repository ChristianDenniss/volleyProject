import { TRPCError } from "@trpc/server";
import { teams, sheetImport, type AssembledSources } from "@server/services";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../init";
import { revalidate } from "../revalidate";
import {
  bySeason,
  byTeamName,
  byId,
  teamCreate,
  teamUpdate,
  teamProfileUpdate,
  sheetImportTeams,
} from "../schemas";
import { z } from "zod";

export const teamsRouter = router({
  list: publicProcedure.query(({ ctx }) => teams.list(ctx.db)),

  byName: publicProcedure.input(byTeamName).query(async ({ ctx, input }) => {
    const team = await teams.getByName(ctx.db, input.name);
    if (!team) return null;
    const canEdit = await teams.canManageProfile(ctx.db, team.id, ctx.user);
    return { ...team, canEdit };
  }),

  playersBySeason: publicProcedure
    .input(bySeason)
    .query(({ ctx, input }) => teams.listPlayersBySeason(ctx.db, input.seasonId)),

  count: adminProcedure.query(({ ctx }) => teams.count(ctx.db)),

  create: adminProcedure.input(teamCreate).mutation(async ({ ctx, input }) => {
    const row = await teams.create(ctx.db, input);
    revalidate("/teams", "/portal/teams");
    return row;
  }),

  createMany: adminProcedure
    .input(z.object({ teams: z.array(teamCreate).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const rows = await teams.createMany(ctx.db, input.teams);
      revalidate("/teams", "/portal/teams");
      return rows;
    }),

  update: adminProcedure.input(teamUpdate).mutation(async ({ ctx, input }) => {
    const row = await teams.update(ctx.db, input.id, input.patch);
    revalidate("/teams", `/teams/${row.name}`, "/portal/teams");
    return row;
  }),

  updateProfile: protectedProcedure.input(teamProfileUpdate).mutation(async ({ ctx, input }) => {
    const allowed = await teams.canManageProfile(ctx.db, input.id, ctx.user);
    if (!allowed) throw new TRPCError({ code: "FORBIDDEN" });
    const row = await teams.updateProfile(ctx.db, input.id, input.patch);
    revalidate("/teams", `/teams/${row.name}`, "/portal/teams");
    return row;
  }),

  delete: adminProcedure.input(byId).mutation(async ({ ctx, input }) => {
    const row = await teams.remove(ctx.db, input.id);
    revalidate("/teams", "/portal/teams");
    return row;
  }),

  previewSheetImport: adminProcedure.input(sheetImportTeams).mutation(async ({ ctx, input }) => {
    return sheetImport.buildSheetImportPreview(ctx.db, {
      mode: input.mode,
      seasonId: input.seasonId,
      masterUrl: input.masterUrl,
      regionalUrls: input.regionalUrls,
      excludeTeamKeys: input.excludeTeamKeys,
      excludeGameKeys: input.excludeGameKeys,
    });
  }),

  commitSheetImport: adminProcedure.input(sheetImportTeams).mutation(async ({ ctx, input }) => {
    const result = await sheetImport.commitSheetImport(ctx.db, {
      mode: input.mode,
      seasonId: input.seasonId,
      masterUrl: input.masterUrl,
      regionalUrls: input.regionalUrls,
      sources: input.sources as AssembledSources | undefined,
      excludeTeamKeys: input.excludeTeamKeys,
      excludeGameKeys: input.excludeGameKeys,
    });
    revalidate("/teams", "/portal/teams", "/players", "/portal/players");
    return result;
  }),
});
