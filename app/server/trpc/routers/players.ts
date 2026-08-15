import { players } from "@server/services";
import { adminProcedure, router } from "../init";
import { revalidate } from "../revalidate";
import {
  byId,
  playerCreate,
  playerCreateByTeamName,
  playerCreateMany,
  playerCreateManyByTeamName,
  playerMerge,
  playerUpdate,
} from "../schemas";

export const playersRouter = router({
  create: adminProcedure.input(playerCreate).mutation(async ({ ctx, input }) => {
    const row = input.teamName
      ? await players.createByTeamName(ctx.db, {
          name: input.name,
          position: input.position,
          teamName: input.teamName,
        })
      : await players.create(ctx.db, {
          name: input.name,
          position: input.position,
          teamId: input.teamId,
        });
    revalidate("/players", "/portal/players");
    return row;
  }),

  createByTeamName: adminProcedure
    .input(playerCreateByTeamName)
    .mutation(async ({ ctx, input }) => {
      const row = await players.createByTeamName(ctx.db, input);
      revalidate("/players", "/portal/players");
      return row;
    }),

  createMany: adminProcedure.input(playerCreateMany).mutation(async ({ ctx, input }) => {
    const rows = await players.createMany(ctx.db, input.players);
    revalidate("/players", "/portal/players");
    return rows;
  }),

  createManyByTeamName: adminProcedure
    .input(playerCreateManyByTeamName)
    .mutation(async ({ ctx, input }) => {
      const rows = await players.createManyByTeamName(ctx.db, input);
      revalidate("/players", "/teams", "/portal/players");
      return rows;
    }),

  update: adminProcedure.input(playerUpdate).mutation(async ({ ctx, input }) => {
    const row = await players.update(ctx.db, input.id, input.patch);
    revalidate("/players", `/players/${input.id}`, "/portal/players");
    return row;
  }),

  delete: adminProcedure.input(byId).mutation(async ({ ctx, input }) => {
    const row = await players.remove(ctx.db, input.id);
    revalidate("/players", "/portal/players");
    return row;
  }),

  merge: adminProcedure.input(playerMerge).mutation(async ({ ctx, input }) => {
    const row = await players.merge(ctx.db, input.targetId, input.mergedId);
    revalidate("/players", `/players/${input.targetId}`, "/portal/players");
    return row;
  }),
});
