import { Application, Router } from 'express';
import { AwardController } from './award.controller.js';
import { AwardService } from './award.service.js';
import { validate } from '../../middleware/validate.js';
import { createAwardSchema, updateAwardSchema, createMultipleAwardsSchema, createAwardWithNamesSchema } from './awards.schema.js';

export function registerAwardRoutes(app: Application): void {
    const router = Router();
    const awardService = new AwardService();
    const awardController = new AwardController(awardService);

    // Create award
    router.post('/', validate(createAwardSchema), awardController.createAward);

    // Create award with player name
    router.post('/with-names', validate(createAwardWithNamesSchema), awardController.createAwardWithPlayerNames);

    // Get all awards
    router.get('/', awardController.getAwards);

    // Get award by ID
    router.get('/:id', awardController.getAwardById);

    // Get awards by type
    router.get('/type/:type', awardController.getAwardsByType);

    // Get awards by season
    router.get('/season/:seasonNumber', awardController.getAwardsBySeason);

    // Get all awards for a specific player
    router.get('/player/:playerId', awardController.getAwardsByPlayerId);

    // Update award
    router.patch('/:id', validate(updateAwardSchema), awardController.updateAward);

    // Delete award
    router.delete('/:id', awardController.deleteAward);

    // Register the router
    app.use('/api/awards', router);
} 