import { Application, Router } from 'express';
import { SeasonController } from './season.controller.ts';
import { validate } from '../../middleware/validate.ts';
import { createSeasonSchema, updateSeasonSchema } from './season.schema.ts';

export function registerSeasonRoutes(app: Application): void {
    const router = Router();
    const seasonController = new SeasonController();

    // Season routes
    router.post('/', validate(createSeasonSchema), seasonController.createSeason);
    router.get('/', seasonController.getAllSeasons);
    router.get('/:id', seasonController.getSeasonById);
    router.put('/:id', seasonController.updateSeason);
    router.patch('/:id', validate(updateSeasonSchema), seasonController.updateSeason);
    router.delete('/:id', seasonController.deleteSeason);

    // Register router with prefix
    app.use('/api/seasons', router);
}