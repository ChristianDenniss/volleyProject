import { Application, Router } from 'express';
import { UserController } from './user.controller.js';
import { validate } from '../../middleware/validate.js';
import { createUserSchema, changeUserRoleSchema, changePasswordSchema } from './user.schema.js';
import { authenticateToken } from '../../middleware/authentication.js';
import { authorizeRoles } from '../../middleware/authorizeRoles.js';
import { loginRateLimiter, registerRateLimiter } from '../../middleware/rateLimit.js';
import { requireRegistrationEnabled } from '../../middleware/registrationGate.js';

export function registerUserRoutes(app: Application): void {
    const router = Router();
    const userController = new UserController();

    router.post('/api/users/register', registerRateLimiter, requireRegistrationEnabled, validate(createUserSchema), userController.register);
    router.post('/api/users/login', loginRateLimiter, userController.login);
    router.post('/api/users/logout', userController.logout);

    router.get('/api/users', authenticateToken, authorizeRoles("admin", "superadmin"), userController.getPublicUsers);
    router.get('/api/users/profile', authenticateToken, userController.getProfile);
    router.patch('/api/users/profile/password', authenticateToken, validate(changePasswordSchema), userController.changePassword);
    router.get('/api/users/:id', authenticateToken, userController.getUserById);

    router.patch(
        '/api/admin/users/:id/role',
        authenticateToken,
        authorizeRoles("superadmin"),
        validate(changeUserRoleSchema),
        userController.setRole
    );

    app.use(router);
}
