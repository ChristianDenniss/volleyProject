import { Application, Router } from 'express';
import { AwardController } from './award.controller.js';
import { AwardService } from './award.service.js';
import { validate } from '../../middleware/validate.js';
import { authenticateCombined } from '../../middleware/combinedAuth.js';
import { createAwardSchema, updateAwardSchema, createMultipleAwardsSchema, createAwardWithNamesSchema } from './awards.schema.js';

export function registerAwardRoutes(app: Application): void {
    const router = Router();
    const awardService = new AwardService();
    const awardController = new AwardController(awardService);

    // Create award - PROTECTED
    router.post('/', authenticateCombined, validate(createAwardSchema), awardController.createAward);

    // Create award with player name - PROTECTED
    router.post('/with-names', authenticateCombined, validate(createAwardWithNamesSchema), awardController.createAwardWithPlayerNames);

    // GET routes - PUBLIC (for website display)
    router.get('/', awardController.getAwards);
    router.get('/skinny', awardController.getSkinnyAwards);
    router.get('/:id', awardController.getAwardById);
    router.get('/type/:type', awardController.getAwardsByType);
    router.get('/season/:seasonNumber', awardController.getAwardsBySeason);
    router.get('/player/:playerId', awardController.getAwardsByPlayerId);

    // UPDATE/DELETE routes - PROTECTED
    router.patch('/:id', authenticateCombined, validate(updateAwardSchema), awardController.updateAward);
    router.delete('/:id', authenticateCombined, awardController.deleteAward);

    // Register the router
    app.use('/api/awards', router);
} 