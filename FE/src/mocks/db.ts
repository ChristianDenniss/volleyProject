import {
  mockApplications,
  mockArticles,
  mockAwards,
  mockAuthUser,
  mockGames,
  mockMatches,
  mockPlayers,
  mockRecords,
  mockSeasons,
  mockStats,
  mockTeams,
  mockUsers,
} from "./data";

type IdCounters = {
  articles: number;
  awards: number;
  games: number;
  matches: number;
  players: number;
  records: number;
  seasons: number;
  stats: number;
  teams: number;
  users: number;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function nextId(items: { id: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

export const db = {
  users: clone(mockUsers),
  seasons: clone(mockSeasons),
  players: clone(mockPlayers),
  teams: clone(mockTeams),
  games: clone(mockGames),
  stats: clone(mockStats),
  articles: clone(mockArticles),
  awards: clone(mockAwards),
  matches: clone(mockMatches),
  records: clone(mockRecords),
  applications: clone(mockApplications),
  ids: {
    articles: nextId(mockArticles),
    awards: nextId(mockAwards),
    games: nextId(mockGames),
    matches: nextId(mockMatches),
    players: nextId(mockPlayers),
    records: nextId(mockRecords),
    seasons: nextId(mockSeasons),
    stats: nextId(mockStats),
    teams: nextId(mockTeams),
    users: nextId(mockUsers),
  } satisfies IdCounters,
};

export function getAuthUser() {
  return clone(mockAuthUser);
}

export function bumpId(key: keyof IdCounters): number {
  const id = db.ids[key];
  db.ids[key] += 1;
  return id;
}
