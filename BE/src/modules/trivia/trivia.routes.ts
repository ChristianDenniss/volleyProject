import { Application, Router } from 'express';
import { TriviaController } from './trivia.controller.js';

/**
 * Register trivia routes with the Express application
 */
export function registerTriviaRoutes(app: Application): void {
    const router = Router();
    const triviaController = new TriviaController();

    // GET routes - PUBLIC (for website display)
    router.get('/player', triviaController.getRandomTriviaPlayer);
    router.get('/team', triviaController.getRandomTriviaTeam);
    router.get('/season', triviaController.getRandomTriviaSeason);

    // POST route - PUBLIC
    router.post('/guess', triviaController.validateGuess);

    // Register router with prefix
    app.use('/api/trivia', router);
} 