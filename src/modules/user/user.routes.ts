import { Application, Router } from 'express';
import { UserController } from './user.controller';

export function registerUserRoutes(app: Application): void {
    const router = Router();
    const userController = new UserController();

    // Auth routes
    router.post('/register', userController.register);
    router.post('/login', userController.login);
    
    // User management routes
    router.get('/', userController.getUsers);
    router.get('/profile', userController.getProfile); // Requires auth middleware in a real app
    router.get('/:id', userController.getUserById);
    router.put('/:id', userController.updateUser);
    router.delete('/:id', userController.deleteUser);

    // Register router with prefix
    app.use('/api/users', router);
}