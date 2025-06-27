import { Application, Router } from 'express';
import { StatController } from './stat.controller.js';
import { validate } from '../../middleware/validate.js';
import { createStatSchema, updateStatSchema, createStatByNameSchema } from './stat.schema.js';

export function registerStatRoutes(app: Application): void {
    const router = Router();
    const statController = new StatController();

    // Stat routes
    router.post('/', validate(createStatSchema), statController.createStat);
    router.post('/by-name', validate(createStatByNameSchema), statController.createStatByName);
    router.post('/batch-csv', statController.batchUploadFromCSV);
    router.post('/add-to-game', statController.addStatsToExistingGame);
    router.get('/', statController.getStats);
    router.get('/player/:playerId', statController.getStatsByPlayerId);
    router.get('/game/:gameId', statController.getStatsByGameId);
    router.get('/:id', statController.getStatById);
    router.put('/:id', validate(updateStatSchema), statController.updateStat);
    router.patch('/:id', validate(updateStatSchema), statController.updateStat);
    router.delete('/:id', statController.deleteStat);

    // Register router with prefix
    app.use('/api/stats', router);
}