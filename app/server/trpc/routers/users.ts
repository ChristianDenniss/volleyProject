import { users } from "@server/services";
import { adminProcedure, router } from "../init";
import { revalidate } from "../revalidate";
import { userSetRole } from "../schemas";

export const usersRouter = router({
  setRole: adminProcedure.input(userSetRole).mutation(async ({ ctx, input }) => {
    const row = await users.setRole(ctx.db, input.id, input.role);
    revalidate("/portal/users");
    return row;
  }),
});
