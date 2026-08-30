import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { TeamService } from '../team.service.js';
import { AppDataSource } from '../../../db/data-source.js';
import { MissingFieldError } from '../../../errors/MissingFieldError.js';
import { NotFoundError } from '../../../errors/NotFoundError.js';
import { ConflictError } from '../../../errors/ConflictError.js';
import { DuplicateError } from '../../../errors/DuplicateError.js';
import { UnauthorizedError } from '../../../errors/UnauthorizedError.js';
import { MultiplePlayersNotFoundError } from '../../../errors/MultiplePlayersNotFoundError.js';
import { MultipleGamesNotFoundError } from '../../../errors/MultipleGamesNotFoundError.js';

const mockTeamRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
};

const mockPlayerRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
};

const mockSeasonRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
};

const mockGameRepository = {
    find: jest.fn(),
};

const mockRegionService = {
    getRegionById: jest.fn(),
    requireRegionByCode: jest.fn(),
};

// AppDataSource.getRepository is reached directly by assertLinkedRosterUser (and by the
// UserService that staffUpdateTeam news up), so staff tests steer it through this stand-in.
const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
};

function season(overrides: Record<string, unknown> = {}) {
    return { id: 1, seasonNumber: 5, regionId: 1, captainEditEnabled: true, teams: [], ...overrides } as any;
}

function team(overrides: Record<string, unknown> = {}) {
    return {
        id: 10,
        name: 'Test Team',
        season: season(),
        regionId: 1,
        captainEditEnabled: true,
        captainUserId: null,
        viceCaptainUserId: null,
        courtCaptainUserId: null,
        players: [],
        games: [],
        ...overrides,
    } as any;
}

describe('TeamService', () => {
    let teamService: TeamService;

    beforeEach(() => {
        jest.clearAllMocks();
        mockTeamRepository.save.mockImplementation(async (entity: any) => entity);
        mockPlayerRepository.save.mockImplementation(async (entity: any) => entity);
        mockUserRepository.save.mockImplementation(async (entity: any) => entity);
        mockRegionService.requireRegionByCode.mockResolvedValue({ id: 1, code: 'na' } as never);
        (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepository);

        teamService = new TeamService();
        (teamService as any).teamRepository = mockTeamRepository;
        (teamService as any).playerRepository = mockPlayerRepository;
        (teamService as any).seasonRepository = mockSeasonRepository;
        (teamService as any).gameRepository = mockGameRepository;
        (teamService as any).regionService = mockRegionService;
    });

    describe('createTeam', () => {
        const validDto = { name: 'New Team', seasonNumber: 5 } as any;

        it('throws MissingFieldError without a name', async () => {
            await expect(teamService.createTeam({ seasonNumber: 5 } as any)).rejects.toThrow(MissingFieldError);
        });

        it('throws MissingFieldError without a season number', async () => {
            await expect(teamService.createTeam({ name: 'New Team' } as any)).rejects.toThrow(MissingFieldError);
        });

        it('defaults to the NA region when none is given', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(season() as never);
            mockTeamRepository.findOne.mockResolvedValueOnce(null as never);

            await teamService.createTeam(validDto);

            expect(mockRegionService.requireRegionByCode).toHaveBeenCalledWith('na');
        });

        it('resolves an explicit region id', async () => {
            mockRegionService.getRegionById.mockResolvedValueOnce({ id: 3, code: 'eu' } as never);
            mockSeasonRepository.findOne.mockResolvedValueOnce(season({ regionId: 3 }) as never);
            mockTeamRepository.findOne.mockResolvedValueOnce(null as never);

            await teamService.createTeam({ ...validDto, regionId: 3 });

            expect(mockSeasonRepository.findOne).toHaveBeenCalledWith(
                expect.objectContaining({ where: { seasonNumber: 5, regionId: 3 } })
            );
        });

        it('throws NotFoundError for an unknown region id', async () => {
            mockRegionService.getRegionById.mockResolvedValueOnce(null as never);

            await expect(teamService.createTeam({ ...validDto, regionId: 99 })).rejects.toThrow(NotFoundError);
        });

        it('throws NotFoundError when the season does not exist in that region', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(teamService.createTeam(validDto)).rejects.toThrow(NotFoundError);
        });

        it('throws DuplicateError when the name is taken in that season', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(season() as never);
            mockTeamRepository.findOne.mockResolvedValueOnce(team() as never);

            await expect(teamService.createTeam(validDto)).rejects.toThrow(DuplicateError);
        });

        it('inherits the region from the resolved season', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(season({ regionId: 7 }) as never);
            mockTeamRepository.findOne.mockResolvedValueOnce(null as never);

            const created = await teamService.createTeam(validDto);

            expect(created.regionId).toBe(7);
        });

        it('trims a provided placement', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(season() as never);
            mockTeamRepository.findOne.mockResolvedValueOnce(null as never);

            const created = await teamService.createTeam({ ...validDto, placement: '  1st Place  ' });

            expect(created.placement).toBe('1st Place');
        });

        it('leaves placement untouched when none is provided', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(season() as never);
            mockTeamRepository.findOne.mockResolvedValueOnce(null as never);

            const created = await teamService.createTeam(validDto);

            expect(created.placement).toBeUndefined();
        });

        it('attaches the requested players', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(season() as never);
            mockTeamRepository.findOne.mockResolvedValueOnce(null as never);
            mockPlayerRepository.find.mockResolvedValueOnce([{ id: 1 }, { id: 2 }] as never);

            const created = await teamService.createTeam({ ...validDto, playerIds: [1, 2] });

            expect(created.players).toHaveLength(2);
        });

        it('names the players it could not find', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(season() as never);
            mockTeamRepository.findOne.mockResolvedValueOnce(null as never);
            mockPlayerRepository.find.mockResolvedValueOnce([{ id: 1 }] as never);

            await expect(teamService.createTeam({ ...validDto, playerIds: [1, 2, 3] })).rejects.toThrow(
                MultiplePlayersNotFoundError
            );
        });

        it('names the games it could not find', async () => {
            mockSeasonRepository.findOne.mockResolvedValueOnce(season() as never);
            mockTeamRepository.findOne.mockResolvedValueOnce(null as never);
            mockGameRepository.find.mockResolvedValueOnce([] as never);

            await expect(teamService.createTeam({ ...validDto, gameIds: [4] })).rejects.toThrow(
                MultipleGamesNotFoundError
            );
        });

        it('uses the transaction manager repositories when one is supplied', async () => {
            const managedTeamRepo = { findOne: jest.fn().mockResolvedValue(null as never), save: jest.fn((e: any) => e) };
            const managedSeasonRepo = { findOne: jest.fn().mockResolvedValue(season() as never) };
            const manager = {
                getRepository: jest.fn((entity: any) =>
                    entity?.name === 'Seasons' ? managedSeasonRepo : managedTeamRepo
                ),
            } as any;

            await teamService.createTeam(validDto, manager);

            expect(manager.getRepository).toHaveBeenCalled();
            expect(mockTeamRepository.save).not.toHaveBeenCalled();
        });
    });

    describe('getTeamPlayersByName', () => {
        const pagination = { page: 1, limit: 10, skip: 0, take: 10 };

        it('returns null when no team carries that name', async () => {
            mockTeamRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(teamService.getTeamPlayersByName('Ghost', pagination)).resolves.toBeNull();
        });

        it('pages the roster of the matched team', async () => {
            mockTeamRepository.findOne.mockResolvedValueOnce(team() as never);
            mockPlayerRepository.findAndCount.mockResolvedValueOnce([[{ id: 1 }], 1] as never);

            const result = await teamService.getTeamPlayersByName('Test Team', pagination);

            expect(result).toEqual([[{ id: 1 }], 1]);
            expect(mockPlayerRepository.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ where: { teams: { id: 10 } }, skip: 0, take: 10 })
            );
        });
    });

    describe('getTeamPlayers', () => {
        const pagination = { page: 1, limit: 10, skip: 0, take: 10 };

        it('throws NotFoundError for an unknown team', async () => {
            mockTeamRepository.findOneBy.mockResolvedValueOnce(null as never);

            await expect(teamService.getTeamPlayers(999, pagination)).rejects.toThrow(NotFoundError);
        });

        it('pages the roster', async () => {
            mockTeamRepository.findOneBy.mockResolvedValueOnce(team() as never);
            mockPlayerRepository.findAndCount.mockResolvedValueOnce([[], 0] as never);

            await teamService.getTeamPlayers(10, pagination);

            expect(mockPlayerRepository.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ where: { teams: { id: 10 } } })
            );
        });
    });

    describe('getTeamById', () => {
        it('returns the team', async () => {
            const found = team();
            mockTeamRepository.findOne.mockResolvedValueOnce(found as never);

            await expect(teamService.getTeamById(10)).resolves.toBe(found);
        });

        it('throws NotFoundError naming the id', async () => {
            mockTeamRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(teamService.getTeamById(999)).rejects.toThrow('Team with ID 999 not found');
        });
    });

    describe('getTeamsBySeasonId', () => {
        const pagination = { page: 1, limit: 10, skip: 0, take: 10 };

        it('throws MissingFieldError without a season id', async () => {
            await expect(teamService.getTeamsBySeasonId(0, pagination)).rejects.toThrow(MissingFieldError);
        });

        it('throws NotFoundError when the season does not exist', async () => {
            mockSeasonRepository.findOneBy.mockResolvedValueOnce(null as never);

            await expect(teamService.getTeamsBySeasonId(99, pagination)).rejects.toThrow(NotFoundError);
        });

        it('pages the teams in that season', async () => {
            mockSeasonRepository.findOneBy.mockResolvedValueOnce(season() as never);
            mockTeamRepository.findAndCount.mockResolvedValueOnce([[team()], 1] as never);

            const [teams, total] = await teamService.getTeamsBySeasonId(1, pagination);

            expect(teams).toHaveLength(1);
            expect(total).toBe(1);
        });
    });

    describe('updateTeam', () => {
        it('throws NotFoundError for an unknown team', async () => {
            mockTeamRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(teamService.updateTeam(999, { name: 'x' } as any)).rejects.toThrow(NotFoundError);
        });

        it('applies only the fields that were supplied', async () => {
            const existing = team({ name: 'Old', placement: 'TBD' });
            mockTeamRepository.findOne.mockResolvedValueOnce(existing as never).mockResolvedValueOnce(existing as never);

            await teamService.updateTeam(10, { name: 'New' } as any);

            expect(existing.name).toBe('New');
            expect(existing.placement).toBe('TBD');
        });

        it('trims an updated placement', async () => {
            const existing = team();
            mockTeamRepository.findOne.mockResolvedValueOnce(existing as never).mockResolvedValueOnce(existing as never);

            await teamService.updateTeam(10, { placement: '  Top 4  ' } as any);

            expect(existing.placement).toBe('Top 4');
        });

        it('throws NotFoundError when moving the team to a season that does not exist', async () => {
            mockTeamRepository.findOne.mockResolvedValueOnce(team() as never);
            mockSeasonRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(teamService.updateTeam(10, { seasonNumber: 99 } as any)).rejects.toThrow(NotFoundError);
        });

        it('rejects a roster containing unknown player ids', async () => {
            mockTeamRepository.findOne.mockResolvedValueOnce(team() as never);
            mockPlayerRepository.find.mockResolvedValueOnce([{ id: 1 }] as never);

            await expect(teamService.updateTeam(10, { playerIds: [1, 2] } as any)).rejects.toThrow(
                MultiplePlayersNotFoundError
            );
        });

        it('rejects unknown game ids', async () => {
            mockTeamRepository.findOne.mockResolvedValueOnce(team() as never);
            mockGameRepository.find.mockResolvedValueOnce([] as never);

            await expect(teamService.updateTeam(10, { gameIds: [3] } as any)).rejects.toThrow(
                MultipleGamesNotFoundError
            );
        });

        it('returns the team re-read with its relations', async () => {
            const existing = team();
            const reloaded = team({ name: 'Reloaded' });
            mockTeamRepository.findOne.mockResolvedValueOnce(existing as never).mockResolvedValueOnce(reloaded as never);

            await expect(teamService.updateTeam(10, { name: 'New' } as any)).resolves.toBe(reloaded);
        });

        it('falls back to the saved team when the re-read comes back empty', async () => {
            const existing = team();
            mockTeamRepository.findOne.mockResolvedValueOnce(existing as never).mockResolvedValueOnce(null as never);

            await expect(teamService.updateTeam(10, { name: 'New' } as any)).resolves.toBe(existing);
        });
    });

    describe('deleteTeam', () => {
        it('throws NotFoundError for an unknown team', async () => {
            mockTeamRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(teamService.deleteTeam(999)).rejects.toThrow(NotFoundError);
        });

        it('removes the team', async () => {
            const existing = team();
            mockTeamRepository.findOne.mockResolvedValueOnce(existing as never);

            await teamService.deleteTeam(10);

            expect(mockTeamRepository.remove).toHaveBeenCalledWith(existing);
        });
    });

    describe('canStaffEdit', () => {
        it('refuses when the season has captain editing switched off', () => {
            const gate = teamService.canStaffEdit(team({ season: season({ captainEditEnabled: false }), captainUserId: 5 }), 5);

            expect(gate).toMatchObject({ allowed: false, role: null });
            expect(gate.reason).toMatch(/season/i);
        });

        it('refuses when the team has captain editing switched off', () => {
            const gate = teamService.canStaffEdit(team({ captainEditEnabled: false, captainUserId: 5 }), 5);

            expect(gate).toMatchObject({ allowed: false, role: null });
            expect(gate.reason).toMatch(/team/i);
        });

        it('recognises the captain', () => {
            expect(teamService.canStaffEdit(team({ captainUserId: 5 }), 5)).toEqual({ allowed: true, role: 'captain' });
        });

        it('recognises the vice captain', () => {
            expect(teamService.canStaffEdit(team({ viceCaptainUserId: 6 }), 6)).toEqual({
                allowed: true,
                role: 'vice_captain',
            });
        });

        it('recognises the court captain', () => {
            expect(teamService.canStaffEdit(team({ courtCaptainUserId: 7 }), 7)).toEqual({
                allowed: true,
                role: 'court_captain',
            });
        });

        it('refuses a user who holds no staff seat on the team', () => {
            const gate = teamService.canStaffEdit(team({ captainUserId: 5 }), 99);

            expect(gate.allowed).toBe(false);
            expect(gate.reason).toMatch(/not staff/i);
        });
    });

    describe('enrichTeamWithCanEdit', () => {
        it('reports no edit rights for an anonymous viewer', () => {
            const result = teamService.enrichTeamWithCanEdit(team({ captainUserId: 5 }));

            expect(result).toMatchObject({ captainCanEdit: false, staffRole: null });
        });

        it('reports the viewer\'s staff role', () => {
            const result = teamService.enrichTeamWithCanEdit(team({ viceCaptainUserId: 6 }), 6);

            expect(result).toMatchObject({ captainCanEdit: true, staffRole: 'vice_captain' });
        });

        it('keeps the original team fields alongside the edit flags', () => {
            const result = teamService.enrichTeamWithCanEdit(team({ name: 'Keepers' }), 1);

            expect(result.name).toBe('Keepers');
        });
    });

    describe('adminPatchTeamFlags', () => {
        it('sets only the flags present in the body', async () => {
            const existing = team({ captainEditEnabled: false, hexColor: '#111' });
            mockTeamRepository.findOne.mockResolvedValue(existing as never);

            await teamService.adminPatchTeamFlags(10, { captainEditEnabled: true });

            expect(existing.captainEditEnabled).toBe(true);
            expect(existing.hexColor).toBe('#111');
        });

        it('can clear a staff seat by passing null', async () => {
            const existing = team({ captainUserId: 5 });
            mockTeamRepository.findOne.mockResolvedValue(existing as never);

            await teamService.adminPatchTeamFlags(10, { captainUserId: null });

            expect(existing.captainUserId).toBeNull();
        });
    });

    describe('staffUpdateTeam', () => {
        it('rejects a user with no staff seat', async () => {
            mockTeamRepository.findOne.mockResolvedValue(team({ captainUserId: 5 }) as never);

            await expect(teamService.staffUpdateTeam(10, 99, { name: 'Nope' })).rejects.toThrow(UnauthorizedError);
        });

        it('rejects any staff edit while the season has editing disabled', async () => {
            mockTeamRepository.findOne.mockResolvedValue(
                team({ season: season({ captainEditEnabled: false }), captainUserId: 5 }) as never
            );

            await expect(teamService.staffUpdateTeam(10, 5, { logoUrl: 'x' })).rejects.toThrow(UnauthorizedError);
        });

        it('lets the captain rename the team', async () => {
            const existing = team({ captainUserId: 5 });
            mockTeamRepository.findOne
                .mockResolvedValueOnce(existing as never)
                .mockResolvedValueOnce(null as never)
                .mockResolvedValueOnce(existing as never);

            await teamService.staffUpdateTeam(10, 5, { name: '  Renamed  ' });

            expect(existing.name).toBe('Renamed');
        });

        it('does not let a vice captain rename the team', async () => {
            mockTeamRepository.findOne.mockResolvedValue(team({ viceCaptainUserId: 6 }) as never);

            await expect(teamService.staffUpdateTeam(10, 6, { name: 'Renamed' })).rejects.toThrow(
                'Only the captain can rename the team'
            );
        });

        it('throws ConflictError when the new name clashes in the same season', async () => {
            const existing = team({ captainUserId: 5 });
            mockTeamRepository.findOne
                .mockResolvedValueOnce(existing as never)
                .mockResolvedValueOnce(team({ id: 11, name: 'Taken' }) as never);

            await expect(teamService.staffUpdateTeam(10, 5, { name: 'Taken' })).rejects.toThrow(ConflictError);
        });

        it('allows the team to keep its own name', async () => {
            const existing = team({ captainUserId: 5, name: 'Same' });
            mockTeamRepository.findOne
                .mockResolvedValueOnce(existing as never)
                .mockResolvedValueOnce(existing as never)
                .mockResolvedValueOnce(existing as never);

            await expect(teamService.staffUpdateTeam(10, 5, { name: 'Same' })).resolves.toBeDefined();
        });

        it('lets staff update colours and logo', async () => {
            const existing = team({ courtCaptainUserId: 7 });
            mockTeamRepository.findOne.mockResolvedValue(existing as never);

            await teamService.staffUpdateTeam(10, 7, { hexColor: '#abcdef', brickColor: 'Really red', logoUrl: 'u' });

            expect(existing.hexColor).toBe('#abcdef');
            expect(existing.brickColor).toBe('Really red');
            expect(existing.logoUrl).toBe('u');
        });

        it('rejects a roster shorter than ten players', async () => {
            mockTeamRepository.findOne.mockResolvedValue(team({ captainUserId: 5 }) as never);

            const roster = Array.from({ length: 9 }, (_, i) => ({ discord: `d${i}`, roblox: `r${i}` }));

            await expect(teamService.staffUpdateTeam(10, 5, { roster })).rejects.toThrow(
                'Roster must have at least 10 players'
            );
        });

        it('rejects a player already rostered on another team that season', async () => {
            mockTeamRepository.findOne.mockResolvedValue(team({ captainUserId: 5 }) as never);
            mockPlayerRepository.findOne.mockResolvedValueOnce({
                id: 1,
                robloxUsername: 'r0',
                teams: [{ id: 77, season: { id: 1 } }],
            } as never);

            const roster = Array.from({ length: 10 }, (_, i) => ({ discord: `d${i}`, roblox: `r${i}` }));

            await expect(teamService.staffUpdateTeam(10, 5, { roster })).rejects.toThrow(
                'is already on another team this season'
            );
        });

        it('creates players that do not exist yet, normalizing their roblox name', async () => {
            const existing = team({ captainUserId: 5 });
            mockTeamRepository.findOne.mockResolvedValue(existing as never);
            mockPlayerRepository.findOne.mockResolvedValue(null as never);

            const roster = Array.from({ length: 10 }, (_, i) => ({ discord: ` D${i} `, roblox: `  ROBLOX${i}  ` }));

            await teamService.staffUpdateTeam(10, 5, { roster });

            expect(mockPlayerRepository.save).toHaveBeenCalledTimes(10);
            expect(existing.players[0]).toMatchObject({ robloxUsername: 'roblox0', discordUsername: 'D0', position: 'N/A' });
        });

        it('does not let a vice captain transfer captaincy', async () => {
            mockTeamRepository.findOne.mockResolvedValue(team({ viceCaptainUserId: 6 }) as never);

            await expect(teamService.staffUpdateTeam(10, 6, { captainUserId: 20 })).rejects.toThrow(
                'Only the captain can transfer captaincy'
            );
        });

        it('does not let a court captain assign a court captain', async () => {
            mockTeamRepository.findOne.mockResolvedValue(team({ courtCaptainUserId: 7 }) as never);

            await expect(teamService.staffUpdateTeam(10, 7, { courtCaptainUserId: 20 })).rejects.toThrow(
                'Only captain or vice captain can assign court captain'
            );
        });

        it('refuses to promote a user with no linked roblox account', async () => {
            mockTeamRepository.findOne.mockResolvedValue(team({ captainUserId: 5 }) as never);
            mockUserRepository.findOne.mockResolvedValueOnce({ id: 20, robloxUsername: null } as never);

            await expect(teamService.staffUpdateTeam(10, 5, { viceCaptainUserId: 20 })).rejects.toThrow(
                'Target user must have a linked Roblox account'
            );
        });

        it('refuses to promote a linked user who is not on the roster', async () => {
            mockTeamRepository.findOne.mockResolvedValue(team({ captainUserId: 5, players: [] }) as never);
            mockUserRepository.findOne.mockResolvedValueOnce({ id: 20, robloxUsername: 'someone' } as never);

            await expect(teamService.staffUpdateTeam(10, 5, { viceCaptainUserId: 20 })).rejects.toThrow(
                'must be on the team roster'
            );
        });

        it('assigns a vice captain who is on the roster', async () => {
            const existing = team({ captainUserId: 5, players: [{ id: 3, robloxUsername: 'rostered', userId: 20 }] });
            mockTeamRepository.findOne.mockResolvedValue(existing as never);
            mockUserRepository.findOne.mockResolvedValue({ id: 20, robloxUsername: 'rostered', role: 'user', tokenVersion: 0 } as never);

            await teamService.staffUpdateTeam(10, 5, { viceCaptainUserId: 20 });

            expect(existing.viceCaptainUserId).toBe(20);
        });

        it('clears the vice captain seat when passed null', async () => {
            const existing = team({ captainUserId: 5, viceCaptainUserId: 6 });
            mockTeamRepository.findOne.mockResolvedValue(existing as never);

            await teamService.staffUpdateTeam(10, 5, { viceCaptainUserId: null });

            expect(existing.viceCaptainUserId).toBeNull();
        });

        it('lets a vice captain assign the court captain', async () => {
            const existing = team({
                viceCaptainUserId: 6,
                players: [{ id: 3, robloxUsername: 'rostered', userId: 20 }],
            });
            mockTeamRepository.findOne.mockResolvedValue(existing as never);
            mockUserRepository.findOne.mockResolvedValue({ id: 20, robloxUsername: 'rostered', role: 'user', tokenVersion: 0 } as never);

            await teamService.staffUpdateTeam(10, 6, { courtCaptainUserId: 20 });

            expect(existing.courtCaptainUserId).toBe(20);
        });
    });
});
