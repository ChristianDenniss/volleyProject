import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PlayerController } from '../player.controller.js';
import { PlayerService } from '../player.service.js';
import { mockPlayer, savedPlayer, mockPlayers, mockTeam } from '../../../__mocks__/fixtures.js';
import { Request, Response, NextFunction } from 'express';
import { MissingFieldError } from '../../../errors/MissingFieldError.js';
import { NotFoundError } from '../../../errors/NotFoundError.js';

const mockCreatePlayer = jest.fn();
const mockGetAllPlayers = jest.fn();
const mockGetPlayerById = jest.fn();
const mockUpdatePlayer = jest.fn();
const mockDeletePlayer = jest.fn();
const mockGetPlayersByTeamId = jest.fn();

describe('PlayerController', () => {
  let playerController: PlayerController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    playerController = new PlayerController();
    next = jest.fn();
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    PlayerService.prototype.createPlayer = mockCreatePlayer;
    PlayerService.prototype.getAllPlayers = mockGetAllPlayers;
    PlayerService.prototype.getPlayerById = mockGetPlayerById;
    PlayerService.prototype.updatePlayer = mockUpdatePlayer;
    PlayerService.prototype.deletePlayer = mockDeletePlayer;
    PlayerService.prototype.getPlayersByTeamId = mockGetPlayersByTeamId;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPlayer', () => {
    it('should create a player and return 201 status', async () => {
      mockCreatePlayer.mockResolvedValue(savedPlayer);

      req = {
        body: {
          name: 'John Doe',
          position: 'Forward',
          teamId: mockTeam.id,
        },
      };

      await playerController.createPlayer(req as Request, res as Response, next as NextFunction);

      expect(mockCreatePlayer).toHaveBeenCalledWith('John Doe', 'Forward', mockTeam.id);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(savedPlayer);
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward validation errors to error handler', async () => {
      const validationError = new MissingFieldError('Player name is required');
      mockCreatePlayer.mockRejectedValue(validationError);

      req = {
        body: {
          name: '',
          position: 'Forward',
          teamId: mockTeam.id,
        },
      };

      await playerController.createPlayer(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(validationError);
    });

    it('should forward server errors to error handler', async () => {
      const serverError = new Error('Server error');
      mockCreatePlayer.mockRejectedValue(serverError);

      req = {
        body: {
          name: 'John Doe',
          position: 'Forward',
          teamId: mockTeam.id,
        },
      };

      await playerController.createPlayer(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(serverError);
    });
  });

  describe('getPlayers', () => {
    it('should fetch all players and return 200 status', async () => {
      mockGetAllPlayers.mockResolvedValue([mockPlayers, mockPlayers.length]);

      req = { query: {} };

      await playerController.getPlayers(req as Request, res as Response, next as NextFunction);

      expect(mockGetAllPlayers).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward fetch errors to error handler', async () => {
      const fetchError = new Error('Failed to fetch players');
      mockGetAllPlayers.mockRejectedValue(fetchError);

      req = { query: {} };

      await playerController.getPlayers(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(fetchError);
    });
  });

  describe('getPlayerById', () => {
    it('should return a player by ID', async () => {
      mockGetPlayerById.mockResolvedValue(mockPlayer);

      req = { params: { id: '1' }, query: {} };

      await playerController.getPlayerById(req as Request, res as Response, next as NextFunction);

      expect(mockGetPlayerById).toHaveBeenCalledWith(1, undefined);
      expect(res.json).toHaveBeenCalledWith(mockPlayer);
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward not found errors to error handler', async () => {
      const notFoundError = new NotFoundError('Player not found');
      mockGetPlayerById.mockRejectedValue(notFoundError);

      req = { params: { id: '999' }, query: {} };

      await playerController.getPlayerById(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(notFoundError);
    });

    it('should forward server errors to error handler', async () => {
      const serverError = new Error('Server error');
      mockGetPlayerById.mockRejectedValue(serverError);

      req = { params: { id: '1' }, query: {} };

      await playerController.getPlayerById(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(serverError);
    });
  });

  describe('updatePlayer', () => {
    it('should update a player and return 200 status', async () => {
      mockUpdatePlayer.mockResolvedValue(savedPlayer);

      req = {
        params: { id: '1' },
        body: {
          name: 'Updated Player',
          position: 'Defender',
          teamId: mockTeam.id,
        },
      };

      await playerController.updatePlayer(req as Request, res as Response, next as NextFunction);

      expect(mockUpdatePlayer).toHaveBeenCalledWith(1, req.body);
      expect(res.json).toHaveBeenCalledWith(savedPlayer);
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward validation errors to error handler', async () => {
      const validationError = new MissingFieldError('Player name is required');
      mockUpdatePlayer.mockRejectedValue(validationError);

      req = {
        params: { id: '1' },
        body: {
          name: '',
          position: 'Defender',
          teamId: mockTeam.id,
        },
      };

      await playerController.updatePlayer(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(validationError);
    });

    it('should forward server errors to error handler', async () => {
      const serverError = new Error('Server error');
      mockUpdatePlayer.mockRejectedValue(serverError);

      req = {
        params: { id: '1' },
        body: {
          name: 'Updated Player',
          position: 'Defender',
          teamId: mockTeam.id,
        },
      };

      await playerController.updatePlayer(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(serverError);
    });
  });

  describe('deletePlayer', () => {
    it('should delete a player and return 204 status', async () => {
      mockDeletePlayer.mockResolvedValue(undefined);

      req = { params: { id: '1' } };

      await playerController.deletePlayer(req as Request, res as Response, next as NextFunction);

      expect(mockDeletePlayer).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward not found errors to error handler', async () => {
      const notFoundError = new NotFoundError('Player not found');
      mockDeletePlayer.mockRejectedValue(notFoundError);

      req = { params: { id: '999' } };

      await playerController.deletePlayer(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(notFoundError);
    });

    it('should forward server errors to error handler', async () => {
      const serverError = new Error('Server error');
      mockDeletePlayer.mockRejectedValue(serverError);

      req = { params: { id: '1' } };

      await playerController.deletePlayer(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(serverError);
    });
  });

  describe('getPlayersByTeamId', () => {
    it('should return players by team ID', async () => {
      mockGetPlayersByTeamId.mockResolvedValue([mockPlayers, mockPlayers.length]);

      req = { params: { teamId: '1' }, query: {} };

      await playerController.getPlayersByTeamId(req as Request, res as Response, next as NextFunction);

      expect(mockGetPlayersByTeamId).toHaveBeenCalledWith(1, expect.objectContaining({ page: 1, limit: 25 }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: mockPlayers,
        total: mockPlayers.length,
        page: 1,
        limit: 25,
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if no players are found for the team', async () => {
      mockGetPlayersByTeamId.mockResolvedValue([[], 0]);

      req = { params: { teamId: '999' }, query: {} };

      await playerController.getPlayersByTeamId(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'No players found for the specified team' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward server errors to error handler', async () => {
      const serverError = new Error('Server error');
      mockGetPlayersByTeamId.mockRejectedValue(serverError);

      req = { params: { teamId: '1' }, query: {} };

      await playerController.getPlayersByTeamId(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(serverError);
    });
  });
});
