import { Request, Response, NextFunction } from 'express';
import { StatController } from '../stat.controller.js';
import { MissingFieldError } from '../../../errors/MissingFieldError.js';
import { NotFoundError } from '../../../errors/NotFoundError.js';

const mockStat = {
    id: 1,
    spikingErrors: 2,
    apeKills: 5,
    apeAttempts: 10,
    spikeKills: 8,
    spikeAttempts: 15,
    assists: 3,
    blocks: 4,
    digs: 6,
    blockFollows: 2,
    aces: 1,
    miscErrors: 0,
    playerId: 1,
    gameId: 1,
};

const mockStats = [mockStat, { ...mockStat, id: 2, playerId: 2 }];

jest.mock('../stat.service', () => {
    return {
        StatService: jest.fn().mockImplementation(() => {
            return {
                createStat: jest.fn(),
                getAllStats: jest.fn(),
                getStatById: jest.fn(),
                updateStat: jest.fn(),
                deleteStat: jest.fn(),
                getStatsByPlayerId: jest.fn(),
                getStatsByGameId: jest.fn(),
            };
        }),
    };
});

describe('StatController', () => {
    let statController;
    let mockRequest;
    let mockResponse;
    let next;
    let jsonMock;
    let statusMock;
    let sendMock;

    beforeEach(() => {
        jsonMock = jest.fn().mockReturnThis();
        sendMock = jest.fn().mockReturnThis();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock, send: sendMock });
        next = jest.fn();

        mockRequest = {};
        mockResponse = {
            json: jsonMock,
            status: statusMock,
            send: sendMock,
        };

        statController = new StatController();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createStat', () => {
        it('should create a stat and return 201 status', async () => {
            mockRequest.body = mockStat;
            statController.statService.createStat.mockResolvedValueOnce(mockStat);

            await statController.createStat(mockRequest, mockResponse, next);

            expect(statController.statService.createStat).toHaveBeenCalledWith(mockStat);
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(mockStat);
            expect(next).not.toHaveBeenCalled();
        });

        it('should forward validation errors to error handler', async () => {
            const validationError = new MissingFieldError('Player ID is required');
            mockRequest.body = {};
            statController.statService.createStat.mockRejectedValueOnce(validationError);

            await statController.createStat(mockRequest, mockResponse, next);

            expect(next).toHaveBeenCalledWith(validationError);
        });

        it('should forward server errors to error handler', async () => {
            const serverError = new Error('Database error');
            mockRequest.body = mockStat;
            statController.statService.createStat.mockRejectedValueOnce(serverError);

            await statController.createStat(mockRequest, mockResponse, next);

            expect(next).toHaveBeenCalledWith(serverError);
        });
    });

    describe('getStats', () => {
        it('should return all stats', async () => {
            statController.statService.getAllStats.mockResolvedValueOnce([mockStats, mockStats.length]);
            mockRequest.query = {};

            await statController.getStats(mockRequest, mockResponse, next);

            expect(next).not.toHaveBeenCalled();
        });

        it('should forward server errors to error handler', async () => {
            const serverError = new Error('Database error');
            mockRequest.query = {};
            statController.statService.getAllStats.mockRejectedValueOnce(serverError);

            await statController.getStats(mockRequest, mockResponse, next);

            expect(next).toHaveBeenCalledWith(serverError);
        });
    });

    describe('getStatById', () => {
        it('should return a single stat by ID', async () => {
            mockRequest.params = { id: '1' };
            statController.statService.getStatById.mockResolvedValueOnce(mockStat);

            await statController.getStatById(mockRequest, mockResponse, next);

            expect(jsonMock).toHaveBeenCalledWith(mockStat);
            expect(next).not.toHaveBeenCalled();
        });

        it('should forward not found errors to error handler', async () => {
            const notFoundError = new NotFoundError('Stat not found');
            mockRequest.params = { id: '99' };
            statController.statService.getStatById.mockRejectedValueOnce(notFoundError);

            await statController.getStatById(mockRequest, mockResponse, next);

            expect(next).toHaveBeenCalledWith(notFoundError);
        });

        it('should forward server errors to error handler', async () => {
            const serverError = new Error('Database error');
            mockRequest.params = { id: '1' };
            statController.statService.getStatById.mockRejectedValueOnce(serverError);

            await statController.getStatById(mockRequest, mockResponse, next);

            expect(next).toHaveBeenCalledWith(serverError);
        });
    });

    describe('deleteStat', () => {
        it('should delete a stat and return 204', async () => {
            mockRequest.params = { id: '1' };
            statController.statService.deleteStat.mockResolvedValueOnce();

            await statController.deleteStat(mockRequest, mockResponse, next);

            expect(statusMock).toHaveBeenCalledWith(204);
            expect(sendMock).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
        });

        it('should forward not found errors to error handler', async () => {
            const notFoundError = new NotFoundError('Stat not found');
            mockRequest.params = { id: '99' };
            statController.statService.deleteStat.mockRejectedValueOnce(notFoundError);

            await statController.deleteStat(mockRequest, mockResponse, next);

            expect(next).toHaveBeenCalledWith(notFoundError);
        });

        it('should forward server errors to error handler', async () => {
            const serverError = new Error('Database error');
            mockRequest.params = { id: '1' };
            statController.statService.deleteStat.mockRejectedValueOnce(serverError);

            await statController.deleteStat(mockRequest, mockResponse, next);

            expect(next).toHaveBeenCalledWith(serverError);
        });
    });

    describe('getStatsByPlayerId', () => {
        it('should return stats for a given player', async () => {
            mockRequest.params = { playerId: '1' };
            mockRequest.query = {};
            statController.statService.getStatsByPlayerId.mockResolvedValueOnce([[mockStat], 1]);

            await statController.getStatsByPlayerId(mockRequest, mockResponse, next);

            expect(next).not.toHaveBeenCalled();
        });

        it('should return 404 if no stats found', async () => {
            mockRequest.params = { playerId: '99' };
            mockRequest.query = {};
            statController.statService.getStatsByPlayerId.mockResolvedValueOnce([[], 0]);

            await statController.getStatsByPlayerId(mockRequest, mockResponse, next);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'No stats found for the specified player' });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('getStatsByGameId', () => {
        it('should return stats for a given game', async () => {
            mockRequest.params = { gameId: '1' };
            mockRequest.query = {};
            statController.statService.getStatsByGameId.mockResolvedValueOnce([[mockStat], 1]);

            await statController.getStatsByGameId(mockRequest, mockResponse, next);

            expect(next).not.toHaveBeenCalled();
        });

        it('should return 404 if no stats found', async () => {
            mockRequest.params = { gameId: '99' };
            mockRequest.query = {};
            statController.statService.getStatsByGameId.mockResolvedValueOnce([[], 0]);

            await statController.getStatsByGameId(mockRequest, mockResponse, next);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'No stats found for the specified game' });
            expect(next).not.toHaveBeenCalled();
        });
    });
});
