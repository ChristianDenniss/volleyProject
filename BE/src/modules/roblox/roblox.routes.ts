import { Application, Router } from 'express';
import { RobloxController } from './roblox.controller.js';
import { robloxRateLimiter } from '../../middleware/rateLimit.js';

export function registerRobloxRoutes(app: Application): void
{
    const router = Router();
    const robloxController = new RobloxController();

    router.get('/avatar/:username', robloxRateLimiter, robloxController.getAvatarByUsername);

    app.use('/api/roblox', router);
}
