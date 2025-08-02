import { Application, Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticateCombined } from '../../middleware/combinedAuth.js';
import { createMatchSchema, updateMatchSchema, importChallongeSchema } from './matches.schema.js';
import { MatchController } from './match.controller.js';

export function registerMatchRoutes(app: Application): void {
    const router = Router();
    const matchController = new MatchController();

    // GET routes - PUBLIC (for website display)
    router.get('/', matchController.getAllMatches);
    router.get('/season/:seasonId', matchController.getMatchesBySeason);
    router.get('/season/:seasonId/round/:round', matchController.getMatchesByRound);
    router.get('/:id', matchController.getMatchById);
    
    // POST/PUT/DELETE routes - PROTECTED (require authentication)
    router.post('/', authenticateCombined, validate(createMatchSchema), matchController.createMatch);
    router.put('/:id', authenticateCombined, validate(updateMatchSchema), matchController.updateMatch);
    router.patch('/:id', authenticateCombined, validate(updateMatchSchema), matchController.updateMatch);
    router.delete('/:id', authenticateCombined, matchController.deleteMatch);
    
    // Import from Challonge - PROTECTED
    router.post('/import-challonge', authenticateCombined, validate(importChallongeSchema), matchController.importFromChallonge);

    // Register router with prefix
    app.use('/api/matches', router);
} 