import { Application, Router } from 'express';
import { StatController } from './stat.controller';

export function registerStatRoutes(app: Application): void {
    const router = Router();
    const statController = new StatController();

    // Stat routes
    router.post('/', statController.createStat);
    router.get('/', statController.getStats);
    router.get('/:id', statController.getStatById);
    router.put('/:id', statController.updateStat);
    router.delete('/:id', statController.deleteStat);
    router.get('/player/:playerId', statController.getStatsByPlayerId);
    router.get('/game/:gameId', statController.getStatsByGameId);

    // Register router with prefix
    app.use('/api/stats', router);
}