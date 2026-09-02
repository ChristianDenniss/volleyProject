import { trivia } from "@server/services";
import { publicProcedure, router } from "../init";
import { triviaGuess, triviaSubject } from "../schemas";

export const triviaRouter = router({
  randomPlayer: publicProcedure
    .input(triviaSubject)
    .query(({ ctx, input }) => trivia.randomPlayer(ctx.db, input.difficulty, () => input.seed)),

  randomTeam: publicProcedure
    .input(triviaSubject)
    .query(({ ctx, input }) => trivia.randomTeam(ctx.db, input.difficulty, () => input.seed)),

  randomSeason: publicProcedure
    .input(triviaSubject)
    .query(({ ctx, input }) => trivia.randomSeason(ctx.db, input.difficulty, () => input.seed)),

  checkGuess: publicProcedure.input(triviaGuess).mutation(({ ctx, input }) => {
    return trivia.checkGuess(ctx.db, input.type, input.id, input.guess);
  }),
});
