import { createCallerFactory, router } from "./init";
import { articlesRouter } from "./routers/articles";
import { awardsRouter } from "./routers/awards";
import { gamesRouter } from "./routers/games";
import { playersRouter } from "./routers/players";
import { recordsRouter } from "./routers/records";
import { seasonsRouter } from "./routers/seasons";
import { sheetImportRouter } from "./routers/sheet-import";
import { statsRouter } from "./routers/stats";
import { teamsRouter } from "./routers/teams";
import { triviaRouter } from "./routers/trivia";
import { usersRouter } from "./routers/users";

export const appRouter = router({
  articles: articlesRouter,
  awards: awardsRouter,
  games: gamesRouter,
  players: playersRouter,
  records: recordsRouter,
  seasons: seasonsRouter,
  sheetImport: sheetImportRouter,
  stats: statsRouter,
  teams: teamsRouter,
  trivia: triviaRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
