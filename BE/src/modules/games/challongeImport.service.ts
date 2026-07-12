import { AppDataSource } from '../../db/data-source.js';
import { Games, GameStatus, GamePhase } from './game.entity.js';
import { resolveWinnerTeamId } from './gameWinner.js';
import { Teams } from '../teams/team.entity.js';
import { Seasons } from '../seasons/season.entity.js';
import { mapChallongeToStage, parseRegionFromTournamentName } from './challongeStageMapper.js';
import { inferBracketFromChallonge } from './gameBracket.js';
import type { ImportChallongeInput } from './games.schema.js';
import { RegionCode } from '../regions/region.entity.js';

interface ChallongeMatch {
    id: number;
    number: number;
    round: number;
    state: string;
    player1_id: number | null;
    player2_id: number | null;
    player1_name?: string | null;
    player2_name?: string | null;
    scores_csv: string;
    group_id?: number | null;
    identifier?: string | null;
}

interface ChallongeParticipant {
    id: number;
    name: string;
    username?: string;
    display_name?: string;
}

interface ChallongeTournament {
    id: number;
    name: string;
    tournament_type: string;
    participants_count?: number;
}

export interface ChallongeImportValidationError {
    challongeMatchId: number;
    participantName: string;
    reason: string;
}

export interface ChallongeImportResult {
    success: boolean;
    summary: {
        created: number;
        updated: number;
        skipped: number;
        failed: number;
    };
    details?: {
        created: Array<{ gameId: number; stage: string; team1: string; team2: string }>;
        updated: Array<{ gameId: number; challongeMatchId: string; changedFields: string[] }>;
        skipped: Array<{ challongeMatchId: string; reason: string }>;
    };
    error?: string;
    unmatchedTeams?: ChallongeImportValidationError[];
}

interface PreparedGame {
    action: 'create' | 'update' | 'skip';
    existingGameId?: number;
    changedFields?: string[];
    challongeMatchId: string;
    stage: string;
    team1Name: string;
    team2Name: string;
    team1Id: number;
    team2Id: number;
    data: Partial<Games>;
}

export class ChallongeImportService {
    async importFromChallonge(input: ImportChallongeInput, dryRun = false): Promise<ChallongeImportResult> {
        const tournamentId = this.extractTournamentId(input.challongeUrl);
        if (!tournamentId) {
            return this.failureResult('Invalid Challonge URL');
        }

        const tournament = await this.fetchChallongeTournament(tournamentId);
        const matchesData = await this.fetchChallongeMatches(tournamentId);
        const participants = await this.fetchChallongeParticipants(tournamentId);

        const season = await AppDataSource.getRepository(Seasons).findOne({
            where: { id: input.seasonId },
            relations: ['region'],
        });
        if (!season) {
            return this.failureResult(`Season with ID ${input.seasonId} not found`);
        }

        if (input.region && season.region?.code && season.region.code !== input.region) {
            return this.failureResult(
                `Season ${input.seasonId} belongs to region "${season.region.code}", not "${input.region}"`
            );
        }

        const phase = (input.phase ?? 'qualifiers') as GamePhase;
        const regionCode = (input.region ?? parseRegionFromTournamentName(tournament.name) ?? 'na') as RegionCode;

        const eligibleMatches = matchesData.filter(m => {
            if (input.round && m.round.toString() !== input.round && `Round ${m.round}` !== input.round) {
                return false;
            }
            return m.player1_id && m.player2_id;
        });

        const unmatchedTeams: ChallongeImportValidationError[] = [];
        const teamCache = new Map<string, Teams>();

        for (const match of eligibleMatches) {
            const { team1Name, team2Name } = this.resolveParticipantNames(match, participants);

            for (const name of [team1Name, team2Name]) {
                const cacheKey = `${input.seasonId}:${name.toLowerCase()}`;
                if (teamCache.has(cacheKey)) continue;

                const team = await this.findTeamInSeason(name, input.seasonId);
                if (team) {
                    teamCache.set(cacheKey, team);
                } else {
                    unmatchedTeams.push({
                        challongeMatchId: match.id,
                        participantName: name,
                        reason: `No team "${name}" found in season ${input.seasonId}. Create the team before importing.`,
                    });
                }
            }
        }

        if (unmatchedTeams.length > 0) {
            const uniqueErrors = this.deduplicateErrors(unmatchedTeams);
            return {
                success: false,
                error: `Import aborted: ${uniqueErrors.length} team(s) could not be matched`,
                summary: { created: 0, updated: 0, skipped: 0, failed: uniqueErrors.length },
                unmatchedTeams: uniqueErrors,
            };
        }

        let matchCounter = 0;
        const prepared: PreparedGame[] = [];

        for (const challongeMatch of eligibleMatches) {
            const { team1Name, team2Name } = this.resolveParticipantNames(challongeMatch, participants);
            const team1 = teamCache.get(`${input.seasonId}:${team1Name.toLowerCase()}`)!;
            const team2 = teamCache.get(`${input.seasonId}:${team2Name.toLowerCase()}`)!;

            const setScores = this.parseChallongeSetScores(challongeMatch.scores_csv);
            const overallScore = this.calculateOverallScoreFromSetScores(setScores);
            const stage = mapChallongeToStage({
                tournamentType: tournament.tournament_type,
                tournamentName: tournament.name,
                round: challongeMatch.round,
                groupId: challongeMatch.group_id,
                identifier: challongeMatch.identifier,
                phase,
                region: regionCode,
            });

            const bracket = inferBracketFromChallonge({
                round: challongeMatch.round,
                tournamentType: tournament.tournament_type,
                identifier: challongeMatch.identifier,
                phase,
                stage,
            });

            const matchDate = this.calculateMatchDate(
                challongeMatch.state === 'complete',
                input.roundStartDate,
                input.roundEndDate,
                matchCounter,
                input.matchSpacingMinutes ?? 30,
                challongeMatch.round
            );

            const gameData: Partial<Games> = {
                status: challongeMatch.state === 'complete' ? GameStatus.COMPLETED : GameStatus.SCHEDULED,
                phase,
                regionId: season.regionId,
                stage,
                bracket,
                date: matchDate,
                team1Score: overallScore.team1Sets || null,
                team2Score: overallScore.team2Sets || null,
                set1Score: setScores[0] ?? null,
                set2Score: setScores[1] ?? null,
                set3Score: setScores[2] ?? null,
                set4Score: setScores[3] ?? null,
                set5Score: setScores[4] ?? null,
                challongeMatchId: challongeMatch.id.toString(),
                challongeTournamentId: tournamentId,
                challongeRound: challongeMatch.round,
                tags: input.tags ?? [],
                name: `${team1Name} vs ${team2Name}`,
                winnerTeamId: resolveWinnerTeamId(
                    overallScore.team1Sets || null,
                    overallScore.team2Sets || null,
                    team1.id,
                    team2.id
                ),
            };

            const existingByChallonge = await AppDataSource.getRepository(Games).findOne({
                where: {
                    challongeMatchId: challongeMatch.id.toString(),
                    season: { id: input.seasonId },
                },
                relations: ['teams'],
            });

            if (existingByChallonge) {
                const existingTeamIds = existingByChallonge.teams.map(t => t.id).sort();
                const newTeamIds = [team1.id, team2.id].sort();
                if (existingTeamIds[0] !== newTeamIds[0] || existingTeamIds[1] !== newTeamIds[1]) {
                    return this.failureResult(
                        `Challonge match ${challongeMatch.id} maps to different teams than existing game #${existingByChallonge.id}`
                    );
                }

                const changedFields = this.getChangedFields(existingByChallonge, gameData);
                if (changedFields.length === 0) {
                    prepared.push({
                        action: 'skip',
                        challongeMatchId: challongeMatch.id.toString(),
                        stage,
                        team1Name,
                        team2Name,
                        team1Id: team1.id,
                        team2Id: team2.id,
                        data: gameData,
                    });
                } else {
                    prepared.push({
                        action: 'update',
                        existingGameId: existingByChallonge.id,
                        changedFields,
                        challongeMatchId: challongeMatch.id.toString(),
                        stage,
                        team1Name,
                        team2Name,
                        team1Id: team1.id,
                        team2Id: team2.id,
                        data: gameData,
                    });
                }
            } else {
                prepared.push({
                    action: 'create',
                    challongeMatchId: challongeMatch.id.toString(),
                    stage,
                    team1Name,
                    team2Name,
                    team1Id: team1.id,
                    team2Id: team2.id,
                    data: gameData,
                });
            }

            matchCounter++;
        }

        if (dryRun) {
            return {
                success: true,
                summary: {
                    created: prepared.filter(p => p.action === 'create').length,
                    updated: prepared.filter(p => p.action === 'update').length,
                    skipped: prepared.filter(p => p.action === 'skip').length,
                    failed: 0,
                },
                details: {
                    created: prepared.filter(p => p.action === 'create').map(p => ({
                        gameId: 0,
                        stage: p.stage,
                        team1: p.team1Name,
                        team2: p.team2Name,
                    })),
                    updated: prepared.filter(p => p.action === 'update').map(p => ({
                        gameId: p.existingGameId!,
                        challongeMatchId: p.challongeMatchId,
                        changedFields: p.changedFields ?? [],
                    })),
                    skipped: prepared.filter(p => p.action === 'skip').map(p => ({
                        challongeMatchId: p.challongeMatchId,
                        reason: 'identical to existing game',
                    })),
                },
            };
        }

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        const result: ChallongeImportResult = {
            success: true,
            summary: { created: 0, updated: 0, skipped: 0, failed: 0 },
            details: { created: [], updated: [], skipped: [] },
        };

        try {
            for (const item of prepared) {
                if (item.action === 'skip') {
                    result.summary.skipped++;
                    result.details!.skipped.push({
                        challongeMatchId: item.challongeMatchId,
                        reason: 'identical to existing game',
                    });
                    continue;
                }

                if (item.action === 'update' && item.existingGameId) {
                    await queryRunner.manager.update(Games, item.existingGameId, item.data);
                    result.summary.updated++;
                    result.details!.updated.push({
                        gameId: item.existingGameId,
                        challongeMatchId: item.challongeMatchId,
                        changedFields: item.changedFields ?? [],
                    });
                    continue;
                }

                const game = queryRunner.manager.create(Games, {
                    ...item.data,
                    season,
                    teams: [teamCache.get(`${input.seasonId}:${item.team1Name.toLowerCase()}`)!, teamCache.get(`${input.seasonId}:${item.team2Name.toLowerCase()}`)!],
                });
                const saved = await queryRunner.manager.save(game);
                result.summary.created++;
                result.details!.created.push({
                    gameId: saved.id,
                    stage: item.stage,
                    team1: item.team1Name,
                    team2: item.team2Name,
                });
            }

            await queryRunner.commitTransaction();
            console.log('Challonge import completed:', result.summary);
            return result;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('Challonge import failed, rolled back:', error);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private failureResult(message: string): ChallongeImportResult {
        return {
            success: false,
            error: message,
            summary: { created: 0, updated: 0, skipped: 0, failed: 1 },
        };
    }

    private deduplicateErrors(errors: ChallongeImportValidationError[]): ChallongeImportValidationError[] {
        const seen = new Set<string>();
        return errors.filter(e => {
            const key = e.participantName.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    private async findTeamInSeason(teamName: string, seasonId: number): Promise<Teams | null> {
        return AppDataSource.getRepository(Teams)
            .createQueryBuilder('team')
            .innerJoin('team.season', 'season')
            .where('LOWER(team.name) = LOWER(:teamName)', { teamName })
            .andWhere('season.id = :seasonId', { seasonId })
            .getOne();
    }

    private resolveParticipantNames(match: ChallongeMatch, participants: ChallongeParticipant[]) {
        let player1Name = match.player1_name ?? undefined;
        let player2Name = match.player2_name ?? undefined;

        const player1Participant = participants.find(p => p.id === match.player1_id);
        const player2Participant = participants.find(p => p.id === match.player2_id);

        if (player1Participant) {
            player1Name = player1Participant.name || player1Participant.display_name || player1Participant.username;
        }
        if (player2Participant) {
            player2Name = player2Participant.name || player2Participant.display_name || player2Participant.username;
        }

        return {
            team1Name: player1Name ?? `Player ${match.player1_id}`,
            team2Name: player2Name ?? `Player ${match.player2_id}`,
        };
    }

    private getChangedFields(existing: Games, incoming: Partial<Games>): string[] {
        const fields: string[] = [];
        const compare: Array<keyof Games> = [
            'status', 'team1Score', 'team2Score', 'stage', 'phase', 'regionId', 'bracket',
            'winnerTeamId',
            'set1Score', 'set2Score', 'set3Score', 'set4Score', 'set5Score', 'date',
        ];

        for (const field of compare) {
            const existingVal = existing[field];
            const incomingVal = incoming[field];
            if (incomingVal === undefined) continue;

            if (field === 'date') {
                const existingTime = existingVal ? new Date(existingVal as Date).getTime() : null;
                const incomingTime = incomingVal ? new Date(incomingVal as Date).getTime() : null;
                if (existingTime !== incomingTime) fields.push(field);
                continue;
            }

            if (existingVal !== incomingVal) {
                fields.push(field);
            }
        }

        return fields;
    }

    private calculateOverallScoreFromSetScores(setScores: string[]) {
        let team1Sets = 0;
        let team2Sets = 0;

        setScores.forEach(setScore => {
            if (!setScore?.trim()) return;
            const scores = setScore.split('-');
            if (scores.length !== 2) return;
            const t1 = parseInt(scores[0].trim(), 10);
            const t2 = parseInt(scores[1].trim(), 10);
            if (isNaN(t1) || isNaN(t2)) return;
            if (t1 > t2) team1Sets++;
            else if (t2 > t1) team2Sets++;
        });

        return { team1Sets, team2Sets };
    }

    private parseChallongeSetScores(scoresCsv: string) {
        if (!scoresCsv?.trim()) return [];
        return scoresCsv.split(',').map(s => s.trim()).filter(Boolean);
    }

    private extractTournamentId(url: string): string | null {
        if (!url.includes('challonge.com')) return url;
        const match = url.match(/challonge\.com\/(?:[^\/]+\/)?([^\/\?]+)/);
        return match ? match[1] : null;
    }

    private async fetchChallongeTournament(tournamentId: string): Promise<ChallongeTournament> {
        const apiKey = process.env.CHALLONGE_API_KEY;
        if (!apiKey) throw new Error('CHALLONGE_API_KEY not found in environment');

        const response = await fetch(
            `https://api.challonge.com/v1/tournaments/${tournamentId}.json?api_key=${apiKey}`
        );
        if (!response.ok) {
            throw new Error(`Challonge API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data.tournament;
    }

    private async fetchChallongeMatches(tournamentId: string): Promise<ChallongeMatch[]> {
        const apiKey = process.env.CHALLONGE_API_KEY;
        if (!apiKey) throw new Error('CHALLONGE_API_KEY not found in environment');

        const response = await fetch(
            `https://api.challonge.com/v1/tournaments/${tournamentId}/matches.json?api_key=${apiKey}`
        );
        if (!response.ok) {
            throw new Error(`Challonge API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data.map((entry: any) => ({
            id: entry.match.id,
            number: entry.match.match_number,
            round: entry.match.round,
            state: entry.match.state,
            player1_name: entry.match.player1_name,
            player2_name: entry.match.player2_name,
            player1_id: entry.match.player1_id,
            player2_id: entry.match.player2_id,
            scores_csv: entry.match.scores_csv ?? '',
            group_id: entry.match.group_id,
            identifier: entry.match.identifier,
        }));
    }

    private async fetchChallongeParticipants(tournamentId: string): Promise<ChallongeParticipant[]> {
        const apiKey = process.env.CHALLONGE_API_KEY;
        if (!apiKey) throw new Error('CHALLONGE_API_KEY not found in environment');

        const response = await fetch(
            `https://api.challonge.com/v1/tournaments/${tournamentId}/participants.json?api_key=${apiKey}`
        );
        if (!response.ok) {
            throw new Error(`Challonge API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data.map((entry: any) => ({
            id: entry.participant.id,
            name: entry.participant.name,
            username: entry.participant.username,
            display_name: entry.participant.display_name,
        }));
    }

    private calculateMatchDate(
        isCompleted: boolean,
        roundStartDate: Date,
        roundEndDate: Date,
        matchIndex: number,
        spacingMinutes: number,
        roundNumber: number
    ): Date {
        const weekendDays = [5, 6, 0];
        const roundWeekOffset = (roundNumber - 1) * 7;
        const baseDate = new Date(roundStartDate);
        baseDate.setDate(baseDate.getDate() + roundWeekOffset);

        let weekendDate = new Date(baseDate);
        while (!weekendDays.includes(weekendDate.getDay())) {
            weekendDate.setDate(weekendDate.getDate() + 1);
        }

        const totalMatchesInRound = matchIndex + 1;
        const baseMatchesPerDay = Math.floor(totalMatchesInRound / 3) || 1;
        let dayOfWeekend: number;
        let matchNumberOnDay: number;

        if (matchIndex < baseMatchesPerDay * 3) {
            dayOfWeekend = Math.floor(matchIndex / baseMatchesPerDay);
            matchNumberOnDay = matchIndex % baseMatchesPerDay;
        } else {
            dayOfWeekend = matchIndex - baseMatchesPerDay * 3;
            matchNumberOnDay = baseMatchesPerDay;
        }

        const matchDate = new Date(weekendDate);
        matchDate.setDate(matchDate.getDate() + dayOfWeekend);

        if (isCompleted) return matchDate;

        const spacingMs = spacingMinutes * 60 * 1000;
        const startOffset = 30 * 60 * 1000;
        const timeOffset = startOffset + matchNumberOnDay * spacingMs;
        const maxOffset = Math.min(
            roundEndDate.getTime() - matchDate.getTime() - 60 * 60 * 1000,
            24 * 60 * 60 * 1000
        );
        return new Date(matchDate.getTime() + Math.min(timeOffset, maxOffset));
    }
}
