import { Application } from 'express';
import { registerTeamRoutes } from './teams/team.routes.js';
import { registerPlayerRoutes } from './players/player.routes.js';
import { registerGameRoutes } from './games/game.routes.js';
import { registerSeasonRoutes } from './seasons/season.routes.js';
import { registerStatRoutes } from './stats/stat.routes.js';
import { registerUserRoutes } from './user/user.routes.js';
import { registerArticleRoutes } from './articles/article.routes.js';
import { registerRobloxRoutes } from './roblox/roblox.routes.js'
import { registerAwardRoutes } from './awards/award.routes.js';
import { registerRecordRoutes } from './records/records.routes.js';
import { cacheHealthCheck } from '../middleware/cache.js';

/**
 * Register all module routes with the Express application
 */
export function registerModules(app: Application): void 
{
    // Register routes from each module
    registerRobloxRoutes(app);
    registerTeamRoutes(app);
    registerPlayerRoutes(app);
    registerGameRoutes(app);
    registerSeasonRoutes(app);
    registerStatRoutes(app);
    registerUserRoutes(app);
    registerArticleRoutes(app);
    registerAwardRoutes(app);
    registerRecordRoutes(app);

    // Cache health check route
    app.get('/api/cache/health', cacheHealthCheck);

    // Default route
    app.get('/', (req, res) => {
        res.json({ message: 'Volleyball API is running' });
    });
}
