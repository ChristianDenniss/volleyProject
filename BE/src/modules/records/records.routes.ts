import { Application, Router } from 'express';
import { RecordController } from './records.controller.js';
import { validate } from '../../middleware/validate.js';
import { createRecordSchema, updateRecordSchema } from './records.schema.js';

export function registerRecordRoutes(app: Application): void {
    const router = Router();
    const recordController = new RecordController();

    // Record routes
    router.post('/', validate(createRecordSchema), recordController.createRecord);
    router.get('/', recordController.getRecords);
    
    // Get records by season
    router.get('/season/:seasonId', recordController.getRecordsBySeason);
    
    // Get records by type
    router.get('/type/:recordType', recordController.getRecordsByType);
    
    // Get records by player
    router.get('/player/:playerId', recordController.getRecordsByPlayer);
    
    // Get top 10 records for a specific record type and season
    router.get('/top10/:recordType/:seasonId', recordController.getTop10Records);
    
    // Calculate all records across all seasons
    router.post('/calculate', recordController.calculateAllRecords);

    // Individual record routes (must come after specific routes)
    router.get('/:id', recordController.getRecordById);
    router.put('/:id', recordController.updateRecord);
    router.patch('/:id', validate(updateRecordSchema), recordController.updateRecord);
    router.delete('/:id', recordController.deleteRecord);

    app.use('/api/records', router);
}
