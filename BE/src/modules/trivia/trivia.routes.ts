import { Application, Router } from 'express';
import { TriviaController } from './trivia.controller.js';
import { cacheMiddleware } from '../../middleware/cache.js';
import { authenticateCombined } from '../../middleware/combinedAuth.js';

/**
 * Register trivia routes with the Express application
 */
export function registerTriviaRoutes(app: Application): void {
    const router = Router();
    const triviaController = new TriviaController();

    // GET routes - PUBLIC (for testing) - NO CACHING for random trivia
    router.get('/player', triviaController.getRandomTriviaPlayer);
    router.get('/team', triviaController.getRandomTriviaTeam);
    router.get('/season', triviaController.getRandomTriviaSeason);

    // POST route - PUBLIC (for testing)
    router.post('/guess', triviaController.validateGuess);

    // Register router with prefix
    app.use('/api/trivia', router);
} 