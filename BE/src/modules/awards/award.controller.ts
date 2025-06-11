import { Request, Response } from 'express';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { AwardService } from './award.service.js';
import { CreateAwardDto, CreateMultipleAwardsDto, UpdateAwardDto } from './awards.schema.js';

export class AwardController {
    private awardService: AwardService;

    constructor(awardService: AwardService) {
        this.awardService = awardService;
    }

    // Create a new award
    createAward = async (req: Request, res: Response): Promise<void> => {
        try {
            const awardData: CreateAwardDto = req.body;
            const savedAward = await this.awardService.createAward(awardData);
            
            res.status(201).json(savedAward);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to create award";
            
            if (errorMessage.includes("required") || 
                errorMessage.includes("not found") || 
                errorMessage.includes("already in use") ||
                errorMessage.includes("must be")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error creating award:", error);
                res.status(500).json({ error: "Failed to create award" });
            }
        }
    };

    // Create multiple awards
    createMultipleAwards = async (req: Request, res: Response): Promise<void> => {
        try {
            const awardsData: CreateMultipleAwardsDto = req.body;
            const savedAwards = await this.awardService.createMultipleAwards(awardsData);
            
            res.status(201).json(savedAwards);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to create multiple awards";
            
            if (errorMessage.includes("required") || 
                errorMessage.includes("not found") || 
                errorMessage.includes("already in use") ||
                errorMessage.includes("must be")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error creating multiple awards:", error);
                res.status(500).json({ error: "Failed to create multiple awards" });
            }
        }
    };

    // Get all awards
    getAwards = async (req: Request, res: Response): Promise<void> => {
        try {
            const awards = await this.awardService.findAllAwards();
            res.json(awards);
        } catch (error) {
            console.error("Error fetching awards:", error);
            res.status(500).json({ error: "Failed to fetch awards" });
        }
    };

    // Get award by ID
    getAwardById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const award = await this.awardService.findAwardById(parseInt(id));
            res.json(award);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch award";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error fetching award by ID:", error);
                res.status(500).json({ error: "Failed to fetch award" });
            }
        }
    };

    // Get awards by type
    getAwardsByType = async (req: Request, res: Response): Promise<void> => {
        try {
            const { type } = req.params;
            const awards = await this.awardService.findAwardsByType(type);
            res.json(awards);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch awards by type";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error fetching awards by type:", error);
                res.status(500).json({ error: "Failed to fetch awards by type" });
            }
        }
    };

    // Get awards by season
    getAwardsBySeason = async (req: Request, res: Response): Promise<void> => {
        try {
            const { seasonNumber } = req.params;
            const awards = await this.awardService.findAwardsBySeason(parseInt(seasonNumber));
            res.json(awards);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch awards by season";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error fetching awards by season:", error);
                res.status(500).json({ error: "Failed to fetch awards by season" });
            }
        }
    };

    // Update an award
    updateAward = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const awardData: UpdateAwardDto = req.body;  // Don't add ID to payload
            const updatedAward = await this.awardService.updateAward(parseInt(id), awardData);
            res.json(updatedAward);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to update award";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else if (errorMessage.includes("required") || 
                      errorMessage.includes("already in use") ||
                      errorMessage.includes("must be")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error updating award:", error);
                res.status(500).json({ error: "Failed to update award" });
            }
        }
    };

    // Delete an award
    deleteAward = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            await this.awardService.removeAward(parseInt(id));
            res.status(204).send();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to delete award";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error deleting award:", error);
                res.status(500).json({ error: "Failed to delete award" });
            }
        }
    };

    // Create award with player name
    createAwardWithPlayerNames = async (req: Request, res: Response): Promise<void> => {
        console.log('Controller: Received request to create award with player names');
        console.log('Controller: Request body:', req.body);
        try {
            const { description, type, seasonId, playerName, imageUrl } = req.body;
            console.log('Controller: Extracted data:', { description, type, seasonId, playerName, imageUrl });
            
            const savedAward = await this.awardService.createAwardWithPlayerNames(
                description,
                type,
                seasonId,
                playerName,
                imageUrl
            );
            
            res.status(201).json(savedAward);
        } catch (error) {
            console.error('Controller: Error in createAwardWithPlayerNames:', error);
            const errorMessage = error instanceof Error ? error.message : "Failed to create award";
            
            if (errorMessage.includes("required") || 
                errorMessage.includes("not found") || 
                errorMessage.includes("already in use") ||
                errorMessage.includes("must be")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Controller: Error creating award with player names:", error);
                res.status(500).json({ error: errorMessage });
            }
        }
    };

    /**
     * Get all awards for a specific player
     * @param req - Express request object
     * @param res - Express response object
     */
    getAwardsByPlayerId = async (req: Request, res: Response): Promise<void> => {
        try {
            const playerId = parseInt(req.params.playerId);
            
            if (isNaN(playerId)) {
                res.status(400).json({ error: 'Invalid player ID' });
                return;
            }

            const awards = await this.awardService.getAwardsByPlayerId(playerId);
            res.json(awards);
        } catch (error) {
            if (error instanceof NotFoundError) {
                res.status(404).json({ error: error.message });
            } else {
                console.error('Error getting awards by player ID:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
} 