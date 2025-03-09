import { Application, Router } from 'express';
import { GameController } from './game.controller';

export function registerGameRoutes(app: Application): void {
    const router = Router();
    const gameController = new GameController();

    // Game routes
    router.post('/', gameController.createGame);
    router.get('/', gameController.getGames);
    router.get('/:id', gameController.getGameById);
    router.put('/:id', gameController.updateGame);
    router.delete('/:id', gameController.deleteGame);
    router.get('/season/:seasonId', gameController.getGamesBySeasonId);
    router.get('/team/:teamId', gameController.getGamesByTeamId);

    // Register router with prefix
    app.use('/api/games', router);
}