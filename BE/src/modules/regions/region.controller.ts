import { Request, Response } from 'express';
import { RegionService } from './region.service.js';

export class RegionController {
    private regionService: RegionService;

    constructor() {
        this.regionService = new RegionService();
    }

    getAllRegions = async (_req: Request, res: Response): Promise<void> => {
        try {
            const regions = await this.regionService.getAllRegions();
            res.status(200).json(regions);
        } catch (error) {
            console.error('Error fetching regions:', error);
            res.status(500).json({ error: 'Failed to fetch regions' });
        }
    };
}
