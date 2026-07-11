import { Application, Router } from 'express';
import { SeasonController } from './season.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticateCombined } from '../../middleware/combinedAuth.js';
import { authorizeRoles } from '../../middleware/authorizeRoles.js';
import { createSeasonSchema, updateSeasonSchema } from './season.schema.js';

export function registerSeasonRoutes(app: Application): void {
    const router = Router();
    const seasonController = new SeasonController();

    // Season routes - PROTECTED (require admin/superadmin)
    router.post('/', authenticateCombined, authorizeRoles("admin", "superadmin"), validate(createSeasonSchema), seasonController.createSeason);
    
    // GET routes - PUBLIC (for website display)
    router.get('/', seasonController.getAllSeasons);
    router.get('/skinny', seasonController.getSkinnyAllSeasons);
    router.get('/medium', seasonController.getMediumAllSeasons);
    router.get('/:id', seasonController.getSeasonById);
    
    // UPDATE/DELETE routes - PROTECTED
    router.put('/:id', authenticateCombined, authorizeRoles("admin", "superadmin"), seasonController.updateSeason);
    router.patch('/:id', authenticateCombined, authorizeRoles("admin", "superadmin"), validate(updateSeasonSchema), seasonController.updateSeason);
    router.delete('/:id', authenticateCombined, authorizeRoles("admin", "superadmin"), seasonController.deleteSeason);

    // Register router with prefix
    app.use('/api/seasons', router);
}