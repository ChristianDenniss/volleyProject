import { Request, Response } from 'express';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { RecordService } from './records.service.js';

export class RecordController {
    private recordService: RecordService;

    constructor() {
        this.recordService = new RecordService();
    }

    // Create a new record
    createRecord = async (req: Request, res: Response): Promise<void> => {
        try {
            const recordData = req.body;
            const savedRecord = await this.recordService.createRecord(recordData);
            
            res.status(201).json(savedRecord);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to create record";
            
            if (errorMessage.includes("required") || 
                errorMessage.includes("not found") || 
                errorMessage.includes("already exists") ||
                errorMessage.includes("must be") ||
                errorMessage.includes("between")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error creating record:", error);
                res.status(500).json({ error: "Failed to create record" });
            }
        }
    };

    // Get all records
    getRecords = async (req: Request, res: Response): Promise<void> => {
        try {
            const records = await this.recordService.getAllRecords();
            res.json(records);
        } catch (error) {
            console.error("Error fetching records:", error);
            res.status(500).json({ error: "Failed to fetch records" });
        }
    };

    // Get records by season
    getRecordsBySeason = async (req: Request, res: Response): Promise<void> => {
        try {
            const seasonId = parseInt(req.params.seasonId);
            const records = await this.recordService.getRecordsBySeason(seasonId);
            res.json(records);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch records by season";
            
            if (error instanceof MissingFieldError) {
                res.status(400).json({ error: errorMessage });
            } else if (error instanceof NotFoundError) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error fetching records by season:", error);
                res.status(500).json({ error: "Failed to fetch records by season" });
            }
        }
    };

    // Get records by type
    getRecordsByType = async (req: Request, res: Response): Promise<void> => {
        try {
            const recordType = req.params.recordType;
            const records = await this.recordService.getRecordsByType(recordType);
            res.json(records);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch records by type";
            
            if (error instanceof MissingFieldError) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error fetching records by type:", error);
                res.status(500).json({ error: "Failed to fetch records by type" });
            }
        }
    };

    // Get records by player
    getRecordsByPlayer = async (req: Request, res: Response): Promise<void> => {
        try {
            const playerId = parseInt(req.params.playerId);
            const records = await this.recordService.getRecordsByPlayer(playerId);
            res.json(records);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch records by player";
            
            if (error instanceof MissingFieldError) {
                res.status(400).json({ error: errorMessage });
            } else if (error instanceof NotFoundError) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error fetching records by player:", error);
                res.status(500).json({ error: "Failed to fetch records by player" });
            }
        }
    };

    // Get record by ID
    getRecordById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const record = await this.recordService.getRecordById(id);
            res.json(record);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch record";
            
            if (error instanceof MissingFieldError) {
                res.status(400).json({ error: errorMessage });
            } else if (error instanceof NotFoundError) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error fetching record:", error);
                res.status(500).json({ error: "Failed to fetch record" });
            }
        }
    };

    // Update a record
    updateRecord = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const updateData = req.body;
            const updatedRecord = await this.recordService.updateRecord(id, updateData);
            res.json(updatedRecord);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to update record";
            
            if (error instanceof MissingFieldError) {
                res.status(400).json({ error: errorMessage });
            } else if (error instanceof NotFoundError) {
                res.status(404).json({ error: errorMessage });
            } else if (errorMessage.includes("must be between")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error updating record:", error);
                res.status(500).json({ error: "Failed to update record" });
            }
        }
    };

    // Delete a record
    deleteRecord = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            await this.recordService.deleteRecord(id);
            res.status(204).send();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to delete record";
            
            if (error instanceof MissingFieldError) {
                res.status(400).json({ error: errorMessage });
            } else if (error instanceof NotFoundError) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error deleting record:", error);
                res.status(500).json({ error: "Failed to delete record" });
            }
        }
    };

    // Get top 10 records for a specific record type and season
    getTop10Records = async (req: Request, res: Response): Promise<void> => {
        try {
            const recordType = req.params.recordType;
            const seasonId = parseInt(req.params.seasonId);
            const records = await this.recordService.getTop10Records(recordType, seasonId);
            res.json(records);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch top 10 records";
            
            if (error instanceof MissingFieldError) {
                res.status(400).json({ error: errorMessage });
            } else if (error instanceof NotFoundError) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error fetching top 10 records:", error);
                res.status(500).json({ error: "Failed to fetch top 10 records" });
            }
        }
    };

    // Calculate all records across all seasons
    calculateAllRecords = async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await this.recordService.calculateAllRecords();
            res.json(result);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to calculate records";
            
            if (errorMessage.includes("No stats found")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error calculating records:", error);
                res.status(500).json({ error: "Failed to calculate records" });
            }
        }
    };
}
