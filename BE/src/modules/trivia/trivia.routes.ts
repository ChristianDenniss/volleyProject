import { Application, Router } from 'express';
import { TriviaController } from './trivia.controller.js';

/**
 * Register trivia routes with the Express application
 */
export function registerTriviaRoutes(app: Application): void {
    const router = Router();
    const triviaController = new TriviaController();

    // Get random trivia player
    router.get('/player', (req, res) => {
        triviaController.getRandomTriviaPlayer(req, res);
    });

    // Get random trivia team
    router.get('/team', (req, res) => {
        triviaController.getRandomTriviaTeam(req, res);
    });

    // Get random trivia season
    router.get('/season', (req, res) => {
        triviaController.getRandomTriviaSeason(req, res);
    });

    // Validate user guess
    router.post('/guess', (req, res) => {
        triviaController.validateGuess(req, res);
    });

    // Register router with prefix
    app.use('/api/trivia', router);
} 