import { Request, Response } from 'express';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { RecordService, RecordFilters } from './records.service.js';
import { parsePagination, toPaginatedResult } from '../../utils/pagination.js';
import { parseRegionQuery } from '../../utils/regionQuery.js';
import { RegionService } from '../regions/region.service.js';

const RECORDS_DEFAULT_LIMIT = 10;
// calculateAllRecords() keeps a fixed top-10 per record-type × type-variant (game/season),
// so the table is structurally bounded — raise the max so a single request can return the
// full filtered board set rather than silently truncating groups at the default 100.
const RECORDS_MAX_LIMIT = 1000;

export class RecordController {
    private recordService: RecordService;
    private regionService: RegionService;

    constructor() {
        this.recordService = new RecordService();
        this.regionService = new RegionService();
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
            const pagination = parsePagination(req.query, RECORDS_DEFAULT_LIMIT, RECORDS_MAX_LIMIT);
            const filters = await this.parseFilters(req);
            const [data, total] = await this.recordService.getAllRecords(pagination, filters);
            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            console.error("Error fetching records:", error);
            res.status(500).json({ error: "Failed to fetch records" });
        }
    };

    // Get records by season
    getRecordsBySeason = async (req: Request, res: Response): Promise<void> => {
        try {
            const seasonId = parseInt(req.params.seasonId);
            const pagination = parsePagination(req.query, RECORDS_DEFAULT_LIMIT);
            const [data, total] = await this.recordService.getRecordsBySeason(seasonId, pagination);
            res.json(toPaginatedResult(data, total, pagination));
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
            const pagination = parsePagination(req.query, RECORDS_DEFAULT_LIMIT);
            const [data, total] = await this.recordService.getRecordsByType(recordType, pagination);
            res.json(toPaginatedResult(data, total, pagination));
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
            const pagination = parsePagination(req.query, RECORDS_DEFAULT_LIMIT);
            const [data, total] = await this.recordService.getRecordsByPlayer(playerId, pagination);
            res.json(toPaginatedResult(data, total, pagination));
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

    private async parseFilters(req: Request): Promise<RecordFilters> {
        const { type, recordCategory } = req.query;
        const regionFilter = parseRegionQuery(req.query as Record<string, unknown>);
        const regionId = await this.regionService.resolveRegionId(regionFilter);
        const typeValue = typeof type === 'string' && (type === 'game' || type === 'season') ? type : undefined;
        return {
            regionId,
            type: typeValue,
            recordCategory: typeof recordCategory === 'string' && recordCategory.length > 0 ? recordCategory : undefined,
        };
    }
}
