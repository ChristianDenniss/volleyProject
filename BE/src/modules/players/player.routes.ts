import { Application, Router } from 'express';
import { PlayerController } from './player.controller.js';
import { validate } from '../../middleware/validate.js';
import { createPlayerSchema, updatePlayerSchema, createMultiplePlayersByNameSchema } from './players.schema.js';

export function registerPlayerRoutes(app: Application): void 
{
    const router = Router();
    const playerController = new PlayerController();

    // Player routes
    router.post('/', validate(createPlayerSchema), playerController.createPlayer);
    router.post('/batch', validate(createPlayerSchema), playerController.createMultiplePlayers);  

    //Not sure on these two routes, come back to them later
    router.post('/by-team-name', validate(createPlayerSchema), playerController.createPlayerByName);
    router.post('/batch/by-team-name', validate(createMultiplePlayersByNameSchema), playerController.createMultiplePlayersByName);

    // Merge two players into one
    router.post('/merge', playerController.mergePlayers);

    router.get('/', playerController.getPlayers);

    // Above the ID route
    router.get('/teams/:playerName', playerController.getTeamsByPlayerName);

    // 🔻 This must come AFTER /teams/:playerName
    router.get('/:id', playerController.getPlayerById);

    router.put('/:id', playerController.updatePlayer);
    router.patch('/:id', validate(updatePlayerSchema), playerController.updatePlayer);         
    router.delete('/:id', playerController.deletePlayer);
    router.get('/team/:teamId', playerController.getPlayersByTeamId);

    app.use('/api/players', router);
}
