import { Application, Router } from 'express';
import { TriviaController } from './trivia.controller.js';
import { loggerMiddleware } from '../../middleware/logger.js';

/**
 * Register trivia routes with the Express application
 */
export function registerTriviaRoutes(app: Application): void {
    const router = Router();
    const triviaController = new TriviaController();

    // Apply logging middleware to all trivia routes
    router.use(loggerMiddleware);

    // GET routes - PUBLIC (for website display)
    router.get('/player', (req, res) => triviaController.getRandomTriviaPlayer(req, res));
    router.get('/team', (req, res) => triviaController.getRandomTriviaTeam(req, res));
    router.get('/season', (req, res) => triviaController.getRandomTriviaSeason(req, res));

    // POST route - PUBLIC
    router.post('/guess', (req, res) => triviaController.validateGuess(req, res));

    // Register router with prefix
    app.use('/api/trivia', router);
} 