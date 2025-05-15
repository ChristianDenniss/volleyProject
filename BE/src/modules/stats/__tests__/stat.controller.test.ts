import { Request, Response } from 'express';
import { StatController } from '../stat.controller.js';

// Mock data
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

// Mock the StatService
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
    let jsonMock;
    let statusMock;
    let sendMock;

    beforeEach(() => {
        jsonMock = jest.fn().mockReturnThis();
        sendMock = jest.fn().mockReturnThis();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock, send: sendMock });

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

            await statController.createStat(mockRequest, mockResponse);

            expect(statController.statService.createStat).toHaveBeenCalledWith(
                mockStat.spikingErrors,
                mockStat.apeKills,
                mockStat.apeAttempts,
                mockStat.spikeKills,
                mockStat.spikeAttempts,
                mockStat.assists,
                mockStat.blocks,
                mockStat.digs,
                mockStat.blockFollows,
                mockStat.aces,
                mockStat.miscErrors,
                mockStat.playerId,
                mockStat.gameId
            );
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(mockStat);
        });

        it('should handle validation errors with 400 status', async () => {
            mockRequest.body = {};
            statController.statService.createStat.mockRejectedValueOnce(new Error('Player ID is required'));

            await statController.createStat(mockRequest, mockResponse);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Player ID is required' });
        });

        it('should handle server errors with 500 status', async () => {
            mockRequest.body = mockStat;
            statController.statService.createStat.mockRejectedValueOnce(new Error('Database error'));

            await statController.createStat(mockRequest, mockResponse);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to create stat' });
        });
    });

    describe('getStats', () => {
        it('should return all stats', async () => {
            statController.statService.getAllStats.mockResolvedValueOnce(mockStats);

            await statController.getStats(mockRequest, mockResponse);

            expect(jsonMock).toHaveBeenCalledWith(mockStats);
        });

        it('should handle server errors with 500 status', async () => {
            statController.statService.getAllStats.mockRejectedValueOnce(new Error('Database error'));

            await statController.getStats(mockRequest, mockResponse);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch stats' });
        });
    });

    describe('getStatById', () => {
        it('should return a single stat by ID', async () => {
            mockRequest.params = { id: '1' };
            statController.statService.getStatById.mockResolvedValueOnce(mockStat);

            await statController.getStatById(mockRequest, mockResponse);

            expect(jsonMock).toHaveBeenCalledWith(mockStat);
        });

        it('should return 404 if stat not found', async () => {
            mockRequest.params = { id: '99' };
            statController.statService.getStatById.mockRejectedValueOnce(new Error('Stat not found'));

            await statController.getStatById(mockRequest, mockResponse);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Stat not found' });
        });

        it('should handle server errors with 500 status', async () => {
            mockRequest.params = { id: '1' };
            statController.statService.getStatById.mockRejectedValueOnce(new Error('Database error'));

            await statController.getStatById(mockRequest, mockResponse);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch stat' });
        });
    });

    describe('deleteStat', () => {
        it('should delete a stat and return 204', async () => {
            mockRequest.params = { id: '1' };
            statController.statService.deleteStat.mockResolvedValueOnce();

            await statController.deleteStat(mockRequest, mockResponse);

            expect(statusMock).toHaveBeenCalledWith(204);
            expect(sendMock).toHaveBeenCalled();
        });

        it('should return 404 if stat not found', async () => {
            mockRequest.params = { id: '99' };
            statController.statService.deleteStat.mockRejectedValueOnce(new Error('Stat not found'));

            await statController.deleteStat(mockRequest, mockResponse);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Stat not found' });
        });

        it('should handle server errors with 500 status', async () => {
            mockRequest.params = { id: '1' };
            statController.statService.deleteStat.mockRejectedValueOnce(new Error('Database error'));

            await statController.deleteStat(mockRequest, mockResponse);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to delete stat' });
        });
    });

    describe('getStatsByPlayerId', () => {
        it('should return stats for a given player', async () => {
            mockRequest.params = { playerId: '1' };
            statController.statService.getStatsByPlayerId.mockResolvedValueOnce([mockStat]);

            await statController.getStatsByPlayerId(mockRequest, mockResponse);

            expect(jsonMock).toHaveBeenCalledWith([mockStat]);
        });

        it('should return 404 if no stats found', async () => {
            mockRequest.params = { playerId: '99' };
            statController.statService.getStatsByPlayerId.mockResolvedValueOnce([]);

            await statController.getStatsByPlayerId(mockRequest, mockResponse);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'No stats found for the specified player' });
        });
    });

    describe('getStatsByGameId', () => {
        it('should return stats for a given game', async () => {
            mockRequest.params = { gameId: '1' };
            statController.statService.getStatsByGameId.mockResolvedValueOnce([mockStat]);

            await statController.getStatsByGameId(mockRequest, mockResponse);

            expect(jsonMock).toHaveBeenCalledWith([mockStat]);
        });

        it('should return 404 if no stats found', async () => {
            mockRequest.params = { gameId: '99' };
            statController.statService.getStatsByGameId.mockResolvedValueOnce([]);

            await statController.getStatsByGameId(mockRequest, mockResponse);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'No stats found for the specified game' });
        });
    });
});
