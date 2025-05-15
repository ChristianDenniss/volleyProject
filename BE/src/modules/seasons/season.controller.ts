import { Request, Response } from 'express';
import { SeasonService } from './season.service.js';

export class SeasonController {
    private seasonService: SeasonService;

    constructor() {
        this.seasonService = new SeasonService();
    }

    // Create a new season
    createSeason = async (req: Request, res: Response): Promise<void> => {
        try {
            const { seasonNumber, startDate, endDate } = req.body;
            const savedSeason = await this.seasonService.createSeason(seasonNumber, startDate, endDate);
            res.status(201).json(savedSeason);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to create season";
            
            if (errorMessage.includes("required") || 
                errorMessage.includes("already exists") ||
                errorMessage.includes("must be between")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error creating season:", error);
                res.status(500).json({ error: "Failed to create season" });
            }
        }
    };

    // Get all seasons
    getSeasons = async (req: Request, res: Response): Promise<void> => {
        try {
            const seasons = await this.seasonService.getAllSeasons();
            res.json(seasons);
        } catch (error) {
            console.error("Error fetching seasons:", error);
            res.status(500).json({ error: "Failed to fetch seasons" });
        }
    };

    // Get season by ID
    getSeasonById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const season = await this.seasonService.getSeasonById(parseInt(id));
            res.json(season);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch season";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error fetching season by ID:", error);
                res.status(500).json({ error: "Failed to fetch season" });
            }
        }
    };

    // Update a season
    updateSeason = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { seasonNumber, startDate, endDate  } = req.body;
            const updatedSeason = await this.seasonService.updateSeason(
                parseInt(id),
                seasonNumber, 
                startDate, 
                endDate 
            );
            res.json(updatedSeason);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to update season";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else if (errorMessage.includes("required") || 
                       errorMessage.includes("already exists") ||
                       errorMessage.includes("must be between")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error updating season:", error);
                res.status(500).json({ error: "Failed to update season" });
            }
        }
    };

    // Delete a season
    deleteSeason = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            await this.seasonService.deleteSeason(parseInt(id));
            res.status(204).send();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to delete season";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else if (errorMessage.includes("Cannot delete")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error deleting season:", error);
                res.status(500).json({ error: "Failed to delete season" });
            }
        }
    };
}