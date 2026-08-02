import { Request, Response, NextFunction } from 'express';
import { RegionService } from './region.service.js';

export class RegionController {
    private regionService: RegionService;

    constructor() {
        this.regionService = new RegionService();
    }

    getAllRegions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const regions = await this.regionService.getAllRegions();
            res.status(200).json(regions);
        } catch (error) {
            next(error);
        }
    };
}
