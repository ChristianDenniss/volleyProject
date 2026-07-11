import { Application, Router } from 'express';
import { RecordController } from './records.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticateCombined } from '../../middleware/combinedAuth.js';
import { authorizeRoles } from '../../middleware/authorizeRoles.js';
import { createRecordSchema, updateRecordSchema } from './records.schema.js';

export function registerRecordRoutes(app: Application): void {
    const router = Router();
    const recordController = new RecordController();

    // Record routes - PROTECTED (require admin/superadmin)
    router.post('/', authenticateCombined, authorizeRoles("admin", "superadmin"), validate(createRecordSchema), recordController.createRecord);

    // Calculate all records across all seasons - PROTECTED
    router.post('/calculate', authenticateCombined, authorizeRoles("admin", "superadmin"), recordController.calculateAllRecords);

    // GET routes - PUBLIC (for website display)
    router.get('/', recordController.getRecords);
    router.get('/season/:seasonId', recordController.getRecordsBySeason);
    router.get('/type/:recordType', recordController.getRecordsByType);
    router.get('/player/:playerId', recordController.getRecordsByPlayer);
    router.get('/top10/:recordType/:seasonId', recordController.getTop10Records);
    router.get('/:id', recordController.getRecordById);
    
    // UPDATE/DELETE routes - PROTECTED
    router.put('/:id', authenticateCombined, authorizeRoles("admin", "superadmin"), recordController.updateRecord);
    router.patch('/:id', authenticateCombined, authorizeRoles("admin", "superadmin"), validate(updateRecordSchema), recordController.updateRecord);
    router.delete('/:id', authenticateCombined, authorizeRoles("admin", "superadmin"), recordController.deleteRecord);

    app.use('/api/records', router);
}
