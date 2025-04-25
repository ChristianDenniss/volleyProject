import { Application, Router } from 'express';
import { PlayerController } from './player.controller.js';

export function registerPlayerRoutes(app: Application): void 
{
    const router = Router();
    const playerController = new PlayerController();

    // Player routes
    router.post('/', playerController.createPlayer);
    router.post('/batch', playerController.createMultiplePlayers);  
    router.post('/by-team-name', playerController.createPlayerByName);
    router.post('/batch/by-team-name', playerController.createMultiplePlayersByName);

    router.get('/', playerController.getPlayers);

    // 👇 Move this above the ID route
    router.get('/teams/:playerName', playerController.getTeamsByPlayerName);

    // 🔻 This must come AFTER /teams/:playerName
    router.get('/:id', playerController.getPlayerById);

    router.put('/:id', playerController.updatePlayer);
    router.patch('/players/:id', playerController.updatePlayer);
    router.delete('/:id', playerController.deletePlayer);
    router.get('/team/:teamId', playerController.getPlayersByTeamId);

    app.use('/api/players', router);
}
