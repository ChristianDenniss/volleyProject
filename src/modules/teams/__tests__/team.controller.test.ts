import { Request, Response } from 'express';
import { TeamController } from '../team.controller';

// Mock data
const mockSeason = {
  id: 1,
  name: 'Season 2024',
  year: 2024,
  teams: [],
  games: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockTeam = {
  id: 1,
  name: 'Test Team',
  season: mockSeason,
  players: [],
  games: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockTeams = [
  mockTeam,
  {
    id: 2,
    name: 'Another Team',
    season: mockSeason,
    players: [],
    games: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Mock the TeamService
jest.mock('../team.service', () => {
  return {
    TeamService: jest.fn().mockImplementation(() => {
      return {
        createTeam: jest.fn(),
        getAllTeams: jest.fn(),
        getTeamById: jest.fn(),
        updateTeam: jest.fn(), 
        deleteTeam: jest.fn(),
        getTeamsBySeasonId: jest.fn()
      };
    })
  };
});

describe('TeamController', () => {
  let teamController;
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

    teamController = new TeamController();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTeam', () => {
    it('should create a team and return 201 status', async () => {
      mockRequest.body = {
        name: 'New Team',
        seasonId: 1,
      };
      teamController.teamService.createTeam.mockResolvedValueOnce(mockTeam);

      await teamController.createTeam(mockRequest, mockResponse);

      expect(teamController.teamService.createTeam).toHaveBeenCalledWith('New Team', 1, undefined, undefined);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockTeam);
    });

    it('should handle validation errors with 400 status', async () => {
      mockRequest.body = {
        name: 'New Team',
        seasonId: 1,
      };
      teamController.teamService.createTeam.mockRejectedValueOnce(new Error('Team name and season ID are required'));

      await teamController.createTeam(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Team name and season ID are required' });
    });

    it('should handle server errors with 500 status', async () => {
      mockRequest.body = {
        name: 'New Team',
        seasonId: 1,
      };
      teamController.teamService.createTeam.mockRejectedValueOnce(new Error('Database error'));

      await teamController.createTeam(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to create team' });
    });
  });

  describe('getTeams', () => {
    it('should return all teams', async () => {
      teamController.teamService.getAllTeams.mockResolvedValueOnce(mockTeams);

      await teamController.getTeams(mockRequest, mockResponse);

      expect(teamController.teamService.getAllTeams).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(mockTeams);
    });

    it('should handle server errors with 500 status', async () => {
      teamController.teamService.getAllTeams.mockRejectedValueOnce(new Error('Database error'));

      await teamController.getTeams(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch teams' });
    });
  });

  describe('getTeamById', () => {
    it('should return a team by id', async () => {
      mockRequest.params = { id: '1' };
      teamController.teamService.getTeamById.mockResolvedValueOnce(mockTeam);

      await teamController.getTeamById(mockRequest, mockResponse);

      expect(teamController.teamService.getTeamById).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith(mockTeam);
    });

    it('should handle not found errors with 404 status', async () => {
      mockRequest.params = { id: '999' };
      teamController.teamService.getTeamById.mockRejectedValueOnce(new Error('Team not found'));

      await teamController.getTeamById(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Team not found' });
    });

    it('should handle server errors with 500 status', async () => {
      mockRequest.params = { id: '1' };
      teamController.teamService.getTeamById.mockRejectedValueOnce(new Error('Database error'));

      await teamController.getTeamById(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch team' });
    });
  });

  describe('updateTeam', () => {
    it('should update a team and return the updated team', async () => {
      const updatedTeam = { ...mockTeam, name: 'Updated Team Name' };
      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'Updated Team Name' };
      teamController.teamService.updateTeam.mockResolvedValueOnce(updatedTeam);

      await teamController.updateTeam(mockRequest, mockResponse);

      expect(teamController.teamService.updateTeam).toHaveBeenCalledWith(1, 'Updated Team Name', undefined, undefined, undefined);
      expect(jsonMock).toHaveBeenCalledWith(updatedTeam);
    });

    it('should handle not found errors with 404 status', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { name: 'Updated Team Name' };
      teamController.teamService.updateTeam.mockRejectedValueOnce(new Error('Team not found'));

      await teamController.updateTeam(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Team not found' });
    });

    it('should handle not found errors with 404 status', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { seasonId: 999 };
      teamController.teamService.updateTeam.mockRejectedValueOnce(new Error('Season not found'));

      await teamController.updateTeam(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Season not found' });
    });

    it('should handle server errors with 500 status', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'Updated Team Name' };
      teamController.teamService.updateTeam.mockRejectedValueOnce(new Error('Database error'));

      await teamController.updateTeam(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to update team' });
    });
  });

  describe('deleteTeam', () => {
    it('should delete a team and return 204 status', async () => {
      mockRequest.params = { id: '1' };
      teamController.teamService.deleteTeam.mockResolvedValueOnce();

      await teamController.deleteTeam(mockRequest, mockResponse);

      expect(teamController.teamService.deleteTeam).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it('should handle not found errors with 404 status', async () => {
      mockRequest.params = { id: '999' };
      teamController.teamService.deleteTeam.mockRejectedValueOnce(new Error('Team not found'));

      await teamController.deleteTeam(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Team not found' });
    });

    it('should handle server errors with 500 status', async () => {
      mockRequest.params = { id: '1' };
      teamController.teamService.deleteTeam.mockRejectedValueOnce(new Error('Database error'));

      await teamController.deleteTeam(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to delete team' });
    });
  });

  describe('getTeamsBySeasonId', () => {
    it('should return teams by season id', async () => {
      mockRequest.params = { seasonId: '1' };
      teamController.teamService.getTeamsBySeasonId.mockResolvedValueOnce(mockTeams);

      await teamController.getTeamsBySeasonId(mockRequest, mockResponse);

      expect(teamController.teamService.getTeamsBySeasonId).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith(mockTeams);
    });

    it('should handle when no teams are found with 404 status', async () => {
      mockRequest.params = { seasonId: '1' };
      teamController.teamService.getTeamsBySeasonId.mockResolvedValueOnce([]);

      await teamController.getTeamsBySeasonId(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'No teams found for the specified season' });
    });

    it('should handle validation errors with 400 status', async () => {
      mockRequest.params = { seasonId: '999' };
      teamController.teamService.getTeamsBySeasonId.mockRejectedValueOnce(new Error('Season not found'));

      await teamController.getTeamsBySeasonId(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Season not found' });
    });

    it('should handle server errors with 500 status', async () => {
      mockRequest.params = { seasonId: '1' };
      teamController.teamService.getTeamsBySeasonId.mockRejectedValueOnce(new Error('Database error'));

      await teamController.getTeamsBySeasonId(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch teams by season' });
    });
  });
});