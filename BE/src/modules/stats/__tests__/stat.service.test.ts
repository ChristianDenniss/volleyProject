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

// Mock TypeORM's Repository
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

describe('StatService', () => {
    let statService: StatService;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        statService = new StatService();
        (statService as any).statRepository = mockStatRepository as unknown as Repository<Stats>;
        (statService as any).playerRepository = mockPlayerRepository as unknown as Repository<Players>;
        (statService as any).gameRepository = mockGameRepository as unknown as Repository<Games>;
    });

    describe('createStat', () => {
        it('should throw MissingFieldError when required fields are missing', async () => {
            await expect(statService.createStat(
                undefined as any, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1
            )).rejects.toThrow(MissingFieldError);
        });

        it('should throw NegativeStatError when a negative value is provided', async () => {
            await expect(statService.createStat(
                -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1
            )).rejects.toThrow(NegativeStatError);
        });

        it('should throw NotFoundError if player does not exist', async () => {
            mockPlayerRepository.findOne.mockResolvedValue(null);

            await expect(statService.createStat(
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1
            )).rejects.toThrow(NotFoundError);
        });

        it('should throw NotFoundError if game does not exist', async () => {
            mockPlayerRepository.findOne.mockResolvedValue({ id: 1, team: { id: 10 } });
            mockGameRepository.findOne.mockResolvedValue(null);

            await expect(statService.createStat(
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1
            )).rejects.toThrow(NotFoundError);
        });

        it('should throw ConflictError if player team is not in the game', async () => {
            mockPlayerRepository.findOne.mockResolvedValue({ id: 1, team: { id: 10 } });
            mockGameRepository.findOne.mockResolvedValue({
                id: 1,
                teams: [{ id: 20 }]
            });

            await expect(statService.createStat(
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1
            )).rejects.toThrow(ConflictError);
        });

        it('should throw DuplicateError if stat already exists for the player and game', async () => {
            mockPlayerRepository.findOne.mockResolvedValue({ id: 1, team: { id: 10 } });
            mockGameRepository.findOne.mockResolvedValue({
                id: 1,
                teams: [{ id: 10 }]
            });
            mockStatRepository.findOne.mockResolvedValue({ id: 1 });

            await expect(statService.createStat(
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1
            )).rejects.toThrow(DuplicateError);
        });

        it('should create and return a new stat entry when all validations pass', async () => {
            mockPlayerRepository.findOne.mockResolvedValue({ id: 1, team: { id: 10 } });
            mockGameRepository.findOne.mockResolvedValue({
                id: 1,
                teams: [{ id: 10 }]
            });
            mockStatRepository.findOne.mockResolvedValue(null);
            mockStatRepository.save.mockResolvedValue({
                id: 1,
                spikingErrors: 0,
                player: { id: 1 },
                game: { id: 1 }
            });

            const result = await statService.createStat(
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1
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
                game: { id: 1 }
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
            mockStatRepository.findOne.mockResolvedValue({ id: 1 });

            await statService.deleteStat(1);

            expect(mockStatRepository.remove).toHaveBeenCalled();
        });

        it('should throw NotFoundError if stat does not exist', async () => {
            mockStatRepository.findOne.mockResolvedValue(null);

            await expect(statService.deleteStat(1)).rejects.toThrow(NotFoundError);
        });
    });
});
