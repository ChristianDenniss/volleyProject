import { Application, Router } from 'express';
import { GameController } from './game.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticateCombined } from '../../middleware/combinedAuth.js';
import { createGameSchema, updateGameSchema } from './games.schema.js';

export function registerGameRoutes(app: Application): void {
    const router = Router();
    const gameController = new GameController();

    // Game routes - PROTECTED (require authentication)
    router.post('/', authenticateCombined, validate(createGameSchema), gameController.createGame); // Create a new game (include score in body)
    router.post('/batch', authenticateCombined, validate(createGameSchema), gameController.createMultipleGames); // Create multiple games in batch (new route)
    
    // GET routes - PUBLIC (for website display)
    router.get('/', gameController.getGames); // Get all games
    router.get('/skinny', gameController.getSkinnyGames); // Get all games without relations / minimal data
    router.get('/:id', gameController.getGameById); // Get game by ID       
    router.get('/season/:seasonId', gameController.getGamesBySeasonId); // Get games by season ID
    router.get('/team/:teamId', gameController.getGamesByTeamId); // Get games by team ID
    router.get('/:id/score', gameController.getGameScoreById); // Get the score by game ID

    // Additional protected routes
    router.post('/createByNames', authenticateCombined, gameController.createGameByNames); 

    // UPDATE/DELETE routes - PROTECTED
    router.put('/:id', authenticateCombined, gameController.updateGame); // Update a game (update score if needed)
    router.patch('/:id', authenticateCombined, validate(updateGameSchema), gameController.updateGame); // Only update given fields
    router.delete('/:id', authenticateCombined, gameController.deleteGame); // Delete a game

    // Register router with prefix
    app.use('/api/games', router);
}
