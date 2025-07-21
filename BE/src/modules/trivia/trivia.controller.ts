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
        console.log('🎯 [TriviaController] getRandomTriviaPlayer called');
        console.log('🎯 [TriviaController] Request query:', req.query);
        console.log('🎯 [TriviaController] Request headers:', req.headers);
        
        try {
            // Validate query parameters
            console.log('🎯 [TriviaController] Validating query parameters...');
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
            console.log('✅ [TriviaController] Query validation successful, difficulty:', difficulty);
            
            console.log('🎯 [TriviaController] Calling trivia service...');
            const triviaPlayer = await this.triviaService.getRandomTriviaPlayer(difficulty);
            console.log('✅ [TriviaController] Service returned trivia player:', {
                id: triviaPlayer.id,
                name: triviaPlayer.name,
                difficulty: triviaPlayer.difficulty,
                hintCount: triviaPlayer.hintCount
            });
            
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
        console.log('🎯 [TriviaController] getRandomTriviaTeam called');
        console.log('🎯 [TriviaController] Request query:', req.query);
        console.log('🎯 [TriviaController] Request headers:', req.headers);
        
        try {
            // Validate query parameters
            console.log('🎯 [TriviaController] Validating query parameters...');
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
            console.log('✅ [TriviaController] Query validation successful, difficulty:', difficulty);
            
            console.log('🎯 [TriviaController] Calling trivia service...');
            const triviaTeam = await this.triviaService.getRandomTriviaTeam(difficulty);
            console.log('✅ [TriviaController] Service returned trivia team:', {
                id: triviaTeam.id,
                name: triviaTeam.name,
                difficulty: triviaTeam.difficulty,
                hintCount: triviaTeam.hintCount
            });
            
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
        console.log('🎯 [TriviaController] getRandomTriviaSeason called');
        console.log('🎯 [TriviaController] Request query:', req.query);
        console.log('🎯 [TriviaController] Request headers:', req.headers);
        
        try {
            // Validate query parameters
            console.log('🎯 [TriviaController] Validating query parameters...');
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
            console.log('✅ [TriviaController] Query validation successful, difficulty:', difficulty);
            
            console.log('🎯 [TriviaController] Calling trivia service...');
            const triviaSeason = await this.triviaService.getRandomTriviaSeason(difficulty);
            console.log('✅ [TriviaController] Service returned trivia season:', {
                id: triviaSeason.id,
                seasonNumber: triviaSeason.seasonNumber,
                difficulty: triviaSeason.difficulty,
                hintCount: triviaSeason.hintCount
            });
            
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
        console.log('🎯 [TriviaController] validateGuess called');
        console.log('🎯 [TriviaController] Request body:', req.body);
        console.log('🎯 [TriviaController] Request headers:', req.headers);
        
        try {
            // Validate request body
            console.log('🎯 [TriviaController] Validating request body...');
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
            console.log('✅ [TriviaController] Body validation successful:', { type, id, guess });
            
            console.log('🎯 [TriviaController] Calling trivia service...');
            const result = await this.triviaService.validateGuess(type, id, guess);
            console.log('✅ [TriviaController] Service returned guess result:', result);
            
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