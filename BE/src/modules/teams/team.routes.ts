import { Application, Router } from 'express';
import { validate } from '../../middleware/validate.ts';
import { createTeamSchema, updateTeamSchema } from './teams.schema.ts';
import { TeamController } from './team.controller.ts';

export function registerTeamRoutes(app: Application): void {
    const router = Router();
    const teamController = new TeamController();

    // Team routes
    router.post('/', validate(createTeamSchema), teamController.createTeam);
    // Batch creation for multiple teams
    router.post('/batch', validate(createTeamSchema), teamController.createMultipleTeams);  
    router.get('/', teamController.getTeams);
    router.get('/skinny', teamController.getSkinnyTeams);
    router.get('/medium', teamController.getMediumTeams);
    router.get('/:id', teamController.getTeamById);
    router.put('/:id', validate(updateTeamSchema), teamController.updateTeam);
    router.patch('/:id', validate(updateTeamSchema), teamController.updateTeam);
    router.delete('/:id', teamController.deleteTeam);
    router.get('/season/:seasonId', teamController.getTeamsBySeasonId);
    
    
    // get a teams players using the teams name
    router.get('/name/:name/players', teamController.getTeamPlayersByName);

    // Route for getting players of a specific team
    router.get('/:teamId/players', teamController.getTeamPlayers);
    
    router.get('/name/:name', teamController.getTeamsByName.bind(teamController));

    // Register router with prefix
    app.use('/api/teams', router);
} 