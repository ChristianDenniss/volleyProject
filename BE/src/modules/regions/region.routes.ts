import { Application, Router } from 'express';
import { RegionController } from './region.controller.js';

export function registerRegionRoutes(app: Application): void {
    const router = Router();
    const controller = new RegionController();

    router.get('/', controller.getAllRegions);

    app.use('/api/regions', router);
}
