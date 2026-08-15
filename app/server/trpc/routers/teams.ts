import { teams } from "@server/services";
import { adminProcedure, router } from "../init";
import { revalidate } from "../revalidate";
import { byId, teamCreate, teamUpdate } from "../schemas";
import { z } from "zod";

export const teamsRouter = router({
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

  delete: adminProcedure.input(byId).mutation(async ({ ctx, input }) => {
    const row = await teams.remove(ctx.db, input.id);
    revalidate("/teams", "/portal/teams");
    return row;
  }),
});
