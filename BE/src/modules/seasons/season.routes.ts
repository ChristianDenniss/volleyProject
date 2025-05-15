import { Application, Router } from 'express';
import { SeasonController } from './season.controller.js';
import { validate } from '../../middleware/validate.js';
import { createSeasonSchema, updateSeasonSchema } from './season.schema.js';

export function registerSeasonRoutes(app: Application): void {
    const router = Router();
    const seasonController = new SeasonController();

    // Season routes
    router.post('/', validate(createSeasonSchema), seasonController.createSeason);
    router.get('/', seasonController.getSeasons);
    router.get('/:id', seasonController.getSeasonById);
    router.put('/:id', seasonController.updateSeason);
    router.patch('/:id', validate(updateSeasonSchema), seasonController.updateSeason);
    router.delete('/:id', seasonController.deleteSeason);

    // Register router with prefix
    app.use('/api/seasons', router);
}