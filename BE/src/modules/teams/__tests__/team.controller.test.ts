import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TeamController } from '../team.controller.js';
import { TeamService } from '../team.service.js';
import { MissingFieldError } from '../../../errors/MissingFieldError.js';
import { NotFoundError } from '../../../errors/NotFoundError.js';

const mockTeam = {
  id: 1,
  name: 'Test Team',
  members: ['user1', 'user2'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTeams = [
  mockTeam,
  {
    id: 2,
    name: 'Another Team',
    members: ['user3', 'user4'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockCreateTeam = jest.fn();
const mockGetAllTeams = jest.fn();
const mockGetTeamById = jest.fn();
const mockUpdateTeam = jest.fn();
const mockDeleteTeam = jest.fn();

describe('TeamController', () => {
  let teamController;
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

    TeamService.prototype.createTeam = mockCreateTeam;
    TeamService.prototype.getAllTeams = mockGetAllTeams;
    TeamService.prototype.getTeamById = mockGetTeamById;
    TeamService.prototype.updateTeam = mockUpdateTeam;
    TeamService.prototype.deleteTeam = mockDeleteTeam;

    teamController = new TeamController();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTeam', () => {
    it('should create a team and return 201 status', async () => {
      mockRequest.body = {
        name: 'New Team',
        seasonNumber: 1,
      };
      mockCreateTeam.mockResolvedValueOnce(mockTeam);

      await teamController.createTeam(mockRequest, mockResponse, next);

      expect(mockCreateTeam).toHaveBeenCalledWith(mockRequest.body);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockTeam);
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward validation errors to error handler', async () => {
      const validationError = new MissingFieldError('Team name is required');
      mockRequest.body = { name: '', seasonNumber: 1 };
      mockCreateTeam.mockRejectedValueOnce(validationError);

      await teamController.createTeam(mockRequest, mockResponse, next);

      expect(next).toHaveBeenCalledWith(validationError);
    });

    it('should forward server errors to error handler', async () => {
      const serverError = new Error('Database error');
      mockRequest.body = { name: 'New Team', seasonNumber: 1 };
      mockCreateTeam.mockRejectedValueOnce(serverError);

      await teamController.createTeam(mockRequest, mockResponse, next);

      expect(next).toHaveBeenCalledWith(serverError);
    });
  });

  describe('getTeams', () => {
    it('should return all teams', async () => {
      mockRequest.query = {};
      mockGetAllTeams.mockResolvedValueOnce([mockTeams, mockTeams.length]);

      await teamController.getTeams(mockRequest, mockResponse, next);

      expect(mockGetAllTeams).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward server errors to error handler', async () => {
      const serverError = new Error('Database error');
      mockRequest.query = {};
      mockGetAllTeams.mockRejectedValueOnce(serverError);

      await teamController.getTeams(mockRequest, mockResponse, next);

      expect(next).toHaveBeenCalledWith(serverError);
    });
  });

  describe('getTeamById', () => {
    it('should return a team by id', async () => {
      mockRequest.params = { id: '1' };
      mockGetTeamById.mockResolvedValueOnce(mockTeam);

      await teamController.getTeamById(mockRequest, mockResponse, next);

      expect(mockGetTeamById).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith(mockTeam);
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward not found errors to error handler', async () => {
      const notFoundError = new NotFoundError('Team not found');
      mockRequest.params = { id: '999' };
      mockGetTeamById.mockRejectedValueOnce(notFoundError);

      await teamController.getTeamById(mockRequest, mockResponse, next);

      expect(next).toHaveBeenCalledWith(notFoundError);
    });

    it('should forward server errors to error handler', async () => {
      const serverError = new Error('Database error');
      mockRequest.params = { id: '1' };
      mockGetTeamById.mockRejectedValueOnce(serverError);

      await teamController.getTeamById(mockRequest, mockResponse, next);

      expect(next).toHaveBeenCalledWith(serverError);
    });
  });

  describe('updateTeam', () => {
    it('should update a team and return the updated team', async () => {
      const updatedTeam = { ...mockTeam, name: 'Updated Team' };
      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'Updated Team' };
      mockUpdateTeam.mockResolvedValueOnce(updatedTeam);

      await teamController.updateTeam(mockRequest, mockResponse, next);

      expect(mockUpdateTeam).toHaveBeenCalledWith(1, mockRequest.body);
      expect(jsonMock).toHaveBeenCalledWith(updatedTeam);
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward not found errors to error handler', async () => {
      const notFoundError = new NotFoundError('Team not found');
      mockRequest.params = { id: '999' };
      mockRequest.body = { name: 'Updated Team' };
      mockUpdateTeam.mockRejectedValueOnce(notFoundError);

      await teamController.updateTeam(mockRequest, mockResponse, next);

      expect(next).toHaveBeenCalledWith(notFoundError);
    });

    it('should forward server errors to error handler', async () => {
      const serverError = new Error('Database error');
      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'Updated Team' };
      mockUpdateTeam.mockRejectedValueOnce(serverError);

      await teamController.updateTeam(mockRequest, mockResponse, next);

      expect(next).toHaveBeenCalledWith(serverError);
    });
  });

  describe('deleteTeam', () => {
    it('should delete a team and return 204 status', async () => {
      mockRequest.params = { id: '1' };
      mockDeleteTeam.mockResolvedValueOnce();

      await teamController.deleteTeam(mockRequest, mockResponse, next);

      expect(mockDeleteTeam).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward not found errors to error handler', async () => {
      const notFoundError = new NotFoundError('Team not found');
      mockRequest.params = { id: '999' };
      mockDeleteTeam.mockRejectedValueOnce(notFoundError);

      await teamController.deleteTeam(mockRequest, mockResponse, next);

      expect(next).toHaveBeenCalledWith(notFoundError);
    });

    it('should forward server errors to error handler', async () => {
      const serverError = new Error('Database error');
      mockRequest.params = { id: '1' };
      mockDeleteTeam.mockRejectedValueOnce(serverError);

      await teamController.deleteTeam(mockRequest, mockResponse, next);

      expect(next).toHaveBeenCalledWith(serverError);
    });
  });
});
