import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { StatService } from '../stat.service.js';
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

const mockCreateStat = jest.fn();
const mockGetAllStats = jest.fn();
const mockGetStatById = jest.fn();
const mockUpdateStat = jest.fn();
const mockDeleteStat = jest.fn();
const mockGetStatsByPlayerId = jest.fn();
const mockGetStatsByGameId = jest.fn();

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

        StatService.prototype.createStat = mockCreateStat;
        StatService.prototype.getAllStats = mockGetAllStats;
        StatService.prototype.getStatById = mockGetStatById;
        StatService.prototype.updateStat = mockUpdateStat;
        StatService.prototype.deleteStat = mockDeleteStat;
        StatService.prototype.getStatsByPlayerId = mockGetStatsByPlayerId;
        StatService.prototype.getStatsByGameId = mockGetStatsByGameId;

        statController = new StatController();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createStat', () => {
        it('should create a stat and return 201 status', async () => {
            mockRequest.body = mockStat;
            mockCreateStat.mockResolvedValueOnce(mockStat);

            await statController.createStat(mockRequest, mockResponse, next);

            expect(mockCreateStat).toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(mockStat);
            expect(next).not.toHaveBeenCalled();
        });

        it('should forward validation errors to error handler', async () => {
            const validationError = new MissingFieldError('Player ID is required');
            mockRequest.body = {};
            mockCreateStat.mockRejectedValueOnce(validationError);

            await statController.createStat(mockRequest, mockResponse, next);

            expect(next).toHaveBeenCalledWith(validationError);
        });

        it('should forward server errors to error handler', async () => {
            const serverError = new Error('Database error');
            mockRequest.body = mockStat;
            mockCreateStat.mockRejectedValueOnce(serverError);

            await statController.createStat(mockRequest, mockResponse, next);

            expect(next).toHaveBeenCalledWith(serverError);
        });
    });

    describe('getStats', () => {
        it('should return all stats', async () => {
            mockGetAllStats.mockResolvedValueOnce([mockStats, mockStats.length]);
            mockRequest.query = {};

            await statController.getStats(mockRequest, mockResponse, next);

            expect(next).not.toHaveBeenCalled();
        });

        it('should forward server errors to error handler', async () => {
            const serverError = new Error('Database error');
            mockRequest.query = {};
            mockGetAllStats.mockRejectedValueOnce(serverError);

            await statController.getStats(mockRequest, mockResponse, next);

            expect(next).toHaveBeenCalledWith(serverError);
        });
    });

    describe('getStatById', () => {
        it('should return a single stat by ID', async () => {
            mockRequest.params = { id: '1' };
            mockGetStatById.mockResolvedValueOnce(mockStat);

            await statController.getStatById(mockRequest, mockResponse, next);

            expect(jsonMock).toHaveBeenCalledWith(mockStat);
            expect(next).not.toHaveBeenCalled();
        });

        it('should forward not found errors to error handler', async () => {
            const notFoundError = new NotFoundError('Stat not found');
            mockRequest.params = { id: '99' };
            mockGetStatById.mockRejectedValueOnce(notFoundError);

            await statController.getStatById(mockRequest, mockResponse, next);

            expect(next).toHaveBeenCalledWith(notFoundError);
        });

        it('should forward server errors to error handler', async () => {
            const serverError = new Error('Database error');
            mockRequest.params = { id: '1' };
            mockGetStatById.mockRejectedValueOnce(serverError);

            await statController.getStatById(mockRequest, mockResponse, next);

            expect(next).toHaveBeenCalledWith(serverError);
        });
    });

    describe('deleteStat', () => {
        it('should delete a stat and return 204', async () => {
            mockRequest.params = { id: '1' };
            mockDeleteStat.mockResolvedValueOnce(undefined);

            await statController.deleteStat(mockRequest, mockResponse, next);

            expect(statusMock).toHaveBeenCalledWith(204);
            expect(sendMock).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
        });

        it('should forward not found errors to error handler', async () => {
            const notFoundError = new NotFoundError('Stat not found');
            mockRequest.params = { id: '99' };
            mockDeleteStat.mockRejectedValueOnce(notFoundError);

            await statController.deleteStat(mockRequest, mockResponse, next);

            expect(next).toHaveBeenCalledWith(notFoundError);
        });

        it('should forward server errors to error handler', async () => {
            const serverError = new Error('Database error');
            mockRequest.params = { id: '1' };
            mockDeleteStat.mockRejectedValueOnce(serverError);

            await statController.deleteStat(mockRequest, mockResponse, next);

            expect(next).toHaveBeenCalledWith(serverError);
        });
    });

    describe('getStatsByPlayerId', () => {
        it('should return stats for a given player', async () => {
            mockRequest.params = { playerId: '1' };
            mockRequest.query = {};
            mockGetStatsByPlayerId.mockResolvedValueOnce([[mockStat], 1]);

            await statController.getStatsByPlayerId(mockRequest, mockResponse, next);

            expect(next).not.toHaveBeenCalled();
        });

        it('should return 404 if no stats found', async () => {
            mockRequest.params = { playerId: '99' };
            mockRequest.query = {};
            mockGetStatsByPlayerId.mockResolvedValueOnce([[], 0]);

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
            mockGetStatsByGameId.mockResolvedValueOnce([[mockStat], 1]);

            await statController.getStatsByGameId(mockRequest, mockResponse, next);

            expect(next).not.toHaveBeenCalled();
        });

        it('should return 404 if no stats found', async () => {
            mockRequest.params = { gameId: '99' };
            mockRequest.query = {};
            mockGetStatsByGameId.mockResolvedValueOnce([[], 0]);

            await statController.getStatsByGameId(mockRequest, mockResponse, next);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'No stats found for the specified game' });
            expect(next).not.toHaveBeenCalled();
        });
    });
});
