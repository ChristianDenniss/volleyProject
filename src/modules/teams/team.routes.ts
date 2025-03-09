import { Application, Router } from 'express';
import { TeamController } from './team.controller';

export function registerTeamRoutes(app: Application): void {
    const router = Router();
    const teamController = new TeamController();

    // Team routes
    router.post('/', teamController.createTeam);
    router.get('/', teamController.getTeams);
    router.get('/:id', teamController.getTeamById);
    router.put('/:id', teamController.updateTeam);
    router.delete('/:id', teamController.deleteTeam);
    router.get('/season/:seasonId', teamController.getTeamsBySeasonId);

    // Register router with prefix
    app.use('/api/teams', router);
}