import { Request, Response, NextFunction } from 'express';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { RecordService, RecordFilters } from './records.service.js';
import { parsePagination, toPaginatedResult } from '../../utils/pagination.js';
import { parseRegionQuery } from '../../utils/regionQuery.js';
import { RegionService } from '../regions/region.service.js';

const RECORDS_DEFAULT_LIMIT = 10;
const RECORDS_MAX_LIMIT = 1000;

export class RecordController {
    private recordService: RecordService;
    private regionService: RegionService;

    constructor() {
        this.recordService = new RecordService();
        this.regionService = new RegionService();
    }

    createRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const recordData = req.body;
            const savedRecord = await this.recordService.createRecord(recordData);
            res.status(201).json(savedRecord);
        } catch (error) {
            next(error);
        }
    };

    getRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pagination = parsePagination(req.query, RECORDS_DEFAULT_LIMIT, RECORDS_MAX_LIMIT);
            const filters = await this.parseFilters(req);
            const [data, total] = await this.recordService.getAllRecords(pagination, filters);
            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    getRecordsBySeason = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const seasonId = parseInt(req.params.seasonId);
            const pagination = parsePagination(req.query, RECORDS_DEFAULT_LIMIT);
            const [data, total] = await this.recordService.getRecordsBySeason(seasonId, pagination);
            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    getRecordsByType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const recordType = req.params.recordType;
            const pagination = parsePagination(req.query, RECORDS_DEFAULT_LIMIT);
            const [data, total] = await this.recordService.getRecordsByType(recordType, pagination);
            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    getRecordsByPlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const playerId = parseInt(req.params.playerId);
            const pagination = parsePagination(req.query, RECORDS_DEFAULT_LIMIT);
            const [data, total] = await this.recordService.getRecordsByPlayer(playerId, pagination);
            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    getRecordById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const record = await this.recordService.getRecordById(id);
            res.json(record);
        } catch (error) {
            next(error);
        }
    };

    updateRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const updateData = req.body;
            const updatedRecord = await this.recordService.updateRecord(id, updateData);
            res.json(updatedRecord);
        } catch (error) {
            next(error);
        }
    };

    deleteRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            await this.recordService.deleteRecord(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    getTop10Records = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const recordType = req.params.recordType;
            const seasonId = parseInt(req.params.seasonId);
            const records = await this.recordService.getTop10Records(recordType, seasonId);
            res.json(records);
        } catch (error) {
            next(error);
        }
    };

    calculateAllRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.recordService.calculateAllRecords();
            res.json(result);
        } catch (error) {
            next(error);
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
