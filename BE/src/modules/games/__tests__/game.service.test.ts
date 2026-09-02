import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ILike } from 'typeorm';
import { GameService } from '../game.service.js';
import { GameStatus, GamePhase, GameBracket } from '../game.entity.js';
import { GameStaffRole } from '../game-staff.entity.js';
import { MissingFieldError } from '../../../errors/MissingFieldError.js';
import { NotFoundError } from '../../../errors/NotFoundError.js';
import { ConflictError } from '../../../errors/ConflictError.js';
import { InvalidFormatError } from '../../../errors/InvalidFormatError.js';

const mockGameRepository = {
    find: jest.fn(),
    findBy: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
};

const mockTeamRepository = {
    findBy: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
};

const mockSeasonRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
};

const mockStaffRepository = {
    find: jest.fn(),
    findBy: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
};

const mockUserRepository = {
    findBy: jest.fn(),
    findOne: jest.fn(),
};

const mockStageQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
};

const DATE = new Date('2025-01-01T00:00:00Z');
const SEASON = { id: 1, seasonNumber: 5, regionId: 2 } as any;
const TEAM_ONE = { id: 1, name: 'Team One' } as any;
const TEAM_TWO = { id: 2, name: 'Team Two' } as any;

function game(overrides: Record<string, unknown> = {}) {
    return {
        id: 1,
        date: DATE,
        season: SEASON,
        teams: [TEAM_ONE, TEAM_TWO],
        team1Score: 3,
        team2Score: 1,
        stage: 'Finals',
        status: GameStatus.COMPLETED,
        phase: GamePhase.PLAYOFFS,
        stats: [],
        challongeRound: null,
        ...overrides,
    } as any;
}

describe('GameService', () => {
    let gameService: GameService;

    beforeEach(() => {
        jest.clearAllMocks();
        mockGameRepository.save.mockImplementation(async (entity: any) => entity);
        mockStageQueryBuilder.select.mockReturnThis();
        mockStageQueryBuilder.where.mockReturnThis();
        mockStageQueryBuilder.andWhere.mockReturnThis();
        mockStageQueryBuilder.orderBy.mockReturnThis();
        mockGameRepository.createQueryBuilder.mockReturnValue(mockStageQueryBuilder);

        gameService = new GameService();
        (gameService as any).gameRepository = mockGameRepository;
        (gameService as any).teamRepository = mockTeamRepository;
        (gameService as any).seasonRepository = mockSeasonRepository;
        (gameService as any).staffRepository = mockStaffRepository;
        (gameService as any).userRepository = mockUserRepository;

        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe('createGame', () => {
        it('throws MissingFieldError without a season id', async () => {
            await expect(gameService.createGame(DATE, 0, [1, 2], 3, 1, 'Finals')).rejects.toThrow(MissingFieldError);
        });

        it('throws MissingFieldError without a stage', async () => {
            await expect(gameService.createGame(DATE, 1, [1, 2], 3, 1, '')).rejects.toThrow(MissingFieldError);
        });

        it('throws MissingFieldError without team ids', async () => {
            await expect(gameService.createGame(DATE, 1, [], 3, 1, 'Finals')).rejects.toThrow(MissingFieldError);
        });

        it('rejects a negative score', async () => {
            await expect(gameService.createGame(DATE, 1, [1, 2], -1, 1, 'Finals')).rejects.toThrow(InvalidFormatError);
        });

        it('throws NotFoundError when the season does not exist', async () => {
            mockSeasonRepository.findOneBy.mockResolvedValueOnce(null as never);

            await expect(gameService.createGame(DATE, 99, [1, 2], 3, 1, 'Finals')).rejects.toThrow(NotFoundError);
        });

        it('names the teams it could not find', async () => {
            mockSeasonRepository.findOneBy.mockResolvedValueOnce(SEASON as never);
            mockTeamRepository.findBy.mockResolvedValueOnce([TEAM_ONE] as never);

            await expect(gameService.createGame(DATE, 1, [1, 2], 3, 1, 'Finals')).rejects.toThrow(
                'Teams with IDs 2 not found'
            );
        });

        it('requires at least two teams', async () => {
            mockSeasonRepository.findOneBy.mockResolvedValueOnce(SEASON as never);
            mockTeamRepository.findBy.mockResolvedValueOnce([TEAM_ONE] as never);

            await expect(gameService.createGame(DATE, 1, [1], 3, 1, 'Finals')).rejects.toThrow(
                'At least two teams are required'
            );
        });

        it('orders the teams the way the caller listed them, not the way the DB returned them', async () => {
            mockSeasonRepository.findOneBy.mockResolvedValueOnce(SEASON as never);
            mockTeamRepository.findBy.mockResolvedValueOnce([TEAM_TWO, TEAM_ONE] as never);

            const created = await gameService.createGame(DATE, 1, [1, 2], 3, 1, 'Finals');

            expect(created.teams.map(t => t.id)).toEqual([1, 2]);
        });

        it('inherits the region from the season', async () => {
            mockSeasonRepository.findOneBy.mockResolvedValueOnce(SEASON as never);
            mockTeamRepository.findBy.mockResolvedValueOnce([TEAM_ONE, TEAM_TWO] as never);

            const created = await gameService.createGame(DATE, 1, [1, 2], 3, 1, 'Finals');

            expect(created.regionId).toBe(2);
        });

        it('marks a game with both scores as completed', async () => {
            mockSeasonRepository.findOneBy.mockResolvedValueOnce(SEASON as never);
            mockTeamRepository.findBy.mockResolvedValueOnce([TEAM_ONE, TEAM_TWO] as never);

            const created = await gameService.createGame(DATE, 1, [1, 2], 3, 1, 'Finals');

            expect(created.status).toBe(GameStatus.COMPLETED);
        });

        it('marks a game with no scores as scheduled', async () => {
            mockSeasonRepository.findOneBy.mockResolvedValueOnce(SEASON as never);
            mockTeamRepository.findBy.mockResolvedValueOnce([TEAM_ONE, TEAM_TWO] as never);

            const created = await gameService.createGame(DATE, 1, [1, 2], null, null, 'Finals');

            expect(created.status).toBe(GameStatus.SCHEDULED);
        });

        it('honours an explicit status over the score-derived one', async () => {
            mockSeasonRepository.findOneBy.mockResolvedValueOnce(SEASON as never);
            mockTeamRepository.findBy.mockResolvedValueOnce([TEAM_ONE, TEAM_TWO] as never);

            const created = await gameService.createGame(DATE, 1, [1, 2], 3, 1, 'Finals', undefined, {
                status: GameStatus.SCHEDULED,
            });

            expect(created.status).toBe(GameStatus.SCHEDULED);
        });

        it('defaults the phase to qualifiers', async () => {
            mockSeasonRepository.findOneBy.mockResolvedValueOnce(SEASON as never);
            mockTeamRepository.findBy.mockResolvedValueOnce([TEAM_ONE, TEAM_TWO] as never);

            const created = await gameService.createGame(DATE, 1, [1, 2], 3, 1, 'Finals');

            expect(created.phase).toBe(GamePhase.QUALIFIERS);
        });

        it('records the winner as the higher-scoring team', async () => {
            mockSeasonRepository.findOneBy.mockResolvedValueOnce(SEASON as never);
            mockTeamRepository.findBy.mockResolvedValueOnce([TEAM_ONE, TEAM_TWO] as never);

            const created = await gameService.createGame(DATE, 1, [1, 2], 1, 3, 'Finals');

            expect(created.winnerTeamId).toBe(2);
        });

        it('leaves the winner unset for a game with no scores', async () => {
            mockSeasonRepository.findOneBy.mockResolvedValueOnce(SEASON as never);
            mockTeamRepository.findBy.mockResolvedValueOnce([TEAM_ONE, TEAM_TWO] as never);

            const created = await gameService.createGame(DATE, 1, [1, 2], null, null, 'Finals');

            expect(created.winnerTeamId).toBeNull();
        });

        it('spreads set scores across the five set columns', async () => {
            mockSeasonRepository.findOneBy.mockResolvedValueOnce(SEASON as never);
            mockTeamRepository.findBy.mockResolvedValueOnce([TEAM_ONE, TEAM_TWO] as never);

            const created = await gameService.createGame(DATE, 1, [1, 2], 2, 1, 'Finals', undefined, {
                setScores: ['25-20', '20-25', '15-10'],
            });

            expect(created.set1Score).toBe('25-20');
            expect(created.set3Score).toBe('15-10');
            expect(created.set4Score).toBeNull();
        });

        it('defaults an absent video url to an empty string', async () => {
            mockSeasonRepository.findOneBy.mockResolvedValueOnce(SEASON as never);
            mockTeamRepository.findBy.mockResolvedValueOnce([TEAM_ONE, TEAM_TWO] as never);

            const created = await gameService.createGame(DATE, 1, [1, 2], 3, 1, 'Finals');

            expect(created.videoUrl).toBe('');
        });

        it('infers the losers bracket from a playoff stage name', async () => {
            mockSeasonRepository.findOneBy.mockResolvedValueOnce(SEASON as never);
            mockTeamRepository.findBy.mockResolvedValueOnce([TEAM_ONE, TEAM_TWO] as never);

            const created = await gameService.createGame(DATE, 1, [1, 2], 3, 1, 'Losers Bracket Round 2', undefined, {
                phase: GamePhase.PLAYOFFS,
            });

            expect(created.bracket).toBe(GameBracket.LOSERS);
        });
    });

    describe('getAllGames', () => {
        const pagination = { page: 1, limit: 10, skip: 0, take: 10 };

        it('turns a search filter into a case-insensitive name match', async () => {
            mockGameRepository.findAndCount.mockResolvedValueOnce([[], 0] as never);

            await gameService.getAllGames(pagination, { search: 'final' });

            expect(mockGameRepository.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ where: { name: ILike('%final%') } })
            );
        });

        it('applies every scalar filter it is given', async () => {
            mockGameRepository.findAndCount.mockResolvedValueOnce([[], 0] as never);

            await gameService.getAllGames(pagination, {
                seasonId: 1,
                stage: 'Finals',
                status: 'completed',
                phase: 'playoffs',
                regionId: 2,
                bracket: 'winners',
            });

            expect(mockGameRepository.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        stage: 'Finals',
                        status: 'completed',
                        phase: 'playoffs',
                        regionId: 2,
                        bracket: 'winners',
                    }),
                })
            );
        });

        it('defaults to newest first', async () => {
            mockGameRepository.findAndCount.mockResolvedValueOnce([[], 0] as never);

            await gameService.getAllGames(pagination);

            expect(mockGameRepository.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ order: { date: 'DESC' } })
            );
        });

        it('honours an explicit sort', async () => {
            mockGameRepository.findAndCount.mockResolvedValueOnce([[], 0] as never);

            await gameService.getAllGames(pagination, {}, { sortBy: 'stage', sortDir: 'ASC' });

            expect(mockGameRepository.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ order: { stage: 'ASC' } })
            );
        });
    });

    describe('getDistinctStages', () => {
        it('returns the bare stage labels', async () => {
            mockStageQueryBuilder.getRawMany.mockResolvedValueOnce([{ stage: 'Finals' }, { stage: 'Semis' }] as never);

            await expect(gameService.getDistinctStages()).resolves.toEqual(['Finals', 'Semis']);
        });

        it('narrows by season and region when asked', async () => {
            mockStageQueryBuilder.getRawMany.mockResolvedValueOnce([] as never);

            await gameService.getDistinctStages({ seasonId: 1, regionId: 2 });

            expect(mockStageQueryBuilder.andWhere).toHaveBeenCalledWith('game.seasonId = :seasonId', { seasonId: 1 });
            expect(mockStageQueryBuilder.andWhere).toHaveBeenCalledWith('game.regionId = :regionId', { regionId: 2 });
        });

        it('adds no filters when none are given', async () => {
            mockStageQueryBuilder.getRawMany.mockResolvedValueOnce([] as never);

            await gameService.getDistinctStages();

            expect(mockStageQueryBuilder.andWhere).not.toHaveBeenCalled();
        });
    });

    describe('getGameById', () => {
        it('throws MissingFieldError without an id', async () => {
            await expect(gameService.getGameById(0)).rejects.toThrow(MissingFieldError);
        });

        it('throws NotFoundError when the game does not exist', async () => {
            mockGameRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(gameService.getGameById(999)).rejects.toThrow('Game with ID 999 not found');
        });

        it('returns the game', async () => {
            const found = game();
            mockGameRepository.findOne.mockResolvedValueOnce(found as never);

            await expect(gameService.getGameById(1)).resolves.toBe(found);
        });

        it('loads staff and strips extra user fields', async () => {
            const found = game({
                staff: [{
                    role: 'referee',
                    user: { id: 9, username: 'refbot', robloxUsername: 'RefBot', email: 'secret@x.com', password: 'nope' },
                }],
            });
            mockGameRepository.findOne.mockResolvedValueOnce(found as never);

            const result = await gameService.getGameById(1);

            expect(result.staff[0].user).toEqual({
                id: 9,
                username: 'refbot',
                robloxUsername: 'RefBot',
            });
            expect(result.staff[0].user).not.toHaveProperty('email');
        });
    });

    describe('getScoreByGameId', () => {
        it('throws MissingFieldError without an id', async () => {
            await expect(gameService.getScoreByGameId(0)).rejects.toThrow(MissingFieldError);
        });

        it('throws NotFoundError when the game does not exist', async () => {
            mockGameRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(gameService.getScoreByGameId(999)).rejects.toThrow(NotFoundError);
        });

        it('formats the score as team1-team2', async () => {
            mockGameRepository.findOne.mockResolvedValueOnce(game({ team1Score: 3, team2Score: 2 }) as never);

            await expect(gameService.getScoreByGameId(1)).resolves.toBe('3-2');
        });
    });

    describe('updateGame', () => {
        it('throws MissingFieldError without an id', async () => {
            await expect(gameService.updateGame(0)).rejects.toThrow(MissingFieldError);
        });

        it('throws NotFoundError for an unknown game', async () => {
            mockGameRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(gameService.updateGame(999, DATE)).rejects.toThrow(NotFoundError);
        });

        it('rejects an unparseable date', async () => {
            mockGameRepository.findOne.mockResolvedValueOnce(game() as never);

            await expect(gameService.updateGame(1, new Date('not-a-date'))).rejects.toThrow(InvalidFormatError);
        });

        it('moves the game to another season and takes that season\'s region', async () => {
            mockGameRepository.findOne.mockResolvedValueOnce(game() as never);
            mockSeasonRepository.findOneBy.mockResolvedValueOnce({ id: 9, regionId: 4 } as never);

            const updated = await gameService.updateGame(1, undefined, 9);

            expect(updated.season).toMatchObject({ id: 9 });
            expect(updated.regionId).toBe(4);
        });

        it('throws NotFoundError for an unknown target season', async () => {
            mockGameRepository.findOne.mockResolvedValueOnce(game() as never);
            mockSeasonRepository.findOneBy.mockResolvedValueOnce(null as never);

            await expect(gameService.updateGame(1, undefined, 99)).rejects.toThrow(NotFoundError);
        });

        it('refuses to leave a game with a single team', async () => {
            mockGameRepository.findOne.mockResolvedValueOnce(game() as never);

            await expect(gameService.updateGame(1, undefined, undefined, [1])).rejects.toThrow(
                'At least two teams are required'
            );
        });

        it('names teams it could not resolve', async () => {
            mockGameRepository.findOne.mockResolvedValueOnce(game() as never);
            mockTeamRepository.findBy.mockResolvedValueOnce([TEAM_ONE] as never);

            await expect(gameService.updateGame(1, undefined, undefined, [1, 2])).rejects.toThrow(
                'Teams with IDs 2 not found'
            );
        });

        it('recomputes the winner when the scores are flipped', async () => {
            mockGameRepository.findOne.mockResolvedValueOnce(game({ team1Score: 3, team2Score: 1 }) as never);

            const updated = await gameService.updateGame(1, undefined, undefined, undefined, 1, 3);

            expect(updated.winnerTeamId).toBe(2);
        });

        it('clears the winner when a score is set back to null', async () => {
            mockGameRepository.findOne.mockResolvedValueOnce(game() as never);

            const updated = await gameService.updateGame(1, undefined, undefined, undefined, null, null);

            expect(updated.winnerTeamId).toBeNull();
        });

        it('leaves a score alone when it is not part of the update', async () => {
            mockGameRepository.findOne.mockResolvedValueOnce(game({ team1Score: 3, team2Score: 1 }) as never);

            const updated = await gameService.updateGame(1, undefined, undefined, undefined, undefined, undefined, 'Semis');

            expect(updated.team1Score).toBe(3);
            expect(updated.stage).toBe('Semis');
        });

        it('replaces the set scores wholesale when new ones are supplied', async () => {
            mockGameRepository.findOne.mockResolvedValueOnce(
                game({ set1Score: '25-1', set2Score: '25-2', set3Score: '25-3' }) as never
            );

            const updated = await gameService.updateGame(1, undefined, undefined, undefined, undefined, undefined, undefined, undefined, {
                setScores: ['20-25'],
            });

            expect(updated.set1Score).toBe('20-25');
            expect(updated.set2Score).toBeNull();
            expect(updated.set3Score).toBeNull();
        });

        it('lets an explicit bracket override the stage-inferred one', async () => {
            mockGameRepository.findOne.mockResolvedValueOnce(game({ stage: 'Losers Bracket R1' }) as never);

            const updated = await gameService.updateGame(1, undefined, undefined, undefined, undefined, undefined, undefined, undefined, {
                bracket: GameBracket.WINNERS,
            });

            expect(updated.bracket).toBe(GameBracket.WINNERS);
        });

        it('replaces match crew when staff is supplied', async () => {
            mockGameRepository.findOne.mockResolvedValueOnce(game() as never);
            mockUserRepository.findBy.mockResolvedValueOnce([{ id: 9, username: 'refbot' }] as never);
            mockStaffRepository.delete.mockResolvedValueOnce(undefined as never);
            mockStaffRepository.save.mockResolvedValueOnce([] as never);
            mockGameRepository.findOne.mockResolvedValueOnce(
                game({
                    staff: [{ role: 'referee', user: { id: 9, username: 'refbot', robloxUsername: null } }],
                }) as never
            );

            const updated = await gameService.updateGame(1, undefined, undefined, undefined, undefined, undefined, undefined, undefined, {
                staff: [{ userId: 9, role: GameStaffRole.REFEREE }],
            });

            expect(mockStaffRepository.delete).toHaveBeenCalledWith({ gameId: 1 });
            expect(mockStaffRepository.save).toHaveBeenCalled();
            expect(updated.staff[0].user.username).toBe('refbot');
        });

        it('rejects an unknown staff user', async () => {
            mockGameRepository.findOne.mockResolvedValueOnce(game() as never);
            mockUserRepository.findBy.mockResolvedValueOnce([] as never);

            await expect(
                gameService.updateGame(1, undefined, undefined, undefined, undefined, undefined, undefined, undefined, {
                    staff: [{ userId: 99, role: GameStaffRole.STREAMER }],
                })
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('deleteGame', () => {
        it('throws MissingFieldError without an id', async () => {
            await expect(gameService.deleteGame(0)).rejects.toThrow(MissingFieldError);
        });

        it('throws NotFoundError for an unknown game', async () => {
            mockGameRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(gameService.deleteGame(999)).rejects.toThrow(NotFoundError);
        });

        it('refuses to delete a game that already has stats recorded', async () => {
            mockGameRepository.findOne.mockResolvedValueOnce(game({ stats: [{ id: 1 }] }) as never);

            await expect(gameService.deleteGame(1)).rejects.toThrow(ConflictError);
            expect(mockGameRepository.remove).not.toHaveBeenCalled();
        });

        it('deletes a game with no stats', async () => {
            const existing = game({ stats: [] });
            mockGameRepository.findOne.mockResolvedValueOnce(existing as never);

            await gameService.deleteGame(1);

            expect(mockGameRepository.remove).toHaveBeenCalledWith(existing);
        });
    });

    describe('getGamesBySeasonId', () => {
        const pagination = { page: 1, limit: 10, skip: 0, take: 10 };

        it('throws MissingFieldError without a season id', async () => {
            await expect(gameService.getGamesBySeasonId(0, pagination)).rejects.toThrow(MissingFieldError);
        });

        it('throws NotFoundError when the season does not exist', async () => {
            mockSeasonRepository.findOneBy.mockResolvedValueOnce(null as never);

            await expect(gameService.getGamesBySeasonId(99, pagination)).rejects.toThrow(NotFoundError);
        });

        it('returns that season\'s games newest first', async () => {
            mockSeasonRepository.findOneBy.mockResolvedValueOnce(SEASON as never);
            mockGameRepository.findAndCount.mockResolvedValueOnce([[game()], 1] as never);

            const [games, total] = await gameService.getGamesBySeasonId(1, pagination);

            expect(games).toHaveLength(1);
            expect(total).toBe(1);
            expect(mockGameRepository.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ order: { date: 'DESC' } })
            );
        });
    });

    describe('getGamesByTeamId', () => {
        const pagination = { page: 1, limit: 10, skip: 0, take: 10 };

        it('throws MissingFieldError without a team id', async () => {
            await expect(gameService.getGamesByTeamId(0, pagination)).rejects.toThrow(MissingFieldError);
        });

        it('throws NotFoundError when the team does not exist', async () => {
            mockTeamRepository.findOneBy.mockResolvedValueOnce(null as never);

            await expect(gameService.getGamesByTeamId(99, pagination)).rejects.toThrow(NotFoundError);
        });

        it('matches games through the team relation', async () => {
            mockTeamRepository.findOneBy.mockResolvedValueOnce(TEAM_ONE as never);
            mockGameRepository.findAndCount.mockResolvedValueOnce([[], 0] as never);

            await gameService.getGamesByTeamId(1, pagination);

            expect(mockGameRepository.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ where: { teams: { id: 1 } } })
            );
        });
    });
});
