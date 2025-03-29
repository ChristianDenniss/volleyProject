import { Application, Router } from 'express';
import { PlayerController } from './player.controller.js';

export function registerPlayerRoutes(app: Application): void {
    const router = Router();
    const playerController = new PlayerController();

    // Player routes
    router.post('/', playerController.createPlayer);
    router.post('/batch', playerController.createMultiplePlayers);  // Batch creation for multiple players
    router.get('/', playerController.getPlayers);
    router.get('/:id', playerController.getPlayerById);
    router.put('/:id', playerController.updatePlayer);
    router.delete('/:id', playerController.deletePlayer);
    router.get('/team/:teamId', playerController.getPlayersByTeamId);

    // Register router with prefix
    app.use('/api/players', router);
}