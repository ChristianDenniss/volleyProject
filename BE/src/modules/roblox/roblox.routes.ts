import { Application, Router } from 'express';
import { RobloxController } from './roblox.controller.js';

export function registerRobloxRoutes(app: Application): void
{
    const router = Router();
    const robloxController = new RobloxController();

    // Proxy endpoint to get Roblox avatar URL by username
    router.get('/avatar/:username', robloxController.getAvatarByUsername);

    app.use('/api/roblox', router);
}
