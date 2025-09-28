import { Application, Router } from 'express';
import { UserController } from './user.controller.js';
import { validate } from '../../middleware/validate.js';
import { createUserSchema, updateUserSchema } from './user.schema.js';
import { authenticateToken } from '../../middleware/authentication.js';

export function registerUserRoutes(app: Application): void {
    const router = Router();
    const userController = new UserController();

    // Auth routes
    router.post('/api/users/register', validate(createUserSchema), userController.register);
    router.post('/api/users/login', userController.login);
    
    // User management routes
    router.get('/api/users', authenticateToken, userController.getPublicUsers);
    router.get('/api/users/profile', authenticateToken, userController.getProfile);
    router.get('/api/users/:id', authenticateToken, userController.getUserById);

    // Admin-only routes
    router.patch('/api/admin/users/:id/role', authenticateToken, userController.setRole);

    // Register router
    app.use(router);
}
