import { GameController } from '../game.controller.js';
import { GameService } from '../game.service.js';
import { mockGame, savedGame, mockGames, mockPlayer, mockTeam } from '../../../__mocks__/fixtures.js';
import { Request, Response } from 'express';
import { MissingFieldError } from '../../../errors/MissingFieldError.js';
import { NotFoundError } from '../../../errors/NotFoundError.js';
import { ConflictError } from '../../../errors/ConflictError.js';
import { DuplicateError } from '../../../errors/DuplicateError.js';
import { DateError } from '../../../errors/DateErrors.js';
import { InvalidFormatError } from '../../../errors/InvalidFormatError.js';

// Mock GameService
jest.mock('./game.service');
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

  beforeEach(() => {
    // Set up a new instance of GameController before each test
    gameController = new GameController();
    // Mock the response object methods
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    // Mock GameService methods
    GameService.prototype.createGame = mockCreateGame;
    GameService.prototype.getAllGames = mockGetAllGames;
    GameService.prototype.getGameById = mockGetGameById;
    GameService.prototype.updateGame = mockUpdateGame;
    GameService.prototype.deleteGame = mockDeleteGame;
    GameService.prototype.getGamesByTeamId = mockGetGamesByTeamId;
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test to prevent interference
  });

  describe('createGame', () => {
    it('should create a game and return 201 status', async () => {
      mockCreateGame.mockResolvedValue(savedGame);

      req = {
        body: {
          date: '2025-01-01',
          seasonId: '1',
          teamIds: [mockTeam.id, mockTeam.id],
          homeScore: '2',
          awayScore: '1',
        },
      };

      await gameController.createGame(req as Request, res as Response);

      expect(mockCreateGame).toHaveBeenCalledWith('2025-01-01', '1', [mockTeam.id, mockTeam.id], '2', '1');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(savedGame);
    });

    it('should return 400 if validation error occurs', async () => {
      mockCreateGame.mockRejectedValue(new MissingFieldError('Score is required'));

      req = {
        body: {
          date: '2025-01-01',
          seasonId: '1',
          teamIds: [mockTeam.id, mockTeam.id],
          homeScore: '',
          awayScore: '',
        },
      };

      await gameController.createGame(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Score is required' });
    });

    it('should return 500 for server error', async () => {
      mockCreateGame.mockRejectedValue(new Error('Server error'));

      req = {
        body: {
          date: '2025-01-01',
          seasonId: '1',
          teamIds: [mockTeam.id, mockTeam.id],
          homeScore: '2',
          awayScore: '1',
        },
      };

      await gameController.createGame(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create game' });
    });
  });

  describe('getGames', () => {
    it('should fetch all games and return 200 status', async () => {
      mockGetAllGames.mockResolvedValue(mockGames);

      req = {}; // No params needed for getAllGames

      await gameController.getGames(req as Request, res as Response);

      expect(mockGetAllGames).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockGames);
    });

    it('should return 500 if fetching games fails', async () => {
      mockGetAllGames.mockRejectedValue(new Error('Failed to fetch games'));

      req = {}; // No params needed for getAllGames

      await gameController.getGames(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch games' });
    });
  });

  describe('getGameById', () => {
    it('should return a game by ID', async () => {
      mockGetGameById.mockResolvedValue(mockGame);

      req = { params: { id: '1' } };

      await gameController.getGameById(req as Request, res as Response);

      expect(mockGetGameById).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockGame);
    });

    it('should return 404 if game not found', async () => {
      mockGetGameById.mockResolvedValue(null);

      req = { params: { id: '999' } };

      await gameController.getGameById(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch game' });
    });

    it('should return 500 for server error', async () => {
      mockGetGameById.mockRejectedValue(new Error('Server error'));

      req = { params: { id: '1' } };

      await gameController.getGameById(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch game' });
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
          homeScore: '3',
          awayScore: '2',
        },
      };

      await gameController.updateGame(req as Request, res as Response);

      expect(mockUpdateGame).toHaveBeenCalledWith(1, '2025-01-02', '1', [mockTeam.id, mockTeam.id], '3', '2');
      expect(res.json).toHaveBeenCalledWith(savedGame);
    });

    it('should return 404 if game not found for update', async () => {
      mockUpdateGame.mockResolvedValue(null);

      req = {
        params: { id: '999' },
        body: {
          date: '2025-01-02',
          seasonId: '1',
          teamIds: [mockTeam.id, mockTeam.id],
          homeScore: '3',
          awayScore: '2',
        },
      };

      await gameController.updateGame(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update game' });
    });

    it('should return 400 if validation error occurs during update', async () => {
      mockUpdateGame.mockRejectedValue(new MissingFieldError('Score is required'));

      req = {
        params: { id: '1' },
        body: {
          date: '2025-01-02',
          seasonId: '1',
          teamIds: [mockTeam.id, mockTeam.id],
          homeScore: '',
          awayScore: '',
        },
      };

      await gameController.updateGame(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Score is required' });
    });

    it('should return 500 for server error during update', async () => {
      mockUpdateGame.mockRejectedValue(new Error('Server error'));

      req = {
        params: { id: '1' },
        body: {
          date: '2025-01-02',
          seasonId: '1',
          teamIds: [mockTeam.id, mockTeam.id],
          homeScore: '3',
          awayScore: '2',
        },
      };

      await gameController.updateGame(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update game' });
    });
  });

  describe('deleteGame', () => {
    it('should delete a game and return 204 status', async () => {
      mockDeleteGame.mockResolvedValue(undefined);

      req = { params: { id: '1' } };

      await gameController.deleteGame(req as Request, res as Response);

      expect(mockDeleteGame).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 404 if game not found for deletion', async () => {
      mockDeleteGame.mockResolvedValue(null);

      req = { params: { id: '999' } };

      await gameController.deleteGame(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete game' });
    });

    it('should return 500 for server error during deletion', async () => {
      mockDeleteGame.mockRejectedValue(new Error('Server error'));

      req = { params: { id: '1' } };

      await gameController.deleteGame(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete game' });
    });
  });

  describe('getGamesByTeamId', () => {
    it('should return all games for a specific team', async () => {
      mockGetGamesByTeamId.mockResolvedValue(mockGames);

      // Convert teamId to string
      req = { params: { teamId: '1' } };

      await gameController.getGamesByTeamId(req as Request, res as Response);

      expect(mockGetGamesByTeamId).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockGames);
    });

    it('should return 404 if no games are found for team', async () => {
      mockGetGamesByTeamId.mockResolvedValue([]);

      req = { params: { teamId: '1' } };

      await gameController.getGamesByTeamId(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'No games found for team' });
    });

    it('should return 500 for server error', async () => {
      mockGetGamesByTeamId.mockRejectedValue(new Error('Server error'));

      req = { params: { teamId: '1' } };

      await gameController.getGamesByTeamId(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch games by team' });
    });
  });
});
