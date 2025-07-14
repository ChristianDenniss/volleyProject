import { Application, Router } from 'express';
import { StatController } from './stat.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticateCombined } from '../../middleware/combinedAuth.js';
import { createStatSchema, updateStatSchema, createStatByNameSchema } from './stat.schema.js';

export function registerStatRoutes(app: Application): void {
    const router = Router();
    const statController = new StatController();

    // Stat routes - PROTECTED (require authentication)
    router.post('/', authenticateCombined, validate(createStatSchema), statController.createStat);
    router.post('/by-name', authenticateCombined, validate(createStatByNameSchema), statController.createStatByName);
    router.post('/batch-csv', authenticateCombined, statController.batchUploadFromCSV);
    router.post('/add-to-game', authenticateCombined, statController.addStatsToExistingGame);
    
    // GET routes - PUBLIC (for website display)
    router.get('/', statController.getStats);
    router.get('/player/:playerId', statController.getStatsByPlayerId);
    router.get('/game/:gameId', statController.getStatsByGameId);
    router.get('/:id', statController.getStatById);
    
    // UPDATE/DELETE routes - PROTECTED
    router.put('/:id', authenticateCombined, validate(updateStatSchema), statController.updateStat);
    router.patch('/:id', authenticateCombined, validate(updateStatSchema), statController.updateStat);
    router.delete('/:id', authenticateCombined, statController.deleteStat);

    // Register router with prefix
    app.use('/api/stats', router);
}