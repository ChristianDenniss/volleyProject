import type { Match } from "../types/interfaces";
import { http, HttpResponse, type JsonBodyType } from "msw";
import { bumpId, db, getAuthUser } from "./db";
import { MOCK_AUTH_TOKEN } from "./data";
import { toPaginatedResult } from "./pagination";
import {
  enrichTeam,
  getAwardsForPlayer,
  getPlayerDetail,
  getPlayersWithRelations,
  getSeasonDetail,
  getTeamsByName,
  getTriviaPlayer,
  getTriviaSeason,
  getTriviaTeam,
} from "./relations";
const api = (path: string) => `*/api/${path}`;

function json(data: JsonBodyType, status = 200) {
  return HttpResponse.json(data, { status });
}

function findById<T extends { id: number }>(items: T[], id: number) {
  return items.find((item) => item.id === id);
}

function removeById<T extends { id: number }>(items: T[], id: number) {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return false;
  items.splice(index, 1);
  return true;
}

function patchById<T extends { id: number }>(
  items: T[],
  id: number,
  updates: Partial<T>
) {
  const item = findById(items, id);
  if (!item) return null;
  Object.assign(item, updates);
  return item;
}

function paginated<T>(
  items: T[],
  request: Request,
  filter?: (item: T, params: URLSearchParams) => boolean
) {
  return toPaginatedResult(items, new URL(request.url).searchParams, filter);
}

function matchListFilter(match: Match, params: URLSearchParams): boolean {
  const search = params.get("search")?.toLowerCase();
  const round = params.get("round");
  const status = params.get("status");

  if (round && match.round !== round) return false;
  if (status && match.status !== status) return false;
  if (search) {
    const haystack = [
      match.matchNumber,
      match.team1Name,
      match.team2Name,
      match.round,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(search)) return false;
  }
  return true;
}

export const handlers = [
  // Auth
  http.post(api("users/login"), async () =>
    json({ token: MOCK_AUTH_TOKEN, user: getAuthUser() })
  ),
  http.post(api("users/register"), async ({ request }) => {
    const body = (await request.json()) as {
      username: string;
      email: string;
    };
    const user = {
      id: bumpId("users"),
      username: body.username,
      email: body.email,
      role: "user" as const,
    };
    db.users.push(user);
    return json({ token: MOCK_AUTH_TOKEN, user }, 201);
  }),
  http.get(api("users/profile"), () => json(getAuthUser())),
  http.get(api("users/:id"), ({ params }) => {
    const user = findById(db.users, Number(params.id));
    return user ? json(user) : json({ message: "Not found" }, 404);
  }),
  http.get(api("users"), ({ request }) => json(paginated(db.users, request))),
  http.patch(api("admin/users/:id/role"), async ({ params, request }) => {
    const body = (await request.json()) as { role: string };
    const user = patchById(db.users, Number(params.id), {
      role: body.role as (typeof db.users)[number]["role"],
    });
    return user ? json(user) : json({ message: "Not found" }, 404);
  }),

  // Seasons
  http.get(api("seasons/skinny"), ({ request }) => json(paginated(db.seasons, request))),
  http.get(api("seasons/medium"), ({ request }) => json(paginated(db.seasons, request))),
  http.get(api("seasons/:id"), ({ params }) => {
    const season = getSeasonDetail(Number(params.id));
    return season ? json([season]) : json([], 404);
  }),  http.get(api("seasons"), ({ request }) => json(paginated(db.seasons, request))),
  http.post(api("seasons"), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const season = { id: bumpId("seasons"), ...body };
    db.seasons.push(season as (typeof db.seasons)[number]);
    return json(season, 201);
  }),
  http.patch(api("seasons/:id"), async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const season = patchById(db.seasons, Number(params.id), body);
    return season ? json(season) : json({ message: "Not found" }, 404);
  }),
  http.delete(api("seasons/:id"), ({ params }) => {
    const ok = removeById(db.seasons, Number(params.id));
    return ok ? new HttpResponse(null, { status: 204 }) : json({ message: "Not found" }, 404);
  }),

  // Players
  http.get(api("players/medium"), ({ request }) => json(paginated(getPlayersWithRelations(), request))),
  http.get(api("players/:id"), ({ params }) => {
    const player = getPlayerDetail(Number(params.id));
    return player ? json(player) : json({ message: "Not found" }, 404);
  }),
  http.get(api("players"), ({ request }) => json(paginated(getPlayersWithRelations(), request))),  http.post(api("players/batch/by-team-name"), async ({ request }) => {
    const body = (await request.json()) as { players?: Array<{ name: string; position: string }> };
    const created = (body.players ?? []).map((player) => ({
      id: bumpId("players"),
      name: player.name,
      position: player.position,
    }));
    db.players.push(...created);
    return json(created, 201);
  }),
  http.post(api("players"), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const player = { id: bumpId("players"), ...body };
    db.players.push(player as (typeof db.players)[number]);
    return json(player, 201);
  }),
  http.patch(api("players/:id"), async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const player = patchById(db.players, Number(params.id), body);
    return player ? json(player) : json({ message: "Not found" }, 404);
  }),
  http.delete(api("players/:id"), ({ params }) => {
    const ok = removeById(db.players, Number(params.id));
    return ok ? new HttpResponse(null, { status: 204 }) : json({ message: "Not found" }, 404);
  }),

  // Teams
  http.get(api("teams/skinny"), ({ request }) => json(paginated(db.teams, request))),
  http.get(api("teams/medium"), ({ request }) => json(paginated(db.teams, request))),
  http.get(api("teams/name/:name"), ({ params }) => {
    const name = decodeURIComponent(String(params.name));
    return json(getTeamsByName(name));
  }),
  http.get(api("teams/:id"), ({ params }) => {
    const team = findById(db.teams, Number(params.id));
    return team ? json(enrichTeam(team)) : json({ message: "Not found" }, 404);
  }),  http.get(api("teams"), ({ request }) => json(paginated(db.teams, request))),
  http.post(api("teams/batch"), async ({ request }) => {
    const body = (await request.json()) as Array<Record<string, unknown>>;
    const created = body.map((team) => {
      const item = { id: bumpId("teams"), ...team };
      db.teams.push(item as (typeof db.teams)[number]);
      return item;
    });
    return json(created, 201);
  }),
  http.post(api("teams"), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const team = { id: bumpId("teams"), ...body };
    db.teams.push(team as (typeof db.teams)[number]);
    return json(team, 201);
  }),
  http.patch(api("teams/:id"), async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const team = patchById(db.teams, Number(params.id), body);
    return team ? json(team) : json({ message: "Not found" }, 404);
  }),
  http.delete(api("teams/:id"), ({ params }) => {
    const ok = removeById(db.teams, Number(params.id));
    return ok ? new HttpResponse(null, { status: 204 }) : json({ message: "Not found" }, 404);
  }),

  // Games
  http.get(api("games/skinny"), ({ request }) => json(paginated(db.games, request))),
  http.get(api("games/:id"), ({ params }) => {
    const game = findById(db.games, Number(params.id));
    return game ? json([game]) : json([], 404);
  }),
  http.get(api("games"), ({ request }) => json(paginated(db.games, request))),
  http.post(api("games"), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const game = { id: bumpId("games"), ...body };
    db.games.push(game as (typeof db.games)[number]);
    return json(game, 201);
  }),
  http.patch(api("games/:id"), async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const game = patchById(db.games, Number(params.id), body);
    return game ? json(game) : json({ message: "Not found" }, 404);
  }),
  http.delete(api("games/:id"), ({ params }) => {
    const ok = removeById(db.games, Number(params.id));
    return ok ? new HttpResponse(null, { status: 204 }) : json({ message: "Not found" }, 404);
  }),

  // Stats
  http.get(api("stats"), ({ request }) => json(paginated(db.stats, request))),
  http.post(api("stats/batch-csv"), async ({ request }) => {
    const body = (await request.json()) as { statsData?: Array<Record<string, unknown>> };
    const created = (body.statsData ?? []).map((stat) => ({
      id: bumpId("stats"),
      ...stat,
    }));
    db.stats.push(...(created as (typeof db.stats)[number][]));
    return json({ game: db.games[0], stats: created }, 201);
  }),
  http.post(api("stats/add-to-game"), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const stat = { id: bumpId("stats"), ...body };
    db.stats.push(stat as (typeof db.stats)[number]);
    return json(stat, 201);
  }),
  http.patch(api("stats/:id"), async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const stat = patchById(db.stats, Number(params.id), body);
    return stat ? json(stat) : json({ message: "Not found" }, 404);
  }),
  http.delete(api("stats/:id"), ({ params }) => {
    const ok = removeById(db.stats, Number(params.id));
    return ok ? new HttpResponse(null, { status: 204 }) : json({ message: "Not found" }, 404);
  }),

  // Articles
  http.get(api("articles/:id/like-status"), () => json({ liked: false })),
  http.post(api("articles/:id/like"), () => json({ liked: true, likes: 1 })),
  http.delete(api("articles/:id/like"), () => json({ liked: false, likes: 0 })),
  http.get(api("articles/:id"), ({ params }) => {
    const article = findById(db.articles, Number(params.id));
    return article ? json([article]) : json([], 404);
  }),
  http.get(api("articles"), ({ request }) => json(paginated(db.articles, request))),
  http.post(api("articles"), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const article = {
      id: bumpId("articles"),
      likes: 0,
      approved: false,
      author: getAuthUser(),
      createdAt: new Date().toISOString(),
      ...body,
    };
    db.articles.push(article as (typeof db.articles)[number]);
    return json(article, 201);
  }),
  http.patch(api("articles/:id"), async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const article = patchById(db.articles, Number(params.id), body);
    return article ? json(article) : json({ message: "Not found" }, 404);
  }),
  http.delete(api("articles/:id"), ({ params }) => {
    const ok = removeById(db.articles, Number(params.id));
    return ok ? new HttpResponse(null, { status: 204 }) : json({ message: "Not found" }, 404);
  }),

  // Awards
  http.get(api("awards/skinny"), ({ request }) => json(paginated(db.awards, request))),
  http.get(api("awards/player/:playerId"), ({ params, request }) =>
    json(paginated(getAwardsForPlayer(Number(params.playerId)), request))
  ),  http.get(api("awards/:id"), ({ params }) => {
    const award = findById(db.awards, Number(params.id));
    return award ? json(award) : json({ message: "Not found" }, 404);
  }),
  http.get(api("awards"), ({ request }) => json(paginated(db.awards, request))),
  http.post(api("awards/with-names"), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const season = db.seasons.find((s) => s.id === body.seasonId) ?? db.seasons[0];
    const award = {
      id: bumpId("awards"),
      type: String(body.type ?? "Award"),
      description: String(body.description ?? ""),
      players: [],
      season,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.awards.push(award);
    return json(award, 201);
  }),
  http.post(api("awards"), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const award = { id: bumpId("awards"), ...body };
    db.awards.push(award as (typeof db.awards)[number]);
    return json(award, 201);
  }),
  http.patch(api("awards/:id"), async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const award = patchById(db.awards, Number(params.id), body);
    return award ? json(award) : json({ message: "Not found" }, 404);
  }),
  http.delete(api("awards/:id"), ({ params }) => {
    const ok = removeById(db.awards, Number(params.id));
    return ok ? new HttpResponse(null, { status: 204 }) : json({ message: "Not found" }, 404);
  }),

  // Matches
  http.get(api("matches/season/:seasonId/round/:round"), ({ params, request }) => {
    const seasonId = Number(params.seasonId);
    const round = String(params.round);
    const matches = db.matches.filter(
      (match) => match.seasonId === seasonId && match.round === round
    );
    return json(paginated(matches, request, matchListFilter));
  }),
  http.get(api("matches/season/:seasonId"), ({ params, request }) => {
    const seasonId = Number(params.seasonId);
    const filtered = db.matches.filter((match) => match.seasonId === seasonId);
    return json(paginated(filtered, request, matchListFilter));
  }),
  http.get(api("matches/:id"), ({ params }) => {
    const match = findById(db.matches, Number(params.id));
    return match ? json(match) : json({ message: "Not found" }, 404);
  }),
  http.get(api("matches"), ({ request }) =>
    json(paginated(db.matches, request, matchListFilter))
  ),
  http.post(api("matches/import-challonge"), () =>
    json({ imported: 2, matches: db.matches })
  ),
  http.post(api("matches"), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const match = { id: bumpId("matches"), status: "scheduled", ...body };
    db.matches.push(match as (typeof db.matches)[number]);
    return json(match, 201);
  }),
  http.patch(api("matches/:id"), async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const match = patchById(db.matches, Number(params.id), body);
    return match ? json(match) : json({ message: "Not found" }, 404);
  }),
  http.delete(api("matches/:id"), ({ params }) => {
    const ok = removeById(db.matches, Number(params.id));
    return ok ? new HttpResponse(null, { status: 204 }) : json({ message: "Not found" }, 404);
  }),

  // Records
  http.get(api("records"), ({ request }) => json(paginated(db.records, request))),
  http.post(api("records/calculate"), () => json({ updated: db.records.length, records: db.records })),

  // Trivia
  http.get(api("trivia/player"), () => json(getTriviaPlayer())),
  http.get(api("trivia/team"), () => json(getTriviaTeam())),
  http.get(api("trivia/season"), () => json(getTriviaSeason())),  http.post(api("trivia/guess"), async ({ request }) => {
    const body = (await request.json()) as { guess?: string; answer?: string };
    const correct =
      body.guess?.toLowerCase().trim() === body.answer?.toLowerCase().trim();
    return json({
      correct,
      answer: body.answer,
      message: correct ? "Correct!" : "Not quite — try again.",
    });
  }),

  // Roblox avatar stub
  http.get(api("roblox/avatar/:username"), ({ params }) =>
    json({
      username: params.username,
      avatarUrl: "https://placehold.co/150x150/111827/ffffff?text=Avatar",
    })
  ),
];
