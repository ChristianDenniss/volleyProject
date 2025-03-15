import { Application, Router } from 'express';
import { GameController } from './game.controller.js';

export function registerGameRoutes(app: Application): void {
    const router = Router();
    const gameController = new GameController();

    // Game routes
    router.post('/', gameController.createGame); // Create a new game (include score in body)
    router.get('/', gameController.getGames); // Get all games
    router.get('/:id', gameController.getGameById); // Get game by ID
    router.put('/:id', gameController.updateGame); // Update a game (update score if needed)
    router.delete('/:id', gameController.deleteGame); // Delete a game
    router.get('/season/:seasonId', gameController.getGamesBySeasonId); // Get games by season ID
    router.get('/team/:teamId', gameController.getGamesByTeamId); // Get games by team ID

    // New endpoint to get the score of a specific game by game ID
    router.get('/:id/score', gameController.getGameScoreById); // Get the score by game ID

    // Register router with prefix
    app.use('/api/games', router);
}
