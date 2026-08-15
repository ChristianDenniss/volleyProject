export type ProcedureAccess = "public" | "protected" | "admin";
export type ProcedureStatus = "todo" | "done" | "removed";

export interface TrpcManifestEntry {
  endpoint: string;
  procedure: string | null;
  access: ProcedureAccess;
  status: ProcedureStatus;
  rationale?: string;
}

const PUT_DUPLICATE = "PUT duplicate of the PATCH route; both pointed at the same controller method";

export const trpcManifest: TrpcManifestEntry[] = [
  { endpoint: "PATCH /api/admin/users/:id/role", procedure: "users.setRole", access: "admin", status: "todo" },

  { endpoint: "POST /api/articles", procedure: "articles.create", access: "protected", status: "todo" },
  { endpoint: "PATCH /api/articles/:id", procedure: "articles.update", access: "protected", status: "todo" },
  { endpoint: "DELETE /api/articles/:id", procedure: "articles.delete", access: "protected", status: "todo" },
  { endpoint: "PUT /api/articles/:id", procedure: null, access: "protected", status: "removed", rationale: PUT_DUPLICATE },
  { endpoint: "POST /api/articles/:id/like", procedure: "articles.like", access: "protected", status: "todo" },
  { endpoint: "DELETE /api/articles/:id/like", procedure: "articles.unlike", access: "protected", status: "todo" },

  { endpoint: "POST /api/awards", procedure: "awards.create", access: "admin", status: "todo" },
  { endpoint: "PATCH /api/awards/:id", procedure: "awards.update", access: "admin", status: "todo" },
  { endpoint: "DELETE /api/awards/:id", procedure: "awards.delete", access: "admin", status: "todo" },
  { endpoint: "POST /api/awards/with-names", procedure: "awards.createWithPlayerNames", access: "admin", status: "todo" },

  { endpoint: "POST /api/games", procedure: "games.create", access: "admin", status: "todo" },
  { endpoint: "PATCH /api/games/:id", procedure: "games.update", access: "admin", status: "todo" },
  { endpoint: "DELETE /api/games/:id", procedure: "games.delete", access: "admin", status: "todo" },
  { endpoint: "PUT /api/games/:id", procedure: null, access: "admin", status: "removed", rationale: PUT_DUPLICATE },
  { endpoint: "POST /api/games/batch", procedure: "games.createMany", access: "admin", status: "todo" },
  { endpoint: "POST /api/games/createByNames", procedure: "games.createByNames", access: "admin", status: "todo" },

  { endpoint: "POST /api/matches", procedure: "matches.create", access: "admin", status: "todo" },
  { endpoint: "PATCH /api/matches/:id", procedure: "matches.update", access: "admin", status: "todo" },
  { endpoint: "DELETE /api/matches/:id", procedure: "matches.delete", access: "admin", status: "todo" },
  { endpoint: "PUT /api/matches/:id", procedure: null, access: "admin", status: "removed", rationale: PUT_DUPLICATE },
  { endpoint: "POST /api/matches/import-challonge", procedure: "matches.importFromChallonge", access: "admin", status: "todo" },

  { endpoint: "POST /api/players", procedure: "players.create", access: "admin", status: "todo" },
  { endpoint: "PATCH /api/players/:id", procedure: "players.update", access: "admin", status: "todo" },
  { endpoint: "DELETE /api/players/:id", procedure: "players.delete", access: "admin", status: "todo" },
  { endpoint: "PUT /api/players/:id", procedure: null, access: "admin", status: "removed", rationale: PUT_DUPLICATE },
  { endpoint: "POST /api/players/batch", procedure: "players.createMany", access: "admin", status: "todo" },
  { endpoint: "POST /api/players/batch/by-team-name", procedure: "players.createManyByTeamName", access: "admin", status: "todo" },
  { endpoint: "POST /api/players/by-team-name", procedure: "players.createByTeamName", access: "admin", status: "todo" },
  { endpoint: "POST /api/players/merge", procedure: "players.merge", access: "admin", status: "todo" },

  { endpoint: "POST /api/records", procedure: "records.create", access: "admin", status: "todo" },
  { endpoint: "PATCH /api/records/:id", procedure: "records.update", access: "admin", status: "todo" },
  { endpoint: "DELETE /api/records/:id", procedure: "records.delete", access: "admin", status: "todo" },
  { endpoint: "PUT /api/records/:id", procedure: null, access: "admin", status: "removed", rationale: PUT_DUPLICATE },
  { endpoint: "POST /api/records/calculate", procedure: "records.recalculate", access: "admin", status: "todo" },

  { endpoint: "POST /api/seasons", procedure: "seasons.create", access: "admin", status: "todo" },
  { endpoint: "PATCH /api/seasons/:id", procedure: "seasons.update", access: "admin", status: "todo" },
  { endpoint: "DELETE /api/seasons/:id", procedure: "seasons.delete", access: "admin", status: "todo" },
  { endpoint: "PUT /api/seasons/:id", procedure: null, access: "admin", status: "removed", rationale: PUT_DUPLICATE },

  { endpoint: "POST /api/stats", procedure: "stats.create", access: "admin", status: "todo" },
  { endpoint: "PATCH /api/stats/:id", procedure: "stats.update", access: "admin", status: "todo" },
  { endpoint: "DELETE /api/stats/:id", procedure: "stats.delete", access: "admin", status: "todo" },
  { endpoint: "PUT /api/stats/:id", procedure: null, access: "admin", status: "removed", rationale: PUT_DUPLICATE },
  { endpoint: "POST /api/stats/add-to-game", procedure: "stats.addToGame", access: "admin", status: "todo" },
  { endpoint: "POST /api/stats/batch-csv", procedure: "stats.createManyFromRows", access: "admin", status: "todo", rationale: "the CSV is parsed in the browser by the existing utils/csvParser.ts and posted as rows" },
  { endpoint: "POST /api/stats/by-name", procedure: "stats.createByName", access: "admin", status: "todo" },

  { endpoint: "POST /api/teams", procedure: "teams.create", access: "admin", status: "todo" },
  { endpoint: "PATCH /api/teams/:id", procedure: "teams.update", access: "admin", status: "todo" },
  { endpoint: "DELETE /api/teams/:id", procedure: "teams.delete", access: "admin", status: "todo" },
  { endpoint: "PUT /api/teams/:id", procedure: null, access: "admin", status: "removed", rationale: PUT_DUPLICATE },
  { endpoint: "POST /api/teams/batch", procedure: "teams.createMany", access: "admin", status: "todo" },

  { endpoint: "POST /api/trivia/guess", procedure: "trivia.checkGuess", access: "public", status: "todo" },

  { endpoint: "POST /api/users/login", procedure: null, access: "public", status: "removed", rationale: "better-auth owns sign-in through the Roblox provider" },
  { endpoint: "POST /api/users/register", procedure: null, access: "public", status: "removed", rationale: "better-auth creates the user record on first Roblox callback" },
];

export const trpcManifestByEndpoint = new Map(trpcManifest.map((entry) => [entry.endpoint, entry]));

export const expectedProcedures = trpcManifest
  .filter((entry) => entry.procedure !== null)
  .map((entry) => ({ procedure: entry.procedure as string, access: entry.access, endpoint: entry.endpoint }));
