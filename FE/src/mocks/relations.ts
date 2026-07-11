import { db } from "./db";
import type { Award, Player, Season, Team } from "../types/interfaces";

export function getPlayerById(id: number): Player | undefined {
  return db.players.find((player) => player.id === id);
}

export function getPlayersWithRelations(): Player[] {
  return db.players.map((player) => ({
    ...player,
    teams: db.teams.filter((team) => team.players?.some((p) => p.id === player.id)),
    stats: db.stats.filter((stat) => stat.playerId === player.id),
  }));
}

export function getPlayerDetail(id: number): Player | undefined {
  const player = getPlayerById(id);
  if (!player) return undefined;

  return {
    ...player,
    teams: db.teams.filter((team) => team.players?.some((p) => p.id === player.id)),
    stats: db.stats.filter((stat) => stat.playerId === player.id),
  };
}

export function getSeasonDetail(id: number): Season | undefined {
  const season = db.seasons.find((s) => s.id === id);
  if (!season) return undefined;

  return {
    ...season,
    teams: db.teams
      .filter((team) => team.season.id === id)
      .map((team) => enrichTeam(team)),
    games: db.games.filter((game) => game.season.id === id),
  };
}

export function enrichTeam(team: Team): Team {
  const games = db.games.filter((game) =>
    game.teams?.some((t) => t.id === team.id)
  );

  return {
    ...team,
    players: team.players ?? [],
    games,
  };
}

export function getTeamsByName(name: string): Team[] {
  return db.teams
    .filter((team) => team.name === name)
    .map((team) => enrichTeam(team));
}

export function getAwardsForPlayer(playerId: number): Award[] {
  return db.awards.filter((award) =>
    award.players.some((player) => player.id === playerId)
  );
}

export function getTriviaPlayer() {
  const player = db.players[0];
  return {
    ...player,
    teams: db.teams.slice(0, 2),
    awards: getAwardsForPlayer(player.id).slice(0, 3),
    stats: db.stats.filter((stat) => stat.playerId === player.id).slice(0, 8),
    records: db.records.filter((record) => record.player.id === player.id).slice(0, 4),
    difficulty: "easy" as const,
    hintCount: 3,
  };
}

export function getTriviaTeam() {
  const team = enrichTeam(db.teams[0]);
  return {
    ...team,
    players: team.players ?? [],
    games: team.games ?? [],
    difficulty: "medium" as const,
    hintCount: 3,
  };
}

export function getTriviaSeason() {
  const season = getSeasonDetail(db.seasons[0].id)!;
  return {
    ...season,
    startDate: new Date(season.startDate).toISOString().slice(0, 10),
    endDate: season.endDate
      ? new Date(season.endDate).toISOString().slice(0, 10)
      : undefined,
    teams: season.teams?.slice(0, 4) ?? [],
    games: season.games?.slice(0, 6) ?? [],
    awards: db.awards.filter((award) => award.season.id === season.id),
    records: db.records.filter((record) => record.season.id === season.id),
    difficulty: "easy" as const,
    hintCount: 3,
  };
}
