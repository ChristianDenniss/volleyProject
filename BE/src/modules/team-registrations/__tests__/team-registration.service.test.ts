import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { TeamRegistrationService } from '../team-registration.service.js';
import { NotFoundError } from '../../../errors/NotFoundError.js';
import { ConflictError } from '../../../errors/ConflictError.js';
import { UnauthorizedError } from '../../../errors/UnauthorizedError.js';

const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
};

const mockSeasonRepo = { find: jest.fn(), findOne: jest.fn() };
const mockTeamRepo = { findOne: jest.fn(), save: jest.fn() };
const mockPlayerRepo = { findOne: jest.fn(), save: jest.fn() };
const mockUserRepo = { findOne: jest.fn() };

const mockRegionService = {
    requireRegionByCode: jest.fn(),
    getRegionById: jest.fn(),
};

const mockUserService = {
    promoteRoleIfUser: jest.fn(),
};

const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
};

const OPEN_SEASON = { id: 1, seasonNumber: 5, regionId: 1, registrationsOpen: true, maxTeams: 16 } as any;

function roster(size = 10, prefix = 'player') {
    return Array.from({ length: size }, (_, i) => ({ discord: `d${i}`, roblox: `${prefix}${i}` }));
}

function validDto(overrides: Record<string, unknown> = {}) {
    return {
        region: 'na',
        teamName: '  Spikers  ',
        hexColor: '#ff0000',
        brickColor: '  Really red  ',
        captainDiscord: '  cap#1  ',
        captainRoblox: '  CaptainGuy  ',
        viceDiscord: ' vice ',
        viceRoblox: ' ViceGuy ',
        roster: roster(),
        priorLeagueExperience: '  none  ',
        ...overrides,
    } as any;
}

function registration(overrides: Record<string, unknown> = {}) {
    return {
        id: 7,
        submittedByUserId: 3,
        regionId: 1,
        seasonId: 1,
        teamName: 'Spikers',
        hexColor: '#ff0000',
        brickColor: 'Really red',
        captainDiscord: 'cap#1',
        captainRoblox: 'captainguy',
        viceDiscord: 'vice',
        viceRoblox: 'viceguy',
        roster: roster(),
        status: 'pending',
        createdTeamId: null,
        conflictPayload: null,
        captainLinkPending: false,
        season: OPEN_SEASON,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        ...overrides,
    } as any;
}

describe('TeamRegistrationService', () => {
    let service: TeamRegistrationService;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRepo.save.mockImplementation(async (entity: any) => entity);
        mockTeamRepo.save.mockImplementation(async (entity: any) => ({ ...entity, id: 100 }));
        mockPlayerRepo.save.mockImplementation(async (entity: any) => entity);
        mockRegionService.requireRegionByCode.mockResolvedValue({ id: 1, code: 'na' } as never);
        mockQueryBuilder.leftJoinAndSelect.mockReturnThis();
        mockQueryBuilder.orderBy.mockReturnThis();
        mockQueryBuilder.addOrderBy.mockReturnThis();
        mockQueryBuilder.andWhere.mockReturnThis();
        mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        service = new TeamRegistrationService();
        (service as any).repo = mockRepo;
        (service as any).seasonRepo = mockSeasonRepo;
        (service as any).teamRepo = mockTeamRepo;
        (service as any).playerRepo = mockPlayerRepo;
        (service as any).userRepo = mockUserRepo;
        (service as any).regionService = mockRegionService;
        (service as any).userService = mockUserService;
    });

    describe('submit', () => {
        it('refuses when no season in the region has registrations open', async () => {
            mockSeasonRepo.find.mockResolvedValueOnce([] as never);

            await expect(service.submit(3, validDto())).rejects.toThrow(
                'Team registrations are not open for this region'
            );
        });

        it('refuses when more than one season is open, rather than guessing', async () => {
            mockSeasonRepo.find.mockResolvedValueOnce([OPEN_SEASON, { ...OPEN_SEASON, id: 2 }] as never);

            await expect(service.submit(3, validDto())).rejects.toThrow('Multiple seasons have registrations open');
        });

        it('refuses a second application when one is already accepted', async () => {
            mockSeasonRepo.find.mockResolvedValueOnce([OPEN_SEASON] as never);
            mockRepo.findOne.mockResolvedValueOnce(registration({ status: 'accepted' }) as never);

            await expect(service.submit(3, validDto())).rejects.toThrow('already have an accepted team');
        });

        it('refuses a second application while one is still pending', async () => {
            mockSeasonRepo.find.mockResolvedValueOnce([OPEN_SEASON] as never);
            mockRepo.findOne.mockResolvedValueOnce(registration({ status: 'pending' }) as never);

            await expect(service.submit(3, validDto())).rejects.toThrow('already have an active application');
        });

        it('trims the team name and normalizes the roblox handles', async () => {
            mockSeasonRepo.find.mockResolvedValueOnce([OPEN_SEASON] as never);
            mockRepo.findOne.mockResolvedValueOnce(null as never);

            const saved = await service.submit(3, validDto());

            expect(saved.teamName).toBe('Spikers');
            expect(saved.captainRoblox).toBe('captainguy');
            expect(saved.viceRoblox).toBe('viceguy');
            expect(saved.brickColor).toBe('Really red');
        });

        it('normalizes every roster entry', async () => {
            mockSeasonRepo.find.mockResolvedValueOnce([OPEN_SEASON] as never);
            mockRepo.findOne.mockResolvedValueOnce(null as never);

            const saved = await service.submit(3, validDto({ roster: [{ discord: ' D ', roblox: '  MiXeD  ' }] }));

            expect(saved.roster[0]).toEqual({ discord: 'D', roblox: 'mixed' });
        });

        it('files the application as pending against the open season', async () => {
            mockSeasonRepo.find.mockResolvedValueOnce([OPEN_SEASON] as never);
            mockRepo.findOne.mockResolvedValueOnce(null as never);

            const saved = await service.submit(3, validDto());

            expect(saved).toMatchObject({ status: 'pending', seasonId: 1, regionId: 1, submittedByUserId: 3 });
        });

        it('stores a blank prior-experience note as null', async () => {
            mockSeasonRepo.find.mockResolvedValueOnce([OPEN_SEASON] as never);
            mockRepo.findOne.mockResolvedValueOnce(null as never);

            const saved = await service.submit(3, validDto({ priorLeagueExperience: '   ' }));

            expect(saved.priorLeagueExperience).toBeNull();
        });
    });

    describe('updatePending', () => {
        it('throws NotFoundError for an unknown application', async () => {
            mockRepo.findOne.mockResolvedValueOnce(null as never);

            await expect(service.updatePending(3, 7, {} as any)).rejects.toThrow(NotFoundError);
        });

        it('refuses to edit someone else\'s application', async () => {
            mockRepo.findOne.mockResolvedValueOnce(registration({ submittedByUserId: 99 }) as never);

            await expect(service.updatePending(3, 7, {} as any)).rejects.toThrow(UnauthorizedError);
        });

        it('refuses to edit an application that is no longer pending', async () => {
            mockRepo.findOne.mockResolvedValueOnce(registration({ status: 'accepted' }) as never);

            await expect(service.updatePending(3, 7, {} as any)).rejects.toThrow('Only pending applications can be edited');
        });

        it('applies only the supplied fields', async () => {
            mockRepo.findOne.mockResolvedValueOnce(registration() as never);

            const updated = await service.updatePending(3, 7, { teamName: '  Renamed  ' } as any);

            expect(updated.teamName).toBe('Renamed');
            expect(updated.brickColor).toBe('Really red');
        });

        it('normalizes an updated roster', async () => {
            mockRepo.findOne.mockResolvedValueOnce(registration() as never);

            const updated = await service.updatePending(3, 7, {
                roster: [{ discord: ' A ', roblox: ' BIG ' }],
            } as any);

            expect(updated.roster).toEqual([{ discord: 'A', roblox: 'big' }]);
        });

        it('clears the prior-experience note when blanked', async () => {
            mockRepo.findOne.mockResolvedValueOnce(registration({ priorLeagueExperience: 'lots' }) as never);

            const updated = await service.updatePending(3, 7, { priorLeagueExperience: '' } as any);

            expect(updated.priorLeagueExperience).toBeNull();
        });
    });

    describe('withdraw', () => {
        it('removes a pending application', async () => {
            const row = registration();
            mockRepo.findOne.mockResolvedValueOnce(row as never);

            await service.withdraw(3, 7);

            expect(mockRepo.remove).toHaveBeenCalledWith(row);
        });

        it('removes an application stuck in conflict', async () => {
            mockRepo.findOne.mockResolvedValueOnce(registration({ status: 'conflict' }) as never);

            await service.withdraw(3, 7);

            expect(mockRepo.remove).toHaveBeenCalled();
        });

        it('refuses to withdraw an accepted application', async () => {
            mockRepo.findOne.mockResolvedValueOnce(registration({ status: 'accepted' }) as never);

            await expect(service.withdraw(3, 7)).rejects.toThrow(ConflictError);
        });

        it('refuses to withdraw someone else\'s application', async () => {
            mockRepo.findOne.mockResolvedValueOnce(registration({ submittedByUserId: 99 }) as never);

            await expect(service.withdraw(3, 7)).rejects.toThrow(UnauthorizedError);
        });
    });

    describe('list', () => {
        it('resolves a region code into an id filter', async () => {
            mockQueryBuilder.getMany.mockResolvedValueOnce([] as never);

            await service.list({ region: 'na' as any });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('r.regionId = :regionId', { regionId: 1 });
        });

        it('prefers an explicit region id over a code lookup', async () => {
            mockQueryBuilder.getMany.mockResolvedValueOnce([] as never);

            await service.list({ regionId: 5, region: 'na' as any });

            expect(mockRegionService.requireRegionByCode).not.toHaveBeenCalled();
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('r.regionId = :regionId', { regionId: 5 });
        });

        it('filters by season and status', async () => {
            mockQueryBuilder.getMany.mockResolvedValueOnce([] as never);

            await service.list({ seasonId: 2, status: 'pending' });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('r.seasonId = :seasonId', { seasonId: 2 });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('r.status = :status', { status: 'pending' });
        });

        it('adds no filters when given none', async () => {
            mockQueryBuilder.getMany.mockResolvedValueOnce([] as never);

            await service.list({});

            expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
        });

        it('sorts accepted applications to the top', async () => {
            mockQueryBuilder.getMany.mockResolvedValueOnce([] as never);

            await service.list({});

            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
                "CASE WHEN r.status = 'accepted' THEN 0 ELSE 1 END",
                'ASC'
            );
        });
    });

    describe('toPublicDto', () => {
        it('exposes the captain contact but not the rest of the roster', () => {
            const dto: any = service.toPublicDto(registration());

            expect(dto.captainDiscord).toBe('cap#1');
            expect(dto).not.toHaveProperty('roster');
            expect(dto).not.toHaveProperty('viceRoblox');
        });

        it('summarizes the season rather than embedding the whole entity', () => {
            const dto: any = service.toPublicDto(registration());

            expect(dto.season).toEqual({
                id: 1,
                seasonNumber: 5,
                startDate: undefined,
                maxTeams: 16,
                registrationsOpen: true,
            });
        });

        it('leaves the season undefined when it was not loaded', () => {
            const dto: any = service.toPublicDto(registration({ season: undefined }));

            expect(dto.season).toBeUndefined();
        });
    });

    describe('toDetailDto', () => {
        it('adds the roster and the rest of the application', () => {
            const dto: any = service.toDetailDto(registration());

            expect(dto.roster).toHaveLength(10);
            expect(dto.viceRoblox).toBe('viceguy');
        });

        it('withholds the conflict payload from non-admin readers', () => {
            const dto: any = service.toDetailDto(registration({ conflictPayload: { conflicts: [] } }));

            expect(dto).not.toHaveProperty('conflictPayload');
        });

        it('includes the conflict payload for admins', () => {
            const payload = { conflicts: [] };
            const dto: any = service.toDetailDto(registration({ conflictPayload: payload }), true);

            expect(dto.conflictPayload).toBe(payload);
        });

        it('summarizes the submitting user', () => {
            const dto: any = service.toDetailDto(
                registration({ submittedBy: { id: 3, username: 'cap', password: 'secret' } })
            );

            expect(dto.submittedBy).toEqual({ id: 3, username: 'cap' });
        });
    });

    describe('getById', () => {
        it('throws NotFoundError when the application is gone', async () => {
            mockRepo.findOne.mockResolvedValueOnce(null as never);

            await expect(service.getById(7)).rejects.toThrow(NotFoundError);
        });
    });

    describe('summary', () => {
        it('reports nothing when there is no season to report on', async () => {
            await expect(service.summary()).resolves.toEqual({
                accepted: 0,
                spotsLeft: null,
                capacity: null,
                seasonId: null,
            });
        });

        it('counts accepted teams against the cap', async () => {
            mockSeasonRepo.findOne.mockResolvedValueOnce(OPEN_SEASON as never);
            mockRepo.count.mockResolvedValueOnce(6 as never);

            const result: any = await service.summary(undefined, 1);

            expect(result).toMatchObject({ accepted: 6, capacity: 16, spotsLeft: 10, seasonId: 1 });
        });

        it('never reports a negative number of spots left', async () => {
            mockSeasonRepo.findOne.mockResolvedValueOnce({ ...OPEN_SEASON, maxTeams: 4 } as never);
            mockRepo.count.mockResolvedValueOnce(6 as never);

            const result: any = await service.summary(undefined, 1);

            expect(result.spotsLeft).toBe(0);
        });

        it('reports an uncapped season as having no spot limit', async () => {
            mockSeasonRepo.findOne.mockResolvedValueOnce({ ...OPEN_SEASON, maxTeams: null } as never);
            mockRepo.count.mockResolvedValueOnce(6 as never);

            const result: any = await service.summary(undefined, 1);

            expect(result.spotsLeft).toBeNull();
            expect(result.capacity).toBeNull();
        });

        it('falls back to the latest season when the region has none open', async () => {
            mockSeasonRepo.findOne
                .mockResolvedValueOnce(null as never)
                .mockResolvedValueOnce({ ...OPEN_SEASON, registrationsOpen: false } as never);
            mockRepo.count.mockResolvedValueOnce(2 as never);

            const result: any = await service.summary('na' as any);

            expect(result.seasonId).toBe(1);
            expect(result.registrationsOpen).toBe(false);
        });
    });

    describe('detectConflicts', () => {
        it('reports a team name already used that season', async () => {
            mockTeamRepo.findOne.mockResolvedValueOnce({ id: 50, name: 'Spikers' } as never);

            const conflicts = await service.detectConflicts(1, 1, 'Spikers', []);

            expect(conflicts).toEqual([{ type: 'name', teamName: 'Spikers', existingTeamId: 50 }]);
        });

        it('does not report the registration\'s own team as a name clash', async () => {
            mockTeamRepo.findOne.mockResolvedValueOnce({ id: 50, name: 'Spikers' } as never);

            const conflicts = await service.detectConflicts(1, 1, 'Spikers', [], 50);

            expect(conflicts).toEqual([]);
        });

        it('reports a player already rostered elsewhere that season', async () => {
            mockTeamRepo.findOne.mockResolvedValueOnce(null as never);
            mockPlayerRepo.findOne.mockResolvedValueOnce({
                id: 9,
                robloxUsername: 'taken',
                teams: [{ id: 60, name: 'Other', season: { id: 1 } }],
            } as never);

            const conflicts = await service.detectConflicts(1, 1, 'Spikers', [{ discord: 'd', roblox: 'TAKEN' }]);

            expect(conflicts).toEqual([
                { type: 'player', roblox: 'taken', existingTeamId: 60, existingTeamName: 'Other', playerId: 9 },
            ]);
        });

        it('ignores a player whose other team is in a different season', async () => {
            mockTeamRepo.findOne.mockResolvedValueOnce(null as never);
            mockPlayerRepo.findOne.mockResolvedValueOnce({
                id: 9,
                teams: [{ id: 60, name: 'Old', season: { id: 99 } }],
            } as never);

            await expect(
                service.detectConflicts(1, 1, 'Spikers', [{ discord: 'd', roblox: 'free' }])
            ).resolves.toEqual([]);
        });

        it('ignores a player who is on no team at all', async () => {
            mockTeamRepo.findOne.mockResolvedValueOnce(null as never);
            mockPlayerRepo.findOne.mockResolvedValueOnce({ id: 9, teams: [] } as never);

            await expect(
                service.detectConflicts(1, 1, 'Spikers', [{ discord: 'd', roblox: 'free' }])
            ).resolves.toEqual([]);
        });

        it('ignores a player who does not exist yet', async () => {
            mockTeamRepo.findOne.mockResolvedValueOnce(null as never);
            mockPlayerRepo.findOne.mockResolvedValueOnce(null as never);

            await expect(
                service.detectConflicts(1, 1, 'Spikers', [{ discord: 'd', roblox: 'new' }])
            ).resolves.toEqual([]);
        });
    });

    describe('tryAccept', () => {
        beforeEach(() => {
            mockRepo.findOne.mockResolvedValue(registration() as never);
            mockTeamRepo.findOne.mockResolvedValue(null as never);
            mockPlayerRepo.findOne.mockResolvedValue(null as never);
            mockUserRepo.findOne.mockResolvedValue(null as never);
        });

        it('refuses an application that is already accepted', async () => {
            mockRepo.findOne.mockResolvedValueOnce(registration({ status: 'accepted' }) as never);

            await expect(service.tryAccept(7, 1)).rejects.toThrow('Already accepted');
        });

        it('refuses an application that was denied', async () => {
            mockRepo.findOne.mockResolvedValueOnce(registration({ status: 'denied' }) as never);

            await expect(service.tryAccept(7, 1)).rejects.toThrow('Registration is denied');
        });

        it('refuses to accept once exclusions drop the roster below ten', async () => {
            const exclusions = new Set(['player0', 'player1']);

            await expect(service.tryAccept(7, 1, { exclusions })).rejects.toThrow(
                'Roster must have at least 10 players after exclusions'
            );
        });

        it('parks the application in conflict rather than creating a team', async () => {
            mockTeamRepo.findOne.mockResolvedValue({ id: 50, name: 'Spikers' } as never);

            const result = await service.tryAccept(7, 1);

            expect(result.ok).toBe(false);
            expect((result as any).registration.status).toBe('conflict');
            expect((result as any).registration.conflictPayload.conflicts).toHaveLength(1);
            expect(mockTeamRepo.save).not.toHaveBeenCalled();
        });

        it('creates the team when nothing conflicts', async () => {
            const result = await service.tryAccept(7, 1);

            expect(result.ok).toBe(true);
            expect((result as any).team).toMatchObject({
                name: 'Spikers',
                regionId: 1,
                captainEditEnabled: true,
                placement: 'Didnt make playoffs',
            });
        });

        it('marks the registration accepted and records the new team id', async () => {
            const result: any = await service.tryAccept(7, 1);

            expect(result.registration.status).toBe('accepted');
            expect(result.registration.createdTeamId).toBe(100);
            expect(result.registration.conflictPayload).toBeNull();
        });

        it('hands the team to the linked captain account when there is one', async () => {
            mockUserRepo.findOne.mockResolvedValue({ id: 42, robloxUsername: 'captainguy' } as never);

            const result: any = await service.tryAccept(7, 1);

            expect(result.team.captainUserId).toBe(42);
            expect(result.registration.captainLinkPending).toBe(false);
        });

        it('falls back to the submitter and flags the link as pending', async () => {
            const result: any = await service.tryAccept(7, 1);

            expect(result.team.captainUserId).toBe(3);
            expect(result.registration.captainLinkPending).toBe(true);
        });

        it('promotes the captain to the captain role', async () => {
            await service.tryAccept(7, 55);

            expect(mockUserService.promoteRoleIfUser).toHaveBeenCalledWith(3, 'captain', 55);
        });

        it('creates a player row for every roster entry', async () => {
            const result: any = await service.tryAccept(7, 1);

            expect(mockPlayerRepo.save).toHaveBeenCalledTimes(10);
            expect(result.team.players).toHaveLength(10);
            expect(result.team.players[0]).toMatchObject({ robloxUsername: 'player0', position: 'N/A' });
        });

        it('reuses an existing player and refreshes their discord handle', async () => {
            // A distinct row per lookup - one shared object would be rewritten by every roster entry.
            mockPlayerRepo.findOne.mockImplementation(async (opts: any) => ({
                id: 5,
                robloxUsername: opts.where.robloxUsername,
                teams: [],
            }));

            const result: any = await service.tryAccept(7, 1);

            expect(result.team.players[0].id).toBe(5);
            expect(result.team.players[0].discordUsername).toBe('d0');
        });

        it('drops excluded players from the roster it builds', async () => {
            const row = registration({ roster: roster(11) });
            mockRepo.findOne.mockResolvedValue(row as never);

            const result: any = await service.tryAccept(7, 1, { exclusions: new Set(['player10']) });

            expect(result.team.players).toHaveLength(10);
            expect(result.registration.roster.map((r: any) => r.roblox)).not.toContain('player10');
        });

        it('detaches a transferred player from their old team in this season', async () => {
            const player = { id: 9, robloxUsername: 'player0', teams: [{ id: 60, season: { id: 1 } }] } as any;
            // Only player0 is already rostered elsewhere, so the only conflict raised is the
            // one the transfer is meant to resolve.
            mockPlayerRepo.findOne.mockImplementation(async (opts: any) =>
                opts.where.robloxUsername === 'player0' ? player : null
            );

            await service.tryAccept(7, 1, { transfers: new Set(['player0']) });

            expect(player.teams).toEqual([]);
        });

        it('renames the team when the admin supplies a new name', async () => {
            const result: any = await service.tryAccept(7, 1, { teamName: '  Renamed  ' });

            expect(result.team.name).toBe('Renamed');
            expect(result.registration.teamName).toBe('Renamed');
        });
    });

    describe('resolve', () => {
        it('sends an application back to pending and clears its conflicts', async () => {
            mockRepo.findOne.mockResolvedValueOnce(
                registration({ status: 'conflict', conflictPayload: { conflicts: [] } }) as never
            );

            const { registration: row } = await service.resolve(7, 1, { decision: 'pending' } as any) as any;

            expect(row.status).toBe('pending');
            expect(row.conflictPayload).toBeNull();
        });

        it('denies an application', async () => {
            mockRepo.findOne.mockResolvedValueOnce(registration() as never);

            const { registration: row } = await service.resolve(7, 1, { decision: 'denied' } as any) as any;

            expect(row.status).toBe('denied');
        });

        it('turns per-player decisions into exclusions and transfers', async () => {
            const row = registration({ roster: roster(11) });
            mockRepo.findOne.mockResolvedValue(row as never);
            mockTeamRepo.findOne.mockResolvedValue(null as never);
            mockPlayerRepo.findOne.mockResolvedValue(null as never);
            mockUserRepo.findOne.mockResolvedValue(null as never);

            const result: any = await service.resolve(7, 1, {
                decision: 'accepted',
                players: [
                    { roblox: 'PLAYER10', action: 'exclude' },
                    { roblox: 'PLAYER0', action: 'transfer' },
                ],
            } as any);

            expect(result.ok).toBe(true);
            expect(result.registration.roster.map((r: any) => r.roblox)).not.toContain('player10');
        });
    });

    describe('deny', () => {
        it('refuses to deny an accepted application, pointing at revoke instead', async () => {
            mockRepo.findOne.mockResolvedValueOnce(registration({ status: 'accepted' }) as never);

            await expect(service.deny(7)).rejects.toThrow('Use revoke');
        });

        it('denies a pending application and clears any conflict payload', async () => {
            mockRepo.findOne.mockResolvedValueOnce(
                registration({ status: 'conflict', conflictPayload: { conflicts: [] } }) as never
            );

            const row = await service.deny(7);

            expect(row.status).toBe('denied');
            expect(row.conflictPayload).toBeNull();
        });
    });

    describe('revoke', () => {
        it('refuses to revoke an application that was never accepted', async () => {
            mockRepo.findOne.mockResolvedValueOnce(registration({ status: 'pending' }) as never);

            await expect(service.revoke(7)).rejects.toThrow('Only accepted registrations can be revoked');
        });

        it('refuses once registrations have closed, keeping the archive intact', async () => {
            mockRepo.findOne.mockResolvedValueOnce(registration({ status: 'accepted' }) as never);
            mockSeasonRepo.findOne.mockResolvedValueOnce({ ...OPEN_SEASON, registrationsOpen: false } as never);

            await expect(service.revoke(7)).rejects.toThrow('Application process is closed');
        });

        it('revokes while registrations are still open', async () => {
            mockRepo.findOne.mockResolvedValueOnce(registration({ status: 'accepted' }) as never);
            mockSeasonRepo.findOne.mockResolvedValueOnce(OPEN_SEASON as never);

            const row = await service.revoke(7);

            expect(row.status).toBe('denied');
        });
    });
});
