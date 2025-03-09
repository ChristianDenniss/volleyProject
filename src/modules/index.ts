import { Application } from 'express';
import { registerTeamRoutes } from './teams/team.routes';
import { registerPlayerRoutes } from './players/player.routes';
import { registerGameRoutes } from './games/game.routes';
import { registerSeasonRoutes } from './seasons/season.routes';
import { registerStatRoutes } from './stats/stat.routes';
import { registerUserRoutes } from './user/user.routes';

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