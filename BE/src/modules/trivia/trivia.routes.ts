import { Application } from 'express';
import { TriviaController } from './trivia.controller.js';

/**
 * Register trivia routes with the Express application
 */
export function registerTriviaRoutes(app: Application): void {
    const triviaController = new TriviaController();

    // Get random trivia player
    app.get('/api/trivia/player', (req, res) => {
        triviaController.getRandomTriviaPlayer(req, res);
    });

    // Get random trivia team
    app.get('/api/trivia/team', (req, res) => {
        triviaController.getRandomTriviaTeam(req, res);
    });

    // Get random trivia season
    app.get('/api/trivia/season', (req, res) => {
        triviaController.getRandomTriviaSeason(req, res);
    });

    // Validate user guess
    app.post('/api/trivia/guess', (req, res) => {
        triviaController.validateGuess(req, res);
    });
} 