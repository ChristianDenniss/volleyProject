import { Application, Router } from 'express';
import { UserController } from './user.controller.js';
import { validate } from '../../middleware/validate.js';
import { createUserSchema, updateUserSchema } from './user.schema.js';
import { authenticateToken } from '../../middleware/authentication.js';

export function registerUserRoutes(app: Application): void {
    const router = Router();
    const userController = new UserController();

    // Auth routes
    router.post('/register', validate(createUserSchema), userController.register);
    router.post('/login', userController.login);
    
    // User management routes
    router.get('/', authenticateToken, userController.getUsers);
    router.get('/profile', authenticateToken, userController.getProfile); // Requires auth middleware in a real app
    router.get('/:id', authenticateToken, userController.getUserById);
    router.put('/:id', authenticateToken, userController.updateUser);
    router.delete('/:id', authenticateToken, userController.deleteUser);
    
    //Create and add a patch route for updating a user in the future
    //router.patch('/:id', validate(updateUserSchema), userController.updateUser);


    // Register router with prefix
    app.use('/api/users', router);
}