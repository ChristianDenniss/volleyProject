import { Request, Response } from 'express';
import { PlayerService } from './player.service.js';

export class PlayerController {
    private playerService: PlayerService;

    constructor() {
        this.playerService = new PlayerService();
    }

    // Create a new player
    createPlayer = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, position, teamId } = req.body;
            const savedPlayer = await this.playerService.createPlayer(
                name, 
                position, 
                teamId
            );
            
            res.status(201).json(savedPlayer);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to create player";
            
            if (errorMessage.includes("required") || 
                errorMessage.includes("not found") || 
                errorMessage.includes("already in use") ||
                errorMessage.includes("must be")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error creating player:", error);
                res.status(500).json({ error: "Failed to create player" });
            }
        }
    };

    // Get all players
    getPlayers = async (req: Request, res: Response): Promise<void> => {
        try {
            const players = await this.playerService.getAllPlayers();
            res.json(players);
        } catch (error) {
            console.error("Error fetching players:", error);
            res.status(500).json({ error: "Failed to fetch players" });
        }
    };

    // Get player by ID
    getPlayerById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const player = await this.playerService.getPlayerById(parseInt(id));
            res.json(player);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch player";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error fetching player by ID:", error);
                res.status(500).json({ error: "Failed to fetch player" });
            }
        }
    };

    // Update a player
    updatePlayer = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { name, position, teamId } = req.body;
            const updatedPlayer = await this.playerService.updatePlayer(
                parseInt(id),
                name,
                position,
                teamId
            );
            res.json(updatedPlayer);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to update player";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else if (errorMessage.includes("required") || 
                      errorMessage.includes("already in use") ||
                      errorMessage.includes("must be")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error updating player:", error);
                res.status(500).json({ error: "Failed to update player" });
            }
        }
    };

    // Delete a player
    deletePlayer = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            await this.playerService.deletePlayer(parseInt(id));
            res.status(204).send();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to delete player";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error deleting player:", error);
                res.status(500).json({ error: "Failed to delete player" });
            }
        }
    };

    // Get players by team ID
    getPlayersByTeamId = async (req: Request, res: Response): Promise<void> => {
        try {
            const { teamId } = req.params;
            const players = await this.playerService.getPlayersByTeamId(parseInt(teamId));
            
            if (players.length === 0) {
                res.status(404).json({ message: "No players found for the specified team" });
                return;
            }
            
            res.json(players);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch players by team";
            
            if (errorMessage.includes("not found") || errorMessage.includes("required")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error fetching players by team ID:", error);
                res.status(500).json({ error: "Failed to fetch players by team" });
            }
        }
    };
}