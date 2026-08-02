import { Request, Response, NextFunction } from 'express';
import { TriviaService } from './trivia.service.js';
import {
    DifficultyQuerySchema,
    GuessRequestSchema,
} from './trivia.schema.js';

export class TriviaController {
    private triviaService: TriviaService;

    constructor() {
        this.triviaService = new TriviaService();
    }

    getRandomTriviaPlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const queryResult = DifficultyQuerySchema.safeParse(req.query);

            if (!queryResult.success) {
                res.status(400).json({
                    error: 'Invalid difficulty parameter',
                    details: queryResult.error.errors
                });
                return;
            }

            const { difficulty } = queryResult.data;
            const triviaPlayer = await this.triviaService.getRandomTriviaPlayer(difficulty);

            res.json(triviaPlayer);
        } catch (error) {
            next(error);
        }
    };

    getRandomTriviaTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const queryResult = DifficultyQuerySchema.safeParse(req.query);

            if (!queryResult.success) {
                res.status(400).json({
                    error: 'Invalid difficulty parameter',
                    details: queryResult.error.errors
                });
                return;
            }

            const { difficulty } = queryResult.data;
            const triviaTeam = await this.triviaService.getRandomTriviaTeam(difficulty);

            res.json(triviaTeam);
        } catch (error) {
            next(error);
        }
    };

    getRandomTriviaSeason = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const queryResult = DifficultyQuerySchema.safeParse(req.query);

            if (!queryResult.success) {
                res.status(400).json({
                    error: 'Invalid difficulty parameter',
                    details: queryResult.error.errors
                });
                return;
            }

            const { difficulty } = queryResult.data;
            const triviaSeason = await this.triviaService.getRandomTriviaSeason(difficulty);

            res.json(triviaSeason);
        } catch (error) {
            next(error);
        }
    };

    validateGuess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const bodyResult = GuessRequestSchema.safeParse(req.body);
            if (!bodyResult.success) {
                res.status(400).json({
                    error: 'Invalid request body',
                    details: bodyResult.error.errors
                });
                return;
            }

            const { type, id, guess } = bodyResult.data;
            const result = await this.triviaService.validateGuess(type, id, guess);

            res.json(result);
        } catch (error) {
            next(error);
        }
    };
}
