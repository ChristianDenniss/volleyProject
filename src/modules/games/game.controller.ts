import { Request, Response } from 'express';
import { GameService } from './game.service';

export class GameController {
    private gameService: GameService;

    constructor() {
        this.gameService = new GameService();
    }

    // Create a new game
    createGame = async (req: Request, res: Response): Promise<void> => {
        try {
            const { date, seasonId, teamIds } = req.body;
            const savedGame = await this.gameService.createGame(
                date,
                seasonId,
                teamIds
            );
            
            res.status(201).json(savedGame);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to create game";
            
            if (errorMessage.includes("required") || 
                errorMessage.includes("not found") || 
                errorMessage.includes("must have") ||
                errorMessage.includes("Invalid")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error creating game:", error);
                res.status(500).json({ error: "Failed to create game" });
            }
        }
    };

    // Get all games
    getGames = async (req: Request, res: Response): Promise<void> => {
        try {
            const games = await this.gameService.getAllGames();
            res.json(games);
        } catch (error) {
            console.error("Error fetching games:", error);
            res.status(500).json({ error: "Failed to fetch games" });
        }
    };

    // Get game by ID
    getGameById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const game = await this.gameService.getGameById(parseInt(id));
            res.json(game);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch game";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error fetching game by ID:", error);
                res.status(500).json({ error: "Failed to fetch game" });
            }
        }
    };

    // Update a game
    updateGame = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { date, seasonId, teamIds } = req.body;
            const updatedGame = await this.gameService.updateGame(
                parseInt(id),
                date,
                seasonId,
                teamIds
            );
            res.json(updatedGame);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to update game";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else if (errorMessage.includes("required") || 
                       errorMessage.includes("must have") ||
                       errorMessage.includes("Invalid")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error updating game:", error);
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
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to delete game";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else if (errorMessage.includes("Cannot delete")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error deleting game:", error);
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
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch games by season";
            
            if (errorMessage.includes("not found") || errorMessage.includes("required")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error fetching games by season ID:", error);
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
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch games by team";
            
            if (errorMessage.includes("not found") || errorMessage.includes("required")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error fetching games by team ID:", error);
                res.status(500).json({ error: "Failed to fetch games by team" });
            }
        }
    };
}