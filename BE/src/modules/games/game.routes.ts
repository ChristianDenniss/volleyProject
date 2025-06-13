import { Application, Router } from 'express';
import { GameController } from './game.controller.ts';
import { validate } from '../../middleware/validate.ts';
import { createGameSchema, updateGameSchema } from './games.schema.ts';

export function registerGameRoutes(app: Application): void {
    const router = Router();
    const gameController = new GameController();

    // Game routes
    router.post('/', validate(createGameSchema), gameController.createGame); // Create a new game (include score in body)
    router.post('/batch', validate(createGameSchema), gameController.createMultipleGames); // Create multiple games in batch (new route)
    router.get('/', gameController.getGames); // Get all games
    router.get('/:id', gameController.getGameById); // Get game by ID
    router.put('/:id', gameController.updateGame); // Update a game (update score if needed)
    router.patch('/:id', validate(updateGameSchema), gameController.updateGame); // Only update given fields
    router.delete('/:id', gameController.deleteGame); // Delete a game
    router.get('/season/:seasonId', gameController.getGamesBySeasonId); // Get games by season ID
    router.get('/team/:teamId', gameController.getGamesByTeamId); // Get games by team ID

    router.post('/createByNames', gameController.createGameByNames); 

    // New endpoint to get the score of a specific game by game ID
    router.get('/:id/score', gameController.getGameScoreById); // Get the score by game ID

    // Register router with prefix
    app.use('/api/games', router);
}
