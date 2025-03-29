import { Request, Response } from 'express';
import { GameService } from './game.service.js';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { DuplicateError } from '../../errors/DuplicateError.js';
import { DateError } from '../../errors/DateErrors.js';
import { InvalidFormatError } from '../../errors/InvalidFormatError.js';

export class GameController {
    private gameService: GameService;

    constructor() {
        this.gameService = new GameService();
    }

    // Create a new game
    createGame = async (req: Request, res: Response): Promise<void> => {
        try {
            const { date, seasonId, teamIds, homeScore, awayScore } = req.body;
            const savedGame = await this.gameService.createGame(date, seasonId, teamIds, homeScore, awayScore);
            res.status(201).json(savedGame);
        } catch (error: any) {
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

    // Create multiple games (batch method)
    createMultipleGames = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gamesData } = req.body;  // Expect an array of game data
            const savedGames = await this.gameService.createMultipleGames(gamesData);
            res.status(201).json(savedGames);
        } catch (error: any) {
            if (error instanceof MissingFieldError || 
                error instanceof NotFoundError || 
                error instanceof InvalidFormatError || 
                error instanceof DateError || 
                error instanceof ConflictError || 
                error instanceof DuplicateError) {
                console.error("Custom error creating multiple games:", error);
                res.status(400).json({ error: error.message });
            } else {
                console.error("Unexpected error creating multiple games:", error);
                res.status(500).json({ error: "Failed to create multiple games" });
            }
        }
    };

    // Get all games
    getGames = async (req: Request, res: Response): Promise<void> => {
        try {
            const games = await this.gameService.getAllGames();
            res.json(games);
        } catch (error: any) {
            if (error !instanceof MissingFieldError || 
                error instanceof NotFoundError || 
                error instanceof InvalidFormatError || 
                error instanceof DateError || 
                error instanceof ConflictError || 
                error instanceof DuplicateError) {
                console.error("Custom error fetching games:", error);
                res.status(400).json({ error: error.message });
            } 
            else 
            {
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
        } catch (error: any) {
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
            const { date, seasonId, teamIds, homeScore, awayScore } = req.body;
            const updatedGame = await this.gameService.updateGame(parseInt(id), date, seasonId, teamIds, homeScore, awayScore);
            res.json(updatedGame);
        } catch (error: any) {
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
        } catch (error: any) {
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
        } catch (error: any) {
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
        } catch (error: any) {
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

    // Get score for a game by ID
    getGameScoreById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const score = await this.gameService.getScoreByGameId(parseInt(id));
            res.json(score);
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                console.error("Game not found for score:", error);
                res.status(404).json({ error: "Game not found" });
            } else {
                console.error("Unexpected error fetching score:", error);
                res.status(500).json({ error: "Failed to fetch score" });
            }
        }
    };
}
