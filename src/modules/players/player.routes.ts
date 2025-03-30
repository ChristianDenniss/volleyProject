import { Application, Router } from 'express';
import { PlayerController } from './player.controller.js';

export function registerPlayerRoutes(app: Application): void {
    const router = Router();
    const playerController = new PlayerController();

    // Player routes
    router.post('/', playerController.createPlayer);
    // Batch creation for multiple players
    router.post('/batch', playerController.createMultiplePlayers);  
    //create player using their teams NAME, not teams ID, will just convert name into ID for db
    router.post('/by-team-name', playerController.createPlayerByName);
    //BATCH create player using their teams NAME, not teams ID, will just convert name into ID for db
    router.post('/batch/by-team-name', playerController.createMultiplePlayersByName);
    router.get('/', playerController.getPlayers);
    router.get('/:id', playerController.getPlayerById);
    router.put('/:id', playerController.updatePlayer);
    router.patch('/players/:id', playerController.updatePlayer);
    router.delete('/:id', playerController.deletePlayer);
    router.get('/team/:teamId', playerController.getPlayersByTeamId);

    // Register router with prefix
    app.use('/api/players', router);
}