import { PlayerController } from '../player.controller';
import { PlayerService } from '../player.service';
import { mockRepository, mockPlayer, savedPlayer, mockPlayers, mockTeam, mockUser } from '../../../__mocks__/fixtures';
import { Request, Response } from 'express';

// Mock PlayerService
jest.mock('./player.service');
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

  beforeEach(() => {
    // Set up a new instance of PlayerController before each test
    playerController = new PlayerController();
    // Mock the response object methods
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    // Mock PlayerService methods
    PlayerService.prototype.createPlayer = mockCreatePlayer;
    PlayerService.prototype.getAllPlayers = mockGetAllPlayers;
    PlayerService.prototype.getPlayerById = mockGetPlayerById;
    PlayerService.prototype.updatePlayer = mockUpdatePlayer;
    PlayerService.prototype.deletePlayer = mockDeletePlayer;
    PlayerService.prototype.getPlayersByTeamId = mockGetPlayersByTeamId;
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test to prevent interference
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

      await playerController.createPlayer(req as Request, res as Response);

      expect(mockCreatePlayer).toHaveBeenCalledWith('John Doe', 'Forward', mockTeam.id);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(savedPlayer);
    });

    it('should return 400 if validation error occurs', async () => {
      mockCreatePlayer.mockRejectedValue(new Error('Player name is required'));

      req = {
        body: {
          name: '',
          position: 'Forward',
          teamId: mockTeam.id,
        },
      };

      await playerController.createPlayer(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Player name is required' });
    });

    it('should return 500 for server error', async () => {
      mockCreatePlayer.mockRejectedValue(new Error('Server error'));

      req = {
        body: {
          name: 'John Doe',
          position: 'Forward',
          teamId: mockTeam.id,
        },
      };

      await playerController.createPlayer(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create player' });
    });
  });

  describe('getPlayers', () => {
    it('should fetch all players and return 200 status', async () => {
      mockGetAllPlayers.mockResolvedValue(mockPlayers);

      req = {}; // No params needed for getAllPlayers

      await playerController.getPlayers(req as Request, res as Response);

      expect(mockGetAllPlayers).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockPlayers);
    });

    it('should return 500 if fetching players fails', async () => {
      mockGetAllPlayers.mockRejectedValue(new Error('Failed to fetch players'));

      req = {}; // No params needed for getAllPlayers

      await playerController.getPlayers(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch players' });
    });
  });

  describe('getPlayerById', () => {
    it('should return a player by ID', async () => {
      mockGetPlayerById.mockResolvedValue(mockPlayer);

      req = { params: { id: '1' } };

      await playerController.getPlayerById(req as Request, res as Response);

      expect(mockGetPlayerById).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockPlayer);
    });

    it('should return 404 if player not found', async () => {
      mockGetPlayerById.mockResolvedValue(null);

      req = { params: { id: '999' } };

      await playerController.getPlayerById(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch player' });
    });

    it('should return 500 for server error', async () => {
      mockGetPlayerById.mockRejectedValue(new Error('Server error'));

      req = { params: { id: '1' } };

      await playerController.getPlayerById(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch player' });
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

      await playerController.updatePlayer(req as Request, res as Response);

      expect(mockUpdatePlayer).toHaveBeenCalledWith(1, 'Updated Player', 'Defender', mockTeam.id);
      expect(res.json).toHaveBeenCalledWith(savedPlayer);
    });

    it('should return 404 if player not found for update', async () => {
      mockUpdatePlayer.mockResolvedValue(null);

      req = {
        params: { id: '999' },
        body: {
          name: 'Updated Player',
          position: 'Defender',
          teamId: mockTeam.id,
        },
      };

      await playerController.updatePlayer(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update player' });
    });

    it('should return 400 if validation error occurs during update', async () => {
      mockUpdatePlayer.mockRejectedValue(new Error('Player name is required'));

      req = {
        params: { id: '1' },
        body: {
          name: '',
          position: 'Defender',
          teamId: mockTeam.id,
        },
      };

      await playerController.updatePlayer(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Player name is required' });
    });

    it('should return 500 for server error during update', async () => {
      mockUpdatePlayer.mockRejectedValue(new Error('Server error'));

      req = {
        params: { id: '1' },
        body: {
          name: 'Updated Player',
          position: 'Defender',
          teamId: mockTeam.id,
        },
      };

      await playerController.updatePlayer(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update player' });
    });
  });

  describe('deletePlayer', () => {
    it('should delete a player and return 204 status', async () => {
      mockDeletePlayer.mockResolvedValue(undefined);

      req = { params: { id: '1' } };

      await playerController.deletePlayer(req as Request, res as Response);

      expect(mockDeletePlayer).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 404 if player not found for deletion', async () => {
      mockDeletePlayer.mockRejectedValue(new Error('Player not found'));

      req = { params: { id: '999' } };

      await playerController.deletePlayer(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Player not found' });
    });

    it('should return 500 for server error during deletion', async () => {
      mockDeletePlayer.mockRejectedValue(new Error('Server error'));

      req = { params: { id: '1' } };

      await playerController.deletePlayer(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete player' });
    });
  });

  describe('getPlayersByTeamId', () => {
    it('should return players by team ID', async () => {
      mockGetPlayersByTeamId.mockResolvedValue(mockPlayers);

      req = { params: { teamId: '1' } };

      await playerController.getPlayersByTeamId(req as Request, res as Response);

      expect(mockGetPlayersByTeamId).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockPlayers);
    });

    it('should return 404 if no players are found for the team', async () => {
      mockGetPlayersByTeamId.mockResolvedValue([]);

      req = { params: { teamId: '999' } };

      await playerController.getPlayersByTeamId(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'No players found for the specified team' });
    });

    it('should return 500 for server error when fetching players by team', async () => {
      mockGetPlayersByTeamId.mockRejectedValue(new Error('Server error'));

      req = { params: { teamId: '1' } };

      await playerController.getPlayersByTeamId(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch players by team' });
    });
  });
});
