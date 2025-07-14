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
    router.get('/api/users', authenticateToken, userController.getUsers);
    router.get('/api/users/profile', authenticateToken, userController.getProfile);
    router.get('/api/users/:id', authenticateToken, userController.getUserById);
    router.put('/api/users/:id', authenticateToken, userController.updateUser);
    router.delete('/api/users/:id', authenticateToken, userController.deleteUser);

    // Admin-only routes
    router.patch('/api/admin/users/:id/role', userController.setRole);
    router.post('/api/admin/generate-api-key', authenticateToken, userController.generateApiKey);

    // Register router
    app.use(router);
}
