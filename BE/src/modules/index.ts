import { Application } from 'express';
import { registerTeamRoutes } from './teams/team.routes.ts';
import { registerPlayerRoutes } from './players/player.routes.ts';
import { registerGameRoutes } from './games/game.routes.ts';
import { registerSeasonRoutes } from './seasons/season.routes.ts';
import { registerStatRoutes } from './stats/stat.routes.ts';
import { registerUserRoutes } from './user/user.routes.ts';
import { registerArticleRoutes } from './articles/article.routes.ts';
import { registerRobloxRoutes } from './roblox/roblox.routes.ts'
import { registerAwardRoutes } from './awards/award.routes.ts';

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

    // Default route
    app.get('/', (req, res) => {
        res.json({ message: 'Volleyball API is running' });
    });
}
