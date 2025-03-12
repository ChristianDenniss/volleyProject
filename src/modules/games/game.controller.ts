import { Request, Response } from 'express';
import { GameService } from './game.service';
import { MissingFieldError}  from '../../errors/MissingFieldError';
import { NotFoundError } from '../../errors/NotFoundError';
import { ConflictError } from '../../errors/ConflictError';
import { DuplicateError } from '../../errors/DuplicateError';
import { DateError } from '../../errors/DateErrors';
import { InvalidFormatError} from '../../errors/InvalidFormatError';

export class GameController {
    private gameService: GameService;

    constructor() {
        this.gameService = new GameService();
    }

    // Create a new game
    createGame = async (req: Request, res: Response): Promise<void> => {
        try {
            const { date, seasonId, teamIds } = req.body;
            const savedGame = await this.gameService.createGame(date, seasonId, teamIds);
            res.status(201).json(savedGame);
        } catch (error: unknown) {
            if (error instanceof MissingFieldError || 
                error instanceof NotFoundError || 
                error instanceof InvalidFormatError || 
                error instanceof DateError || 
                error instanceof ConflictError || 
                error instanceof DuplicateError) {
                console.error("Custom error creating game:", error);
                res.status(400).json({ error: error.message });
            } else {
                console.error("Unexpected error creating game:", error);
                res.status(500).json({ error: "Failed to create game" });
            }
        }
    };

    // Get all games
    getGames = async (req: Request, res: Response): Promise<void> => {
        try {
            const games = await this.gameService.getAllGames();
            res.json(games);
        } catch (error: unknown) {
            if (error instanceof MissingFieldError || 
                error instanceof NotFoundError || 
                error instanceof InvalidFormatError || 
                error instanceof DateError || 
                error instanceof ConflictError || 
                error instanceof DuplicateError) {
                console.error("Custom error fetching games:", error);
                res.status(400).json({ error: error.message });
            } else {
                console.error("Unexpected error fetching games:", error);
                res.status(500).json({ error: "Failed to fetch games" });
            }
        }
    };

    // Get game by ID
    getGameById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const game = await this.gameService.getGameById(parseInt(id));
            res.json(game);
        } catch (error: unknown) {
            if (error instanceof MissingFieldError || 
                error instanceof NotFoundError || 
                error instanceof InvalidFormatError || 
                error instanceof DateError || 
                error instanceof ConflictError || 
                error instanceof DuplicateError) {
                console.error("Custom error fetching game by ID:", error);
                res.status(400).json({ error: error.message });
            } else {
                console.error("Unexpected error fetching game by ID:", error);
                res.status(500).json({ error: "Failed to fetch game" });
            }
        }
    };

    // Update a game
    updateGame = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { date, seasonId, teamIds } = req.body;
            const updatedGame = await this.gameService.updateGame(parseInt(id), date, seasonId, teamIds);
            res.json(updatedGame);
        } catch (error: unknown) {
            if (error instanceof MissingFieldError || 
                error instanceof NotFoundError || 
                error instanceof InvalidFormatError || 
                error instanceof DateError || 
                error instanceof ConflictError || 
                error instanceof DuplicateError) {
                console.error("Custom error updating game:", error);
                res.status(400).json({ error: error.message });
            } else {
                console.error("Unexpected error updating game:", error);
                res.status(500).json({ error: "Failed to update game" });
            }
        }
    };

    // Delete a game
    deleteGame = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            await this.gameService.deleteGame(parseInt(id));
            res.status(204).send();
        } catch (error: unknown) {
            if (error instanceof MissingFieldError || 
                error instanceof NotFoundError || 
                error instanceof InvalidFormatError || 
                error instanceof DateError || 
                error instanceof ConflictError || 
                error instanceof DuplicateError) {
                console.error("Custom error deleting game:", error);
                res.status(400).json({ error: error.message });
            } else {
                console.error("Unexpected error deleting game:", error);
                res.status(500).json({ error: "Failed to delete game" });
            }
        }
    };

    // Get games by season ID
    getGamesBySeasonId = async (req: Request, res: Response): Promise<void> => {
        try {
            const { seasonId } = req.params;
            const games = await this.gameService.getGamesBySeasonId(parseInt(seasonId));

            if (games.length === 0) {
                res.status(404).json({ message: "No games found for the specified season" });
                return;
            }

            res.json(games);
        } catch (error: unknown) {
            if (error instanceof MissingFieldError || 
                error instanceof NotFoundError || 
                error instanceof InvalidFormatError || 
                error instanceof DateError || 
                error instanceof ConflictError || 
                error instanceof DuplicateError) {
                console.error("Custom error fetching games by season:", error);
                res.status(400).json({ error: error.message });
            } else {
                console.error("Unexpected error fetching games by season:", error);
                res.status(500).json({ error: "Failed to fetch games by season" });
            }
        }
    };

    // Get games by team ID
    getGamesByTeamId = async (req: Request, res: Response): Promise<void> => {
        try {
            const { teamId } = req.params;
            const games = await this.gameService.getGamesByTeamId(parseInt(teamId));

            if (games.length === 0) {
                res.status(404).json({ message: "No games found for the specified team" });
                return;
            }

            res.json(games);
        } catch (error: unknown) {
            if (error instanceof MissingFieldError || 
                error instanceof NotFoundError || 
                error instanceof InvalidFormatError || 
                error instanceof DateError || 
                error instanceof ConflictError || 
                error instanceof DuplicateError) {
                console.error("Custom error fetching games by team:", error);
                res.status(400).json({ error: error.message });
            } else {
                console.error("Unexpected error fetching games by team:", error);
                res.status(500).json({ error: "Failed to fetch games by team" });
            }
        }
    };
}
