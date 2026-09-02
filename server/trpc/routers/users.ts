import { users } from "@server/services";
import { adminProcedure, protectedProcedure, router } from "../init";
import { revalidate } from "../revalidate";
import { userSetRole } from "../schemas";

export const usersRouter = router({
  list: adminProcedure.query(({ ctx }) => users.list(ctx.db)),

  me: protectedProcedure.query(({ ctx }) => users.profile(ctx.db, ctx.user.id)),

  count: adminProcedure.query(({ ctx }) => users.count(ctx.db)),

  setRole: adminProcedure.input(userSetRole).mutation(async ({ ctx, input }) => {
    const row = await users.setRole(ctx.db, input.id, input.role);
    revalidate("/portal/users");
    return row;
  }),
});
