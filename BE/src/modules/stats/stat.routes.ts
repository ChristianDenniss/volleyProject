import { Application, Router } from 'express';
import { StatController } from './stat.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticateCombined } from '../../middleware/combinedAuth.js';
import { createStatSchema, updateStatSchema, createStatByNameSchema } from './stat.schema.js';
import { cacheMiddleware, invalidateCacheMiddleware } from '../../middleware/cache.js';

export function registerStatRoutes(app: Application): void {
    const router = Router();
    const statController = new StatController();

    // Stat routes - PROTECTED (require authentication)
    router.post('/', authenticateCombined, validate(createStatSchema), statController.createStat);
    router.post('/by-name', authenticateCombined, validate(createStatByNameSchema), statController.createStatByName);
    router.post('/batch-csv', authenticateCombined, statController.batchUploadFromCSV);
    router.post('/add-to-game', authenticateCombined, statController.addStatsToExistingGame);
    
    // GET routes - PUBLIC (for website display) - with caching
    router.get('/', cacheMiddleware({ prefix: 'stats', ttl: 600 }), statController.getStats);
    router.get('/player/:playerId', cacheMiddleware({ prefix: 'stats', ttl: 600 }), statController.getStatsByPlayerId);
    router.get('/game/:gameId', cacheMiddleware({ prefix: 'stats', ttl: 600 }), statController.getStatsByGameId);
    router.get('/:id', cacheMiddleware({ prefix: 'stats', ttl: 600 }), statController.getStatById);
    
    // UPDATE/DELETE routes - PROTECTED - with cache invalidation
    router.put('/:id', authenticateCombined, validate(updateStatSchema), invalidateCacheMiddleware('stats'), statController.updateStat);
    router.patch('/:id', authenticateCombined, validate(updateStatSchema), invalidateCacheMiddleware('stats'), statController.updateStat);
    router.delete('/:id', authenticateCombined, invalidateCacheMiddleware('stats'), statController.deleteStat);

    // Register router with prefix
    app.use('/api/stats', router);
}