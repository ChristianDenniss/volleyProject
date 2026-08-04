import { Application, Router } from 'express';
import { RobloxController } from './roblox.controller.js';
import { RobloxAuthController } from './roblox-auth.controller.js';
import { robloxRateLimiter } from '../../middleware/rateLimit.js';
import { authenticateToken } from '../../middleware/authentication.js';
import { authorizeRoles } from '../../middleware/authorizeRoles.js';

export function registerRobloxRoutes(app: Application): void
{
    const router = Router();
    const robloxController = new RobloxController();
    const authController = new RobloxAuthController();

    router.get('/avatar/:username', robloxRateLimiter, robloxController.getAvatarByUsername);

    app.use('/api/roblox', router);

    const authRouter = Router();
    authRouter.get('/roblox/start', (req, res, next) => {
        // connect requires auth; login/signup do not
        if (req.query.intent === 'connect') {
            return authenticateToken(req, res, (err?: unknown) => {
                if (err) return next(err);
                return authController.start(req, res, next);
            });
        }
        return authController.start(req, res, next);
    });
    authRouter.get('/roblox/callback', authController.callback);
    authRouter.post('/roblox/unlink', authenticateToken, authController.unlink);
    authRouter.post(
        '/roblox/unlink/:id',
        authenticateToken,
        authorizeRoles('admin', 'superadmin'),
        authController.adminUnlink
    );

    app.use('/api/auth', authRouter);
}
