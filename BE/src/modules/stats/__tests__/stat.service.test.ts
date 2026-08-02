import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { StatService } from '../stat.service.js';
import { Repository } from 'typeorm';
import { Stats } from '../stat.entity.js';
import { Players } from '../../players/player.entity.js';
import { Games } from '../../games/game.entity.js';
import { MissingFieldError } from '../../../errors/MissingFieldError.js';
import { NegativeStatError } from '../../../errors/NegativeStatError.js';
import { NotFoundError } from '../../../errors/NotFoundError.js';
import { ConflictError } from '../../../errors/ConflictError.js';
import { DuplicateError } from '../../../errors/DuplicateError.js';

const mockStatRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
};

const mockPlayerRepository = {
    findOne: jest.fn(),
};

const mockGameRepository = {
    findOne: jest.fn(),
};

function statArgs(
    overrides: Partial<{
        spikingErrors: number;
        playerId: number;
        gameId: number;
    }> = {}
) {
    return [
        overrides.spikingErrors ?? 0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        overrides.playerId ?? 1,
        overrides.gameId ?? 1,
    ] as const;
}

describe('StatService', () => {
    let statService: StatService;

    beforeEach(() => {
        jest.clearAllMocks();

        statService = new StatService();
        (statService as any).statRepository = mockStatRepository as unknown as Repository<Stats>;
        (statService as any).playerRepository = mockPlayerRepository as unknown as Repository<Players>;
        (statService as any).gameRepository = mockGameRepository as unknown as Repository<Games>;
        (statService as any).invalidateEntityCache = jest.fn().mockResolvedValue(undefined);
    });

    describe('createStat', () => {
        it('should throw MissingFieldError when required fields are missing', async () => {
            await expect(statService.createStat(
                undefined as any, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1
            )).rejects.toThrow(MissingFieldError);
        });

        it('should throw NegativeStatError when a negative value is provided', async () => {
            await expect(statService.createStat(
                ...statArgs({ spikingErrors: -1 })
            )).rejects.toThrow(NegativeStatError);
        });

        it('should throw NotFoundError if player does not exist', async () => {
            mockPlayerRepository.findOne.mockResolvedValue(null);

            await expect(statService.createStat(
                ...statArgs()
            )).rejects.toThrow(NotFoundError);
        });

        it('should throw NotFoundError if game does not exist', async () => {
            mockPlayerRepository.findOne.mockResolvedValue({ id: 1, teams: [{ id: 10 }] });
            mockGameRepository.findOne.mockResolvedValue(null);

            await expect(statService.createStat(
                ...statArgs()
            )).rejects.toThrow(NotFoundError);
        });

        it('should throw ConflictError if player team is not in the game', async () => {
            mockPlayerRepository.findOne.mockResolvedValue({ id: 1, teams: [{ id: 10 }] });
            mockGameRepository.findOne.mockResolvedValue({
                id: 1,
                teams: [{ id: 99 }],
            });

            await expect(statService.createStat(
                ...statArgs()
            )).rejects.toThrow(ConflictError);
        });

        it('should throw DuplicateError if stat already exists for the player and game', async () => {
            mockPlayerRepository.findOne.mockResolvedValue({ id: 1, teams: [{ id: 10 }] });
            mockGameRepository.findOne.mockResolvedValue({
                id: 1,
                teams: [{ id: 10 }],
            });
            mockStatRepository.findOne.mockResolvedValue({ id: 1 });

            await expect(statService.createStat(
                ...statArgs()
            )).rejects.toThrow(DuplicateError);
        });

        it('should create and return a new stat entry when all validations pass', async () => {
            mockPlayerRepository.findOne.mockResolvedValue({ id: 1, teams: [{ id: 10 }] });
            mockGameRepository.findOne.mockResolvedValue({
                id: 1,
                teams: [{ id: 10 }],
            });
            mockStatRepository.findOne.mockResolvedValue(null);
            mockStatRepository.save.mockResolvedValue({
                id: 1,
                spikingErrors: 0,
                player: { id: 1 },
                game: { id: 1 },
            });

            const result = await statService.createStat(
                ...statArgs()
            );

            expect(mockStatRepository.save).toHaveBeenCalled();
            expect(result).toEqual(expect.objectContaining({ id: 1, spikingErrors: 0 }));
        });
    });

    describe('getStatById', () => {
        it('should return a stat entry by ID', async () => {
            mockStatRepository.findOne.mockResolvedValue({
                id: 1,
                spikingErrors: 2,
                player: { id: 1 },
                game: { id: 1 },
            });

            const result = await statService.getStatById(1);
            expect(result).toEqual(expect.objectContaining({ id: 1, spikingErrors: 2 }));
        });

        it('should throw NotFoundError if stat is not found', async () => {
            mockStatRepository.findOne.mockResolvedValue(null);

            await expect(statService.getStatById(1)).rejects.toThrow(NotFoundError);
        });
    });

    describe('deleteStat', () => {
        it('should delete a stat entry if it exists', async () => {
            mockStatRepository.findOne.mockResolvedValue({
                id: 1,
                player: { id: 1 },
                game: { id: 1 },
            });

            await statService.deleteStat(1);

            expect(mockStatRepository.remove).toHaveBeenCalled();
        });

        it('should throw NotFoundError if stat does not exist', async () => {
            mockStatRepository.findOne.mockResolvedValue(null);

            await expect(statService.deleteStat(1)).rejects.toThrow(NotFoundError);
        });
    });
});
