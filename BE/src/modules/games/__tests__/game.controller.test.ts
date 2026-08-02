import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { GameController } from '../game.controller.js';
import { GameService } from '../game.service.js';
import { mockGame, savedGame, mockGames, mockTeam } from '../../../__mocks__/fixtures.js';
import { Request, Response, NextFunction } from 'express';
import { MissingFieldError } from '../../../errors/MissingFieldError.js';

const mockCreateGame = jest.fn();
const mockGetAllGames = jest.fn();
const mockGetGameById = jest.fn();
const mockUpdateGame = jest.fn();
const mockDeleteGame = jest.fn();
const mockGetGamesByTeamId = jest.fn();

describe('GameController', () => {
  let gameController: GameController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    gameController = new GameController();
    next = jest.fn();
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    GameService.prototype.createGame = mockCreateGame;
    GameService.prototype.getAllGames = mockGetAllGames;
    GameService.prototype.getGameById = mockGetGameById;
    GameService.prototype.updateGame = mockUpdateGame;
    GameService.prototype.deleteGame = mockDeleteGame;
    GameService.prototype.getGamesByTeamId = mockGetGamesByTeamId;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createGame', () => {
    it('should create a game and return 201 status', async () => {
      mockCreateGame.mockResolvedValue(savedGame);

      req = {
        body: {
          date: '2025-01-01',
          seasonId: '1',
          teamIds: [mockTeam.id, mockTeam.id],
          stage: 'Finals',
          team1Score: 2,
          team2Score: 1,
        },
      };

      await gameController.createGame(req as Request, res as Response, next as NextFunction);

      expect(mockCreateGame).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(savedGame);
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward validation errors to error handler', async () => {
      const validationError = new MissingFieldError('Score is required');
      mockCreateGame.mockRejectedValue(validationError);

      req = {
        body: {
          date: '2025-01-01',
          seasonId: '1',
          teamIds: [mockTeam.id, mockTeam.id],
          stage: 'Finals',
        },
      };

      await gameController.createGame(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(validationError);
    });

    it('should forward server errors to error handler', async () => {
      const serverError = new Error('Server error');
      mockCreateGame.mockRejectedValue(serverError);

      req = {
        body: {
          date: '2025-01-01',
          seasonId: '1',
          teamIds: [mockTeam.id, mockTeam.id],
          stage: 'Finals',
          team1Score: 2,
          team2Score: 1,
        },
      };

      await gameController.createGame(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(serverError);
    });
  });

  describe('getGames', () => {
    it('should fetch all games and return 200 status', async () => {
      mockGetAllGames.mockResolvedValue([mockGames, mockGames.length]);

      req = { query: {} };

      await gameController.getGames(req as Request, res as Response, next as NextFunction);

      expect(mockGetAllGames).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward fetch errors to error handler', async () => {
      const fetchError = new Error('Failed to fetch games');
      mockGetAllGames.mockRejectedValue(fetchError);

      req = { query: {} };

      await gameController.getGames(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(fetchError);
    });
  });

  describe('getGameById', () => {
    it('should return a game by ID', async () => {
      mockGetGameById.mockResolvedValue(mockGame);

      req = { params: { id: '1' } };

      await gameController.getGameById(req as Request, res as Response, next as NextFunction);

      expect(mockGetGameById).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockGame);
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward server errors to error handler', async () => {
      const serverError = new Error('Server error');
      mockGetGameById.mockRejectedValue(serverError);

      req = { params: { id: '1' } };

      await gameController.getGameById(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(serverError);
    });
  });

  describe('updateGame', () => {
    it('should update a game and return 200 status', async () => {
      mockUpdateGame.mockResolvedValue(savedGame);

      req = {
        params: { id: '1' },
        body: {
          date: '2025-01-02',
          seasonId: '1',
          teamIds: [mockTeam.id, mockTeam.id],
          stage: 'Finals',
          team1Score: 3,
          team2Score: 2,
        },
      };

      await gameController.updateGame(req as Request, res as Response, next as NextFunction);

      expect(mockUpdateGame).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(savedGame);
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward validation errors to error handler', async () => {
      const validationError = new MissingFieldError('Score is required');
      mockUpdateGame.mockRejectedValue(validationError);

      req = {
        params: { id: '1' },
        body: {
          date: '2025-01-02',
          seasonId: '1',
          teamIds: [mockTeam.id, mockTeam.id],
          stage: 'Finals',
        },
      };

      await gameController.updateGame(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(validationError);
    });

    it('should forward server errors to error handler', async () => {
      const serverError = new Error('Server error');
      mockUpdateGame.mockRejectedValue(serverError);

      req = {
        params: { id: '1' },
        body: {
          date: '2025-01-02',
          seasonId: '1',
          teamIds: [mockTeam.id, mockTeam.id],
          stage: 'Finals',
          team1Score: 3,
          team2Score: 2,
        },
      };

      await gameController.updateGame(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(serverError);
    });
  });

  describe('deleteGame', () => {
    it('should delete a game and return 204 status', async () => {
      mockDeleteGame.mockResolvedValue(undefined);

      req = { params: { id: '1' } };

      await gameController.deleteGame(req as Request, res as Response, next as NextFunction);

      expect(mockDeleteGame).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward server errors to error handler', async () => {
      const serverError = new Error('Server error');
      mockDeleteGame.mockRejectedValue(serverError);

      req = { params: { id: '1' } };

      await gameController.deleteGame(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(serverError);
    });
  });

  describe('getGamesByTeamId', () => {
    it('should return all games for a specific team', async () => {
      mockGetGamesByTeamId.mockResolvedValue([mockGames, mockGames.length]);

      req = { params: { teamId: '1' }, query: {} };

      await gameController.getGamesByTeamId(req as Request, res as Response, next as NextFunction);

      expect(mockGetGamesByTeamId).toHaveBeenCalledWith(1, expect.objectContaining({ page: 1, limit: 10 }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: mockGames,
        total: mockGames.length,
        page: 1,
        limit: 10,
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if no games are found for team', async () => {
      mockGetGamesByTeamId.mockResolvedValue([[], 0]);

      req = { params: { teamId: '1' }, query: {} };

      await gameController.getGamesByTeamId(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'No games found for the specified team' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward server errors to error handler', async () => {
      const serverError = new Error('Server error');
      mockGetGamesByTeamId.mockRejectedValue(serverError);

      req = { params: { teamId: '1' }, query: {} };

      await gameController.getGamesByTeamId(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(serverError);
    });
  });
});
