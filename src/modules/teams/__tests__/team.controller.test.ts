import { Request, Response } from 'express';
import { TeamController } from '../../modules/team/team.controller';
import { TeamService } from '../../modules/teams/team.service.ts';

jest.mock('../services/teamService');

const mockError = (errorMsg: string) => jest.fn().mockRejectedValueOnce(new Error(errorMsg));

const getMockResponse = () =>
{
    const jsonMock = jest.fn().mockReturnThis();
    const sendMock = jest.fn().mockReturnThis();
    const statusMock = jest.fn().mockReturnValue({ json: jsonMock, send: sendMock });

    return {
        json: jsonMock,
        status: statusMock,
        send: sendMock,
    } as unknown as Response;
};

describe('TeamController', () =>
{
    let teamController: TeamController;
    let teamService: jest.Mocked<TeamService>;

    beforeEach(() =>
    {
        teamService = new TeamService() as jest.Mocked<TeamService>;
        teamController = new TeamController(teamService);
    });

    describe('getTeamById', () =>
    {
        it('should return a team if found', async () =>
        {
            const mockTeam = { id: 1, name: 'Team A' };
            teamService.getTeamById.mockResolvedValue(mockTeam);

            const req = { params: { id: '1' } } as Partial<Request>;
            const res = getMockResponse();

            await teamController.getTeamById(req as Request, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockTeam);
        });

        it('should return 404 if team is not found', async () =>
        {
            teamService.getTeamById.mockResolvedValue(null);

            const req = { params: { id: '999' } } as Partial<Request>;
            const res = getMockResponse();

            await teamController.getTeamById(req as Request, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Team not found' });
        });

        it('should return 500 on error', async () =>
        {
            teamService.getTeamById = mockError('Database error');

            const req = { params: { id: '1' } } as Partial<Request>;
            const res = getMockResponse();

            await teamController.getTeamById(req as Request, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
    });

    describe('createTeam', () =>
    {
        it('should create a team', async () =>
        {
            const mockTeam = { id: 1, name: 'New Team' };
            teamService.createTeam.mockResolvedValue(mockTeam);

            const req = { body: { name: 'New Team', seasonId: 1 } } as Partial<Request>;
            const res = getMockResponse();

            await teamController.createTeam(req as Request, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockTeam);
        });

        it('should return 400 if missing required fields', async () =>
        {
            const req = { body: { name: 'New Team' } } as Partial<Request>; // Missing seasonId
            const res = getMockResponse();

            await teamController.createTeam(req as Request, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
        });

        it('should return 500 on error', async () =>
        {
            teamService.createTeam = mockError('Database error');

            const req = { body: { name: 'New Team', seasonId: 1 } } as Partial<Request>;
            const res = getMockResponse();

            await teamController.createTeam(req as Request, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
    });

    describe('updateTeam', () =>
    {
        it('should update a team if found', async () =>
        {
            const mockTeam = { id: 1, name: 'Updated Team' };
            teamService.updateTeam.mockResolvedValue(mockTeam);

            const req = { params: { id: '1' }, body: { name: 'Updated Team' } } as Partial<Request>;
            const res = getMockResponse();

            await teamController.updateTeam(req as Request, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockTeam);
        });

        it('should return 400 if no valid fields provided', async () =>
        {
            const req = { params: { id: '1' }, body: {} } as Partial<Request>;
            const res = getMockResponse();

            await teamController.updateTeam(req as Request, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'No valid fields to update' });
        });

        it('should return 404 if team is not found', async () =>
        {
            teamService.updateTeam.mockResolvedValue(null);

            const req = { params: { id: '999' }, body: { name: 'Updated Team' } } as Partial<Request>;
            const res = getMockResponse();

            await teamController.updateTeam(req as Request, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Team not found' });
        });

        it('should return 500 on error', async () =>
        {
            teamService.updateTeam = mockError('Database error');

            const req = { params: { id: '1' }, body: { name: 'Updated Team' } } as Partial<Request>;
            const res = getMockResponse();

            await teamController.updateTeam(req as Request, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
    });

    describe('deleteTeam', () =>
    {
        it('should delete a team if found', async () =>
        {
            teamService.deleteTeam.mockResolvedValue(true);

            const req = { params: { id: '1' } } as Partial<Request>;
            const res = getMockResponse();

            await teamController.deleteTeam(req as Request, res);

            expect(res.status).toHaveBeenCalledWith(204);
        });

        it('should return 404 if team is not found', async () =>
        {
            teamService.deleteTeam.mockResolvedValue(false);

            const req = { params: { id: '999' } } as Partial<Request>;
            const res = getMockResponse();

            await teamController.deleteTeam(req as Request, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Team not found' });
        });

        it('should return 500 on error', async () =>
        {
            teamService.deleteTeam = mockError('Database error');

            const req = { params: { id: '1' } } as Partial<Request>;
            const res = getMockResponse();

            await teamController.deleteTeam(req as Request, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
    });
});
