import { games } from "@server/services";
import { adminProcedure, publicProcedure, router } from "../init";
import { revalidate } from "../revalidate";
import { byId, gameCreate, gameCreateByNames, gameCreateMany, gameUpdate } from "../schemas";

export const gamesRouter = router({
  list: publicProcedure.query(({ ctx }) => games.list(ctx.db)),

  byId: publicProcedure.input(byId).query(({ ctx, input }) => games.getById(ctx.db, input.id)),

  count: adminProcedure.query(({ ctx }) => games.count(ctx.db)),

  create: adminProcedure.input(gameCreate).mutation(async ({ ctx, input }) => {
    const row = await games.create(ctx.db, input);
    revalidate("/games", "/portal/games", "/profile");
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
    revalidate("/games", `/games/${input.id}`, "/portal/games", "/profile");
    return row;
  }),

  delete: adminProcedure.input(byId).mutation(async ({ ctx, input }) => {
    const row = await games.remove(ctx.db, input.id);
    revalidate("/games", "/portal/games", "/profile");
    return row;
  }),
});
