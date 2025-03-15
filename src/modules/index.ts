import { Application } from 'express';
import { registerTeamRoutes } from './teams/team.routes.js';
import { registerPlayerRoutes } from './players/player.routes.js';
import { registerGameRoutes } from './games/game.routes.js';
import { registerSeasonRoutes } from './seasons/season.routes.js';
import { registerStatRoutes } from './stats/stat.routes.js';
import { registerUserRoutes } from './user/user.routes.js';

/**
 * Register all module routes with the Express application
 */
export function registerModules(app: Application): void {
    // Register routes from each module
    registerTeamRoutes(app);
    registerPlayerRoutes(app);
    registerGameRoutes(app);
    registerSeasonRoutes(app);
    registerStatRoutes(app);
    registerUserRoutes(app);
    
    // Default route
    app.get('/', (req, res) => {
        res.json({ message: 'Volleyball API is running' });
    });
}
