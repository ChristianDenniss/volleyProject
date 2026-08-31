import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ILike } from 'typeorm';
import { PlayerService } from '../player.service.js';
import { AppDataSource } from '../../../db/data-source.js';
import { MissingFieldError } from '../../../errors/MissingFieldError.js';
import { NotFoundError } from '../../../errors/NotFoundError.js';

const mockPlayerRepository = {
    find: jest.fn(),
    findBy: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
};

const mockTeamRepository = {
    find: jest.fn(),
    findBy: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
};

const mockSeasonRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
};

// createMultiplePlayers / mergePlayers drive their own transaction, so these tests supply a
// query runner richer than the shared one in jest.setup.ts (repositories, raw query, delete).
const mockManagerQueryBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn(),
};

const mockTxPlayerRepository = { find: jest.fn(), save: jest.fn() };
const mockTxTeamRepository = { findBy: jest.fn() };

const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
        getRepository: jest.fn(),
        createQueryBuilder: jest.fn(() => mockManagerQueryBuilder),
        query: jest.fn(),
        delete: jest.fn(),
    },
};

function player(overrides: Record<string, unknown> = {}) {
    return { id: 1, name: 'john doe', position: 'Setter', teams: [], stats: [], ...overrides } as any;
}

describe('PlayerService', () => {
    let playerService: PlayerService;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPlayerRepository.save.mockImplementation(async (entity: any) => entity);
        mockTxPlayerRepository.save.mockImplementation(async (entity: any) => entity);
        mockManagerQueryBuilder.update.mockReturnThis();
        mockManagerQueryBuilder.set.mockReturnThis();
        mockManagerQueryBuilder.where.mockReturnThis();
        mockQueryRunner.manager.getRepository.mockImplementation((entity: any) =>
            entity?.name === 'Teams' ? mockTxTeamRepository : mockTxPlayerRepository
        );
        mockQueryRunner.manager.createQueryBuilder.mockReturnValue(mockManagerQueryBuilder);
        (AppDataSource.createQueryRunner as jest.Mock).mockReturnValue(mockQueryRunner);

        playerService = new PlayerService();
        (playerService as any).playerRepository = mockPlayerRepository;
        (playerService as any).teamRepository = mockTeamRepository;
        (playerService as any).seasonRepository = mockSeasonRepository;
        (playerService as any).invalidateEntityCache = jest.fn().mockResolvedValue(undefined);
    });

    describe('createPlayer', () => {
        it('throws MissingFieldError without a name', async () => {
            await expect(playerService.createPlayer('', 'Setter', 1)).rejects.toThrow(MissingFieldError);
        });

        it('throws MissingFieldError without a position', async () => {
            await expect(playerService.createPlayer('John', '', 1)).rejects.toThrow(MissingFieldError);
        });

        it('throws MissingFieldError without a team id', async () => {
            await expect(playerService.createPlayer('John', 'Setter', 0)).rejects.toThrow(MissingFieldError);
        });

        it('throws NotFoundError when the team does not exist', async () => {
            mockTeamRepository.findOneBy.mockResolvedValueOnce(null as never);

            await expect(playerService.createPlayer('John', 'Setter', 99)).rejects.toThrow(NotFoundError);
        });

        it('stores the name lowercased so lookups stay case-insensitive', async () => {
            mockTeamRepository.findOneBy.mockResolvedValueOnce({ id: 1 } as never);

            const created = await playerService.createPlayer('JoHn DoE', 'Setter', 1);

            expect(created.name).toBe('john doe');
        });

        it('associates the player with the team', async () => {
            const team = { id: 1 };
            mockTeamRepository.findOneBy.mockResolvedValueOnce(team as never);

            const created = await playerService.createPlayer('John', 'Setter', 1);

            expect(created.teams).toEqual([team]);
        });

        it('invalidates the player caches after creating', async () => {
            mockTeamRepository.findOneBy.mockResolvedValueOnce({ id: 1 } as never);

            await playerService.createPlayer('John', 'Setter', 1);

            expect((playerService as any).invalidateEntityCache).toHaveBeenCalledWith('medium');
        });
    });

    describe('createPlayerByName', () => {
        it('throws MissingFieldError without a team name', async () => {
            await expect(playerService.createPlayerByName('John', 'Setter', '')).rejects.toThrow(MissingFieldError);
        });

        it('throws NotFoundError when the named team does not exist', async () => {
            mockTeamRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(playerService.createPlayerByName('John', 'Setter', 'Ghosts')).rejects.toThrow(NotFoundError);
        });

        it('refuses a duplicate name on the same team', async () => {
            mockTeamRepository.findOne.mockResolvedValueOnce({ id: 1 } as never);
            mockPlayerRepository.findOne.mockResolvedValueOnce(player() as never);

            await expect(playerService.createPlayerByName('John', 'Setter', 'Team')).rejects.toThrow(
                'already exists on team'
            );
        });

        it('looks the duplicate up by the lowercased name', async () => {
            mockTeamRepository.findOne.mockResolvedValueOnce({ id: 1 } as never);
            mockPlayerRepository.findOne.mockResolvedValueOnce(null as never);

            await playerService.createPlayerByName('JOHN', 'Setter', 'Team');

            expect(mockPlayerRepository.findOne).toHaveBeenCalledWith(
                expect.objectContaining({ where: { name: 'john', teams: { id: 1 } } })
            );
        });
    });

    describe('getTeamsByPlayerName', () => {
        const pagination = { page: 1, limit: 2, skip: 0, take: 2 };

        it('throws MissingFieldError without a name', async () => {
            await expect(playerService.getTeamsByPlayerName('', pagination)).rejects.toThrow(MissingFieldError);
        });

        it('throws NotFoundError for an unknown player', async () => {
            mockPlayerRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(playerService.getTeamsByPlayerName('ghost', pagination)).rejects.toThrow(NotFoundError);
        });

        it('returns the page of team names alongside the full total', async () => {
            mockPlayerRepository.findOne.mockResolvedValueOnce(
                player({ teams: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] }) as never
            );

            const [names, total] = await playerService.getTeamsByPlayerName('John', pagination);

            expect(names).toEqual(['A', 'B']);
            expect(total).toBe(3);
        });

        it('returns a later page from the same list', async () => {
            mockPlayerRepository.findOne.mockResolvedValueOnce(
                player({ teams: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] }) as never
            );

            const [names] = await playerService.getTeamsByPlayerName('John', { page: 2, limit: 2, skip: 2, take: 2 });

            expect(names).toEqual(['C']);
        });
    });

    describe('getAllPlayers', () => {
        const pagination = { page: 1, limit: 10, skip: 0, take: 10 };

        it('turns a search filter into a case-insensitive name match', async () => {
            mockPlayerRepository.findAndCount.mockResolvedValueOnce([[], 0] as never);

            await playerService.getAllPlayers(pagination, { search: 'jo' });

            expect(mockPlayerRepository.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ where: { name: ILike('%jo%') } })
            );
        });

        it('filters by position', async () => {
            mockPlayerRepository.findAndCount.mockResolvedValueOnce([[], 0] as never);

            await playerService.getAllPlayers(pagination, { position: 'Libero' });

            expect(mockPlayerRepository.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ where: { position: 'Libero' } })
            );
        });

        it('reaches through the team relation for region and season filters', async () => {
            mockPlayerRepository.findAndCount.mockResolvedValueOnce([[], 0] as never);

            await playerService.getAllPlayers(pagination, { regionId: 2, seasonId: 3 });

            expect(mockPlayerRepository.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ where: { teams: { regionId: 2, season: { id: 3 } } } })
            );
        });

        it('defaults to sorting by name ascending', async () => {
            mockPlayerRepository.findAndCount.mockResolvedValueOnce([[], 0] as never);

            await playerService.getAllPlayers(pagination);

            expect(mockPlayerRepository.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ order: { name: 'ASC' } })
            );
        });

        it('honours an explicit sort', async () => {
            mockPlayerRepository.findAndCount.mockResolvedValueOnce([[], 0] as never);

            await playerService.getAllPlayers(pagination, {}, { sortBy: 'position', sortDir: 'DESC' });

            expect(mockPlayerRepository.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ order: { position: 'DESC' } })
            );
        });
    });

    describe('getPlayerById', () => {
        it('throws MissingFieldError without an id', async () => {
            await expect(playerService.getPlayerById(0)).rejects.toThrow(MissingFieldError);
        });

        it('throws NotFoundError when the player does not exist', async () => {
            mockPlayerRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(playerService.getPlayerById(999)).rejects.toThrow(NotFoundError);
        });

        it('returns every team when no region is requested', async () => {
            mockPlayerRepository.findOne.mockResolvedValueOnce(
                player({ teams: [{ id: 1, regionId: 1 }, { id: 2, regionId: 2 }] }) as never
            );

            const result = await playerService.getPlayerById(1);

            expect(result.teams).toHaveLength(2);
        });

        it('drops teams from other regions when one is requested', async () => {
            mockPlayerRepository.findOne.mockResolvedValueOnce(
                player({ teams: [{ id: 1, regionId: 1 }, { id: 2, regionId: 2 }] }) as never
            );

            const result = await playerService.getPlayerById(1, 2);

            expect(result.teams).toEqual([{ id: 2, regionId: 2 }]);
        });

        it('keeps a stat whose game sits in the requested region', async () => {
            mockPlayerRepository.findOne.mockResolvedValueOnce(
                player({
                    stats: [
                        { id: 1, game: { regionId: 2 } },
                        { id: 2, game: { regionId: 9 } },
                    ],
                }) as never
            );

            const result = await playerService.getPlayerById(1, 2);

            expect(result.stats.map(s => s.id)).toEqual([1]);
        });

        it('keeps a stat whose game inherits the region from its season', async () => {
            mockPlayerRepository.findOne.mockResolvedValueOnce(
                player({ stats: [{ id: 3, game: { season: { regionId: 2 } } }] }) as never
            );

            const result = await playerService.getPlayerById(1, 2);

            expect(result.stats).toHaveLength(1);
        });
    });

    describe('updatePlayer', () => {
        it('throws MissingFieldError without an id', async () => {
            await expect(playerService.updatePlayer(0, { name: 'x' })).rejects.toThrow(MissingFieldError);
        });

        it('throws NotFoundError for an unknown player', async () => {
            mockPlayerRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(playerService.updatePlayer(999, { name: 'x' })).rejects.toThrow(NotFoundError);
        });

        it('lowercases an updated name', async () => {
            mockPlayerRepository.findOne.mockResolvedValueOnce(player() as never);

            const updated = await playerService.updatePlayer(1, { name: 'NEW Name' });

            expect(updated.name).toBe('new name');
        });

        it('leaves fields that were not supplied alone', async () => {
            mockPlayerRepository.findOne.mockResolvedValueOnce(player({ position: 'Libero' }) as never);

            const updated = await playerService.updatePlayer(1, { name: 'x' });

            expect(updated.position).toBe('Libero');
        });

        it('names the team ids it could not resolve', async () => {
            mockPlayerRepository.findOne.mockResolvedValueOnce(player() as never);
            mockTeamRepository.findBy.mockResolvedValueOnce([{ id: 1 }] as never);

            await expect(playerService.updatePlayer(1, { teamIds: [1, 2, 3] })).rejects.toThrow(
                'Teams with IDs 2, 3 not found'
            );
        });

        it('replaces the team list when every id resolves', async () => {
            mockPlayerRepository.findOne.mockResolvedValueOnce(player() as never);
            mockTeamRepository.findBy.mockResolvedValueOnce([{ id: 1 }, { id: 2 }] as never);

            const updated = await playerService.updatePlayer(1, { teamIds: [1, 2] });

            expect(updated.teams).toHaveLength(2);
        });

        it('invalidates the cache entry for the specific player', async () => {
            mockPlayerRepository.findOne.mockResolvedValueOnce(player({ id: 42 }) as never);

            await playerService.updatePlayer(42, { name: 'x' });

            expect((playerService as any).invalidateEntityCache).toHaveBeenCalledWith(42);
        });
    });

    describe('deletePlayer', () => {
        it('throws MissingFieldError without an id', async () => {
            await expect(playerService.deletePlayer(0)).rejects.toThrow(MissingFieldError);
        });

        it('throws NotFoundError for an unknown player', async () => {
            mockPlayerRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(playerService.deletePlayer(999)).rejects.toThrow(NotFoundError);
        });

        it('removes the player and clears its caches', async () => {
            const existing = player();
            mockPlayerRepository.findOne.mockResolvedValueOnce(existing as never);

            await playerService.deletePlayer(1);

            expect(mockPlayerRepository.remove).toHaveBeenCalledWith(existing);
            expect((playerService as any).invalidateEntityCache).toHaveBeenCalledWith(1);
        });
    });

    describe('getPlayersByTeamId', () => {
        const pagination = { page: 1, limit: 10, skip: 0, take: 10 };

        it('throws MissingFieldError without a team id', async () => {
            await expect(playerService.getPlayersByTeamId(0, pagination)).rejects.toThrow(MissingFieldError);
        });

        it('throws NotFoundError when the team does not exist', async () => {
            mockTeamRepository.findOneBy.mockResolvedValueOnce(null as never);

            await expect(playerService.getPlayersByTeamId(99, pagination)).rejects.toThrow(NotFoundError);
        });

        it('pages the roster', async () => {
            mockTeamRepository.findOneBy.mockResolvedValueOnce({ id: 1 } as never);
            mockPlayerRepository.findAndCount.mockResolvedValueOnce([[player()], 1] as never);

            const [players, total] = await playerService.getPlayersByTeamId(1, pagination);

            expect(players).toHaveLength(1);
            expect(total).toBe(1);
        });
    });

    describe('createMultiplePlayers', () => {
        const rows = [{ name: 'john', position: 'Setter', teamIds: [1] }];

        it('rejects a row with no name before opening a transaction', async () => {
            await expect(
                playerService.createMultiplePlayers([{ name: '', position: 'Setter', teamIds: [1] }])
            ).rejects.toThrow(MissingFieldError);
            expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
        });

        it('rejects a row with no team ids', async () => {
            await expect(
                playerService.createMultiplePlayers([{ name: 'john', position: 'Setter', teamIds: [] }])
            ).rejects.toThrow(MissingFieldError);
        });

        it('rolls back when a player already exists on one of the teams', async () => {
            mockTxTeamRepository.findBy.mockResolvedValueOnce([{ id: 1 }] as never);
            mockTxPlayerRepository.find.mockResolvedValueOnce([
                { id: 5, name: 'john', teams: [{ id: 1 }] },
            ] as never);

            await expect(playerService.createMultiplePlayers(rows)).rejects.toThrow('already exists');
            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.release).toHaveBeenCalled();
        });

        it('ignores a same-named player who is on a different team', async () => {
            mockTxTeamRepository.findBy.mockResolvedValueOnce([{ id: 1 }] as never);
            mockTxPlayerRepository.find.mockResolvedValueOnce([
                { id: 5, name: 'john', teams: [{ id: 99 }] },
            ] as never);

            await expect(playerService.createMultiplePlayers(rows)).resolves.toHaveLength(1);
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        });

        it('gives each new player only the teams it asked for', async () => {
            mockTxTeamRepository.findBy.mockResolvedValueOnce([{ id: 1 }, { id: 2 }] as never);
            mockTxPlayerRepository.find.mockResolvedValueOnce([] as never);

            const created: any = await playerService.createMultiplePlayers([
                { name: 'john', position: 'Setter', teamIds: [1] },
                { name: 'jane', position: 'Libero', teamIds: [2] },
            ]);

            expect(created[0].teams).toEqual([{ id: 1 }]);
            expect(created[1].teams).toEqual([{ id: 2 }]);
        });
    });

    describe('mergePlayers', () => {
        it('throws MissingFieldError without a target id', async () => {
            await expect(playerService.mergePlayers(0, 2)).rejects.toThrow(MissingFieldError);
        });

        it('throws MissingFieldError without a merged id', async () => {
            await expect(playerService.mergePlayers(1, 0)).rejects.toThrow(MissingFieldError);
        });

        it('throws NotFoundError when the target is missing', async () => {
            mockPlayerRepository.findOneBy.mockResolvedValueOnce(null as never);

            await expect(playerService.mergePlayers(1, 2)).rejects.toThrow('Target player with ID 1 not found');
        });

        it('throws NotFoundError when the player being merged is missing', async () => {
            mockPlayerRepository.findOneBy
                .mockResolvedValueOnce(player({ id: 1 }) as never)
                .mockResolvedValueOnce(null as never);

            await expect(playerService.mergePlayers(1, 2)).rejects.toThrow('Player to merge with ID 2 not found');
        });

        it('reassigns team links and stats onto the target, then deletes the merged player', async () => {
            mockPlayerRepository.findOneBy
                .mockResolvedValueOnce(player({ id: 1 }) as never)
                .mockResolvedValueOnce(player({ id: 2 }) as never);

            await playerService.mergePlayers(1, 2);

            expect(mockManagerQueryBuilder.set).toHaveBeenCalledWith({ playersId: 1 });
            expect(mockQueryRunner.manager.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE "stats"'), [1, 2]);
            expect(mockQueryRunner.manager.delete).toHaveBeenCalledWith(expect.anything(), { id: 2 });
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        });

        it('rolls back and releases when the merge fails midway', async () => {
            mockPlayerRepository.findOneBy
                .mockResolvedValueOnce(player({ id: 1 }) as never)
                .mockResolvedValueOnce(player({ id: 2 }) as never);
            mockQueryRunner.manager.query.mockRejectedValueOnce(new Error('db down') as never);

            await expect(playerService.mergePlayers(1, 2)).rejects.toThrow('db down');
            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.release).toHaveBeenCalled();
        });
    });
});
