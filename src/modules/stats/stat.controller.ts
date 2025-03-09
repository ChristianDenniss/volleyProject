import { Request, Response } from 'express';
import { StatService } from './stat.service';

export class StatController {
    private statService: StatService;

    constructor() {
        this.statService = new StatService();
    }

    // Create a new stat entry
    createStat = async (req: Request, res: Response): Promise<void> => {
        try {
            const { spikingErrors, apeKills, apeAttempts, spikeKills, spikeAttempts, assists, blocks, digs, blockFollows, aces, miscErrors, playerId, gameId } = req.body;
            const savedStat = await this.statService.createStat(
                spikingErrors,
                apeKills,
                apeAttempts,
                spikeKills,
                spikeAttempts,
                assists,
                blocks,
                digs,
                blockFollows,
                aces,
                miscErrors,
                playerId,
                gameId
            );
            
            res.status(201).json(savedStat);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to create stat";
            
            if (errorMessage.includes("required") || 
                errorMessage.includes("not found") || 
                errorMessage.includes("cannot be negative") ||
                errorMessage.includes("already exist") ||
                errorMessage.includes("not part of")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error creating stat:", error);
                res.status(500).json({ error: "Failed to create stat" });
            }
        }
    };

    // Get all stats
    getStats = async (req: Request, res: Response): Promise<void> => {
        try {
            const stats = await this.statService.getAllStats();
            res.json(stats);
        } catch (error) {
            console.error("Error fetching stats:", error);
            res.status(500).json({ error: "Failed to fetch stats" });
        }
    };

    // Get stat by ID
    getStatById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const stat = await this.statService.getStatById(parseInt(id));
            res.json(stat);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch stat";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error fetching stat by ID:", error);
                res.status(500).json({ error: "Failed to fetch stat" });
            }
        }
    };

    // Update a stat entry
    updateStat = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { points, assists, blocks, digs, aces, playerId, gameId } = req.body;
            const updatedStat = await this.statService.updateStat(
                parseInt(id),
                points,
                assists,
                blocks,
                digs,
                aces,
                playerId,
                gameId
            );
            res.json(updatedStat);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to update stat";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else if (errorMessage.includes("required") || 
                       errorMessage.includes("cannot be negative") ||
                       errorMessage.includes("already exist") ||
                       errorMessage.includes("not part of")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error updating stat:", error);
                res.status(500).json({ error: "Failed to update stat" });
            }
        }
    };

    // Delete a stat entry
    deleteStat = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            await this.statService.deleteStat(parseInt(id));
            res.status(204).send();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to delete stat";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error deleting stat:", error);
                res.status(500).json({ error: "Failed to delete stat" });
            }
        }
    };

    // Get stats by player ID
    getStatsByPlayerId = async (req: Request, res: Response): Promise<void> => {
        try {
            const { playerId } = req.params;
            const stats = await this.statService.getStatsByPlayerId(parseInt(playerId));
            
            if (stats.length === 0) {
                res.status(404).json({ message: "No stats found for the specified player" });
                return;
            }
            
            res.json(stats);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch stats by player";
            
            if (errorMessage.includes("not found") || errorMessage.includes("required")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error fetching stats by player ID:", error);
                res.status(500).json({ error: "Failed to fetch stats by player" });
            }
        }
    };

    // Get stats by game ID
    getStatsByGameId = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;
            const stats = await this.statService.getStatsByGameId(parseInt(gameId));
            
            if (stats.length === 0) {
                res.status(404).json({ message: "No stats found for the specified game" });
                return;
            }
            
            res.json(stats);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch stats by game";
            
            if (errorMessage.includes("not found") || errorMessage.includes("required")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error fetching stats by game ID:", error);
                res.status(500).json({ error: "Failed to fetch stats by game" });
            }
        }
    };
}