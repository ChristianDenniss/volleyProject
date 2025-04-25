import { Application, Router } from 'express';
import { TeamController } from './team.controller.js';

export function registerTeamRoutes(app: Application): void {
    const router = Router();
    const teamController = new TeamController();

    // Team routes
    router.post('/', teamController.createTeam);
    // Batch creation for multiple teams
    router.post('/batch', teamController.createMultipleTeams);  
    router.get('/', teamController.getTeams);
    router.get('/:id', teamController.getTeamById);
    router.put('/:id', teamController.updateTeam);
    router.patch('/:id', teamController.updateTeam);
    router.delete('/:id', teamController.deleteTeam);
    router.get('/season/:seasonId', teamController.getTeamsBySeasonId);
    
    
    // get a teams players using the teams name
    router.get('/name/:name/players', teamController.getTeamPlayersByName);

    // Route for getting players of a specific team
    router.get('/:teamId/players', teamController.getTeamPlayers);

    // Register router with prefix
    app.use('/api/teams', router);
} 