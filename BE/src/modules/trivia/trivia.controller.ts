import { Request, Response } from 'express';
import { TriviaService } from './trivia.service.js';
import { 
    DifficultyQuerySchema, 
    GuessRequestSchema,
    type DifficultyQuery,
    type GuessRequest
} from './trivia.schema.js';

export class TriviaController {
    private triviaService: TriviaService;

    constructor() {
        this.triviaService = new TriviaService();
    }

    /**
     * Get a random trivia player with all relations
     */
    getRandomTriviaPlayer = async (req: Request, res: Response): Promise<void> => {
        
        try {
            // Validate query parameters
            const queryResult = DifficultyQuerySchema.safeParse(req.query);
            
            if (!queryResult.success) {
                console.error('❌ [TriviaController] Query validation failed:', queryResult.error.errors);
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
            console.error('❌ [TriviaController] Error getting random trivia player:', error);
            console.error('❌ [TriviaController] Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            res.status(500).json({ 
                error: 'Failed to get trivia player' 
            });
        }
    };

    /**
     * Get a random trivia team with all relations
     */
    getRandomTriviaTeam = async (req: Request, res: Response): Promise<void> => {
        
        try {
            // Validate query parameters
            const queryResult = DifficultyQuerySchema.safeParse(req.query);
            
            if (!queryResult.success) {
                console.error('❌ [TriviaController] Query validation failed:', queryResult.error.errors);
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
            console.error('❌ [TriviaController] Error getting random trivia team:', error);
            console.error('❌ [TriviaController] Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            res.status(500).json({ 
                error: 'Failed to get trivia team' 
            });
        }
    };

    /**
     * Get a random trivia season with all relations
     */
    getRandomTriviaSeason = async (req: Request, res: Response): Promise<void> => {
        
        try {
            // Validate query parameters
            const queryResult = DifficultyQuerySchema.safeParse(req.query);
            
            if (!queryResult.success) {
                console.error('❌ [TriviaController] Query validation failed:', queryResult.error.errors);
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
            console.error('❌ [TriviaController] Error getting random trivia season:', error);
            console.error('❌ [TriviaController] Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            res.status(500).json({ 
                error: 'Failed to get trivia season' 
            });
        }
    };

    /**
     * Validate a user's guess
     */
    validateGuess = async (req: Request, res: Response): Promise<void> => {
        
        try {
            // Validate request body
            const bodyResult = GuessRequestSchema.safeParse(req.body);
            if (!bodyResult.success) {
                console.error('❌ [TriviaController] Body validation failed:', bodyResult.error.errors);
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
            console.error('❌ [TriviaController] Error validating guess:', error);
            console.error('❌ [TriviaController] Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            res.status(500).json({
                error: 'Failed to validate guess'
            });
        }
    };
} 