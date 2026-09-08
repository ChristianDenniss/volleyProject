import { trivia } from "@server/services";
import { publicProcedure, router } from "../init";
import { triviaGuess, triviaSubject } from "../schemas";

// These are public HTTP endpoints and the seed comes from the client, so anyone
// can ask for the exact subject they are being shown. `checkGuess` compares the
// guess against the player/team name and the season number, so those three fields
// are the answer and must not travel with the clues.
export const triviaRouter = router({
  randomPlayer: publicProcedure.input(triviaSubject).query(async ({ ctx, input }) => {
    const { name: _answer, ...clues } = await trivia.randomPlayer(
      ctx.db,
      input.difficulty,
      () => input.seed,
    );
    return clues;
  }),

  randomTeam: publicProcedure.input(triviaSubject).query(async ({ ctx, input }) => {
    const { name: _answer, ...clues } = await trivia.randomTeam(
      ctx.db,
      input.difficulty,
      () => input.seed,
    );
    return clues;
  }),

  randomSeason: publicProcedure.input(triviaSubject).query(async ({ ctx, input }) => {
    const {
      seasonNumber: _answer,
      teams,
      ...clues
    } = await trivia.randomSeason(ctx.db, input.difficulty, () => input.seed);
    // Team names carry an "(sN)" suffix, which would give the season away.
    return { ...clues, teams: teams.map(({ name: _teamName, ...team }) => team) };
  }),

  checkGuess: publicProcedure.input(triviaGuess).mutation(({ ctx, input }) => {
    return trivia.checkGuess(ctx.db, input.type, input.id, input.guess);
  }),
});
