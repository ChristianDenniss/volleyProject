import { Application, Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticateCombined } from '../../middleware/combinedAuth.js';
import { authorizeRoles } from '../../middleware/authorizeRoles.js';
import { createTeamSchema, updateTeamSchema } from './teams.schema.js';
import { TeamController } from './team.controller.js';
import { staffTeamUpdateSchema, adminTeamFlagsSchema } from '../team-registrations/team-registration.schema.js';

export function registerTeamRoutes(app: Application): void {
    const router = Router();
    const teamController = new TeamController();

    // Team routes - PROTECTED (require admin/superadmin)
    router.post('/', authenticateCombined, authorizeRoles("admin", "superadmin"), validate(createTeamSchema), teamController.createTeam);
    // Batch creation for multiple teams
    router.post('/batch', authenticateCombined, authorizeRoles("admin", "superadmin"), validate(createTeamSchema), teamController.createMultipleTeams);
    
    // GET routes - PUBLIC (for website display)
    router.get('/', teamController.getTeams);
    router.get('/skinny', teamController.getSkinnyTeams);
    router.get('/medium', teamController.getMediumTeams);
    router.get('/:id', teamController.getTeamById);
    router.get('/season/:seasonId', teamController.getTeamsBySeasonId);
    router.get('/name/:name/players', teamController.getTeamPlayersByName);
    router.get('/:teamId/players', teamController.getTeamPlayers);
    router.get('/name/:name', teamController.getTeamsByName.bind(teamController));

    // Captain / VC / CC staff edit
    router.patch(
        '/:id/staff',
        authenticateCombined,
        validate(staffTeamUpdateSchema),
        teamController.staffUpdate
    );

    // Admin flags / staff override
    router.patch(
        '/:id/flags',
        authenticateCombined,
        authorizeRoles("admin", "superadmin"),
        validate(adminTeamFlagsSchema),
        teamController.adminFlags
    );
    
    // UPDATE/DELETE routes - PROTECTED
    router.put('/:id', authenticateCombined, authorizeRoles("admin", "superadmin"), validate(updateTeamSchema), teamController.updateTeam);
    router.patch('/:id', authenticateCombined, authorizeRoles("admin", "superadmin"), validate(updateTeamSchema), teamController.updateTeam);
    router.delete('/:id', authenticateCombined, authorizeRoles("admin", "superadmin"), teamController.deleteTeam);

    // Register router with prefix
    app.use('/api/teams', router);
} 