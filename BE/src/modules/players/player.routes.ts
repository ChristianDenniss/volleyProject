import { Application, Router } from 'express';
import { PlayerController } from './player.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticateCombined } from '../../middleware/combinedAuth.js';
import { authorizeRoles } from '../../middleware/authorizeRoles.js';
import { createPlayerSchema, updatePlayerSchema, createMultiplePlayersByNameSchema } from './players.schema.js';
import { cacheMiddleware, invalidateCacheMiddleware } from '../../middleware/cache.js';

export function registerPlayerRoutes(app: Application): void
{
    const router = Router();
    const playerController = new PlayerController();

    // Player routes - PROTECTED (require admin/superadmin)
    router.post('/', authenticateCombined, authorizeRoles("admin", "superadmin"), validate(createPlayerSchema), playerController.createPlayer);
    router.post('/batch', authenticateCombined, authorizeRoles("admin", "superadmin"), validate(createPlayerSchema), playerController.createMultiplePlayers);

    //Not sure on these two routes, come back to them later
    router.post('/by-team-name', authenticateCombined, authorizeRoles("admin", "superadmin"), validate(createPlayerSchema), playerController.createPlayerByName);
    router.post('/batch/by-team-name', authenticateCombined, authorizeRoles("admin", "superadmin"), validate(createMultiplePlayersByNameSchema), playerController.createMultiplePlayersByName);

    // Merge two players into one - PROTECTED
    router.post('/merge', authenticateCombined, authorizeRoles("admin", "superadmin"), playerController.mergePlayers);

    // GET routes - PUBLIC (for website display) - with caching
    router.get('/', cacheMiddleware({ prefix: 'players', ttl: 600 }), playerController.getPlayers);
    router.get('/medium', cacheMiddleware({ prefix: 'players', ttl: 600 }), playerController.getMediumPlayers);
    // Above the ID route
    router.get('/teams/:playerName', cacheMiddleware({ prefix: 'players', ttl: 600 }), playerController.getTeamsByPlayerName);

    // 🔻 This must come AFTER /teams/:playerName
    router.get('/:id', cacheMiddleware({ prefix: 'players', ttl: 600 }), playerController.getPlayerById);

    // UPDATE/DELETE routes - PROTECTED - with cache invalidation
    router.put('/:id', authenticateCombined, authorizeRoles("admin", "superadmin"), invalidateCacheMiddleware('players'), playerController.updatePlayer);
    router.patch('/:id', authenticateCombined, authorizeRoles("admin", "superadmin"), validate(updatePlayerSchema), invalidateCacheMiddleware('players'), playerController.updatePlayer);
    router.delete('/:id', authenticateCombined, authorizeRoles("admin", "superadmin"), invalidateCacheMiddleware('players'), playerController.deletePlayer);
    router.get('/team/:teamId', cacheMiddleware({ prefix: 'players', ttl: 600 }), playerController.getPlayersByTeamId);

    app.use('/api/players', router);
}
