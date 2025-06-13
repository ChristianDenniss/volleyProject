import { Application, Router } from 'express';
import { UserController } from './user.controller.ts';
import { authenticateToken } from '../../middleware/authentication.ts';
import { ROBLOX_OAUTH } from '../../oauth.ts';

export function registerUserRoutes(app: Application): void {
    const router = Router();
    const userController = new UserController();

    // Auth Routes
    router.post('/api/users/oauth/roblox/start', userController.getUrl(ROBLOX_OAUTH));
    router.post('/api/users/oauth/roblox/callback', userController.getCallback(ROBLOX_OAUTH));
    
    // User management routes
    router.get('/api/users', authenticateToken, userController.getUsers);
    router.get('/api/users/profile', authenticateToken, userController.getProfile);
    router.get('/api/users/:id', authenticateToken, userController.getUserById);
    router.put('/api/users/:id', authenticateToken, userController.updateUser);
    router.delete('/api/users/:id', authenticateToken, userController.deleteUser);

    // Promote / demote a user’s role — goes through the app-level /api/admin guard
    router.patch('/api/admin/users/:id/role', userController.setRole);

    // Register router
    app.use(router);
}
