import { trivia } from "@server/services";
import { publicProcedure, router } from "../init";
import { triviaGuess } from "../schemas";

export const triviaRouter = router({
  checkGuess: publicProcedure.input(triviaGuess).mutation(({ ctx, input }) => {
    return trivia.checkGuess(ctx.db, input.type, input.id, input.guess);
  }),
});
