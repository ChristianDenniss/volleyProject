import type { Teams } from '../teams/team.entity.js';

export function resolveWinnerTeamId(
    team1Score: number | null | undefined,
    team2Score: number | null | undefined,
    team1Id: number | null | undefined,
    team2Id: number | null | undefined
): number | null {
    if (team1Score == null || team2Score == null) {
        return null;
    }

    if (team1Score === team2Score) {
        return null;
    }

    if (team1Id == null || team2Id == null) {
        return null;
    }

    return team1Score > team2Score ? team1Id : team2Id;
}

export function resolveWinnerTeam(
    team1Score: number | null | undefined,
    team2Score: number | null | undefined,
    teams: Teams[] | undefined
): Teams | null {
    const team1 = teams?.[0];
    const team2 = teams?.[1];

    const winnerId = resolveWinnerTeamId(
        team1Score,
        team2Score,
        team1?.id,
        team2?.id
    );

    if (winnerId == null) {
        return null;
    }

    return winnerId === team1?.id ? team1 : team2 ?? null;
}

export function applyWinnerToGame(game: {
    team1Score: number | null;
    team2Score: number | null;
    teams?: Teams[];
    winner?: Teams | null;
    winnerTeamId?: number | null;
}): void {
    const winner = resolveWinnerTeam(game.team1Score, game.team2Score, game.teams);
    game.winner = winner;
    game.winnerTeamId = winner?.id ?? null;
}

export function orderTeamsByIds(teamIds: number[], teams: Teams[]): Teams[] {
    const teamMap = new Map(teams.map(team => [team.id, team]));

    return teamIds.map(teamId => {
        const team = teamMap.get(teamId);
        if (!team) {
            throw new Error(`Team with ID ${teamId} not found`);
        }

        return team;
    });
}
