import { Application, Router } from 'express';
import { TriviaController } from './trivia.controller.js';
import { cacheMiddleware } from '../../middleware/cache.js';

/**
 * Register trivia routes with the Express application
 */
export function registerTriviaRoutes(app: Application): void {
    const router = Router();
    const triviaController = new TriviaController();

    // GET routes - PUBLIC (for website display) - with caching
    router.get('/player', 
        cacheMiddleware({ prefix: 'trivia', ttl: 300 }), // 5 minutes cache for trivia
        triviaController.getRandomTriviaPlayer
    );
    
    router.get('/team', 
        cacheMiddleware({ prefix: 'trivia', ttl: 300 }),
        triviaController.getRandomTriviaTeam
    );
    
    router.get('/season', 
        cacheMiddleware({ prefix: 'trivia', ttl: 300 }),
        triviaController.getRandomTriviaSeason
    );

    // POST route - PUBLIC (no caching for user interactions)
    router.post('/guess', triviaController.validateGuess);

    // Register router with prefix
    app.use('/api/trivia', router);
} 