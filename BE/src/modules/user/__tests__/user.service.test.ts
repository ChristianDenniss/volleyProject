import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ILike } from 'typeorm';
import { UserService } from '../user.service.js';
import { MissingFieldError } from '../../../errors/MissingFieldError.js';
import { NotFoundError } from '../../../errors/NotFoundError.js';
import { ConflictError } from '../../../errors/ConflictError.js';
import { UnauthorizedError } from '../../../errors/UnauthorizedError.js';

// `signUserToken` reads JWT_SECRET at call time and throws without it, so every
// path that mints a token needs one. Role changes live in changeUserRole.test.ts.
const TEST_JWT_SECRET = 'test-secret-for-user-service';

const PASSWORD = 'CorrectHorse12';
let PASSWORD_HASH: string;

const mockUserRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
};

const mockAuditLogRepository = {
    save: jest.fn(),
};

const mockPlayerQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    getMany: jest.fn(),
};

const mockPlayerRepository = {
    createQueryBuilder: jest.fn(() => mockPlayerQueryBuilder),
    save: jest.fn(),
};

function baseUser(overrides: Record<string, unknown> = {}) {
    return {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: PASSWORD_HASH,
        role: 'user',
        tokenVersion: 0,
        robloxUserId: null,
        robloxUsername: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        ...overrides,
    } as any;
}

describe('UserService', () => {
    let userService: UserService;

    beforeAll(async () => {
        process.env.JWT_SECRET = TEST_JWT_SECRET;
        PASSWORD_HASH = await bcrypt.hash(PASSWORD, 10);
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockPlayerQueryBuilder.where.mockReturnThis();
        mockPlayerQueryBuilder.orWhere.mockReturnThis();
        mockPlayerQueryBuilder.update.mockReturnThis();
        mockPlayerQueryBuilder.set.mockReturnThis();
        mockPlayerQueryBuilder.execute.mockResolvedValue(undefined as never);
        mockPlayerRepository.createQueryBuilder.mockReturnValue(mockPlayerQueryBuilder);
        mockUserRepository.save.mockImplementation(async (entity: any) => entity);

        userService = new UserService();
        (userService as any).userRepository = mockUserRepository;
        (userService as any).auditLogRepository = mockAuditLogRepository;
        (userService as any).playerRepository = mockPlayerRepository;
    });

    describe('toPublicUser', () => {
        it('omits the password and reports it as a boolean instead', () => {
            const result = userService.toPublicUser(baseUser());

            expect(result).not.toHaveProperty('password');
            expect(result.hasPassword).toBe(true);
        });

        it('reports hasPassword false for a passwordless SSO account', () => {
            expect(userService.toPublicUser(baseUser({ password: null })).hasPassword).toBe(false);
        });

        it('normalizes missing roblox fields to null', () => {
            const result = userService.toPublicUser(baseUser({ robloxUserId: undefined, robloxUsername: undefined }));

            expect(result.robloxUserId).toBeNull();
            expect(result.robloxUsername).toBeNull();
        });

        it('carries through the whitelisted identity fields', () => {
            const result = userService.toPublicUser(baseUser());

            expect(result).toMatchObject({
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                role: 'user',
            });
        });

        it('does not leak tokenVersion', () => {
            expect(userService.toPublicUser(baseUser({ tokenVersion: 7 }))).not.toHaveProperty('tokenVersion');
        });
    });

    describe('createUser', () => {
        it('throws MissingFieldError without a username', async () => {
            await expect(userService.createUser('', 'a@b.com', PASSWORD)).rejects.toThrow(MissingFieldError);
        });

        it('throws MissingFieldError without an email', async () => {
            await expect(userService.createUser('testuser', '', PASSWORD)).rejects.toThrow(MissingFieldError);
        });

        it('rejects a password below the minimum length', async () => {
            await expect(userService.createUser('testuser', 'a@b.com', 'Short1')).rejects.toThrow(
                'Password must be at least 12 characters long'
            );
        });

        it('rejects a long password with no digit', async () => {
            await expect(userService.createUser('testuser', 'a@b.com', 'NoDigitsHereAtAll')).rejects.toThrow(
                'Password must include uppercase, lowercase, and a number'
            );
        });

        it('throws ConflictError when the username or email is taken', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(baseUser() as never);

            await expect(userService.createUser('testuser', 'test@example.com', PASSWORD)).rejects.toThrow(ConflictError);
        });

        it('hashes the password rather than storing it raw', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(null as never);

            const created: any = await userService.createUser('newuser', 'new@example.com', PASSWORD);

            expect(created.password).not.toBe(PASSWORD);
            await expect(bcrypt.compare(PASSWORD, created.password)).resolves.toBe(true);
        });

        it('defaults the role to user', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(null as never);

            const created: any = await userService.createUser('newuser', 'new@example.com', PASSWORD);

            expect(created.role).toBe('user');
        });

        it('honours an explicit role', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(null as never);

            const created: any = await userService.createUser('newuser', 'new@example.com', PASSWORD, 'admin');

            expect(created.role).toBe('admin');
        });
    });

    describe('getAllUsers', () => {
        const pagination = { page: 2, limit: 10, skip: 10, take: 10 };

        it('passes pagination straight through to the repository', async () => {
            mockUserRepository.findAndCount.mockResolvedValueOnce([[], 0] as never);

            await userService.getAllUsers(pagination);

            expect(mockUserRepository.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ skip: 10, take: 10 })
            );
        });

        it('turns a search filter into a case-insensitive username match', async () => {
            mockUserRepository.findAndCount.mockResolvedValueOnce([[], 0] as never);

            await userService.getAllUsers(pagination, { search: 'test' });

            expect(mockUserRepository.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ where: { username: ILike('%test%') } })
            );
        });

        it('filters by role', async () => {
            mockUserRepository.findAndCount.mockResolvedValueOnce([[], 0] as never);

            await userService.getAllUsers(pagination, { role: 'admin' });

            expect(mockUserRepository.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ where: { role: 'admin' } })
            );
        });

        it('applies no where clause when unfiltered', async () => {
            mockUserRepository.findAndCount.mockResolvedValueOnce([[], 0] as never);

            await userService.getAllUsers(pagination);

            expect(mockUserRepository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
        });
    });

    describe('getPublicUsers', () => {
        it('never selects the password column', async () => {
            mockUserRepository.findAndCount.mockResolvedValueOnce([[], 0] as never);

            await userService.getPublicUsers({ page: 1, limit: 10, skip: 0, take: 10 });

            const { select } = (mockUserRepository.findAndCount.mock.calls[0] as any[])[0];
            expect(select).not.toContain('password');
            expect(select).not.toContain('email');
        });
    });

    describe('getUserById', () => {
        it('returns the user', async () => {
            const user = baseUser();
            mockUserRepository.findOne.mockResolvedValueOnce(user as never);

            await expect(userService.getUserById(1)).resolves.toBe(user);
        });

        it('throws NotFoundError when absent', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(userService.getUserById(999)).rejects.toThrow(NotFoundError);
        });

        it('does not select the password column', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(baseUser() as never);

            await userService.getUserById(1);

            const { select } = (mockUserRepository.findOne.mock.calls[0] as any[])[0];
            expect(select).not.toContain('password');
        });
    });

    describe('authenticateUser', () => {
        it('throws MissingFieldError without a username', async () => {
            await expect(userService.authenticateUser('', PASSWORD)).rejects.toThrow(MissingFieldError);
        });

        it('throws MissingFieldError without a password', async () => {
            await expect(userService.authenticateUser('testuser', '')).rejects.toThrow(MissingFieldError);
        });

        it('throws UnauthorizedError for an unknown username', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(userService.authenticateUser('ghost', PASSWORD)).rejects.toThrow(UnauthorizedError);
        });

        it('throws UnauthorizedError for a passwordless account', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce({ id: 1, password: null } as never);

            await expect(userService.authenticateUser('testuser', PASSWORD)).rejects.toThrow(UnauthorizedError);
        });

        it('throws UnauthorizedError when the password does not match', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce({ id: 1, password: PASSWORD_HASH } as never);

            await expect(userService.authenticateUser('testuser', 'WrongPassword12')).rejects.toThrow(UnauthorizedError);
        });

        it('gives the same error for a wrong password as for an unknown user', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(null as never);
            const unknown = await userService.authenticateUser('ghost', PASSWORD).catch(e => e.message);

            mockUserRepository.findOne.mockResolvedValueOnce({ id: 1, password: PASSWORD_HASH } as never);
            const wrongPassword = await userService.authenticateUser('testuser', 'WrongPassword12').catch(e => e.message);

            expect(wrongPassword).toBe(unknown);
        });

        it('returns the user and a token signed with its identity on success', async () => {
            mockUserRepository.findOne
                .mockResolvedValueOnce({ id: 1, password: PASSWORD_HASH } as never)
                .mockResolvedValueOnce(baseUser({ password: undefined }) as never);

            const { user, token } = await userService.authenticateUser('testuser', PASSWORD);

            expect(user.username).toBe('testuser');
            expect(jwt.verify(token, TEST_JWT_SECRET)).toMatchObject({
                id: 1,
                username: 'testuser',
                role: 'user',
                tokenVersion: 0,
            });
        });

        it('throws UnauthorizedError if the profile lookup comes back empty', async () => {
            mockUserRepository.findOne
                .mockResolvedValueOnce({ id: 1, password: PASSWORD_HASH } as never)
                .mockResolvedValueOnce(null as never);

            await expect(userService.authenticateUser('testuser', PASSWORD)).rejects.toThrow(UnauthorizedError);
        });
    });

    describe('changePassword', () => {
        const NEW_PASSWORD = 'BrandNewPass34';

        it('rejects a weak new password before touching the repository', async () => {
            await expect(userService.changePassword(1, PASSWORD, 'weak')).rejects.toThrow(
                'Password must be at least 12 characters long'
            );
            expect(mockUserRepository.findOne).not.toHaveBeenCalled();
        });

        it('throws NotFoundError for an unknown user', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(userService.changePassword(999, PASSWORD, NEW_PASSWORD)).rejects.toThrow(NotFoundError);
        });

        it('throws UnauthorizedError when the account has no password to change', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(baseUser({ password: null }) as never);

            await expect(userService.changePassword(1, PASSWORD, NEW_PASSWORD)).rejects.toThrow(UnauthorizedError);
        });

        it('throws UnauthorizedError when the current password is wrong', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(baseUser() as never);

            await expect(userService.changePassword(1, 'NotMyPassword1', NEW_PASSWORD)).rejects.toThrow(UnauthorizedError);
        });

        it('stores the new password hashed', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(baseUser() as never);

            const { user } = await userService.changePassword(1, PASSWORD, NEW_PASSWORD);

            await expect(bcrypt.compare(NEW_PASSWORD, (user as any).password)).resolves.toBe(true);
        });

        it('bumps tokenVersion so existing sessions are invalidated', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(baseUser({ tokenVersion: 3 }) as never);

            const { user, token } = await userService.changePassword(1, PASSWORD, NEW_PASSWORD);

            expect(user.tokenVersion).toBe(4);
            expect(jwt.verify(token, TEST_JWT_SECRET)).toMatchObject({ tokenVersion: 4 });
        });
    });

    describe('getProfile', () => {
        it('throws NotFoundError for an unknown user', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(userService.getProfile(999)).rejects.toThrow(NotFoundError);
        });

        it('returns a sanitized profile with no password', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(baseUser() as never);

            const profile = await userService.getProfile(1);

            expect(profile).not.toHaveProperty('password');
            expect(profile.hasPassword).toBe(true);
            expect(profile.username).toBe('testuser');
        });

        it('loads the articles relation so the profile can list them', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(baseUser() as never);

            await userService.getProfile(1);

            expect(mockUserRepository.findOne).toHaveBeenCalledWith(
                expect.objectContaining({ relations: ['articles'] })
            );
        });
    });

    describe('linkPlayersToUser', () => {
        it('does nothing when the user has no roblox identity', async () => {
            await userService.linkPlayersToUser(baseUser());

            expect(mockPlayerRepository.createQueryBuilder).not.toHaveBeenCalled();
        });

        it('matches on roblox id alone when no username is set', async () => {
            mockPlayerQueryBuilder.getMany.mockResolvedValueOnce([] as never);

            await userService.linkPlayersToUser(baseUser({ robloxUserId: '55' }));

            expect(mockPlayerQueryBuilder.where).toHaveBeenCalledWith('player.robloxUserId = :rid', { rid: '55' });
            expect(mockPlayerQueryBuilder.orWhere).not.toHaveBeenCalled();
        });

        it('widens to an OR when both roblox id and username are set', async () => {
            mockPlayerQueryBuilder.getMany.mockResolvedValueOnce([] as never);

            await userService.linkPlayersToUser(baseUser({ robloxUserId: '55', robloxUsername: 'Builder' }));

            expect(mockPlayerQueryBuilder.orWhere).toHaveBeenCalledWith(
                'LOWER(player.robloxUsername) = :rname',
                { rname: 'builder' }
            );
        });

        it('claims every matched player for the user', async () => {
            const players = [{ id: 1 } as any, { id: 2 } as any];
            mockPlayerQueryBuilder.getMany.mockResolvedValueOnce(players as never);

            await userService.linkPlayersToUser(baseUser({ id: 7, robloxUserId: '55', robloxUsername: 'Builder' }));

            expect(players[0].userId).toBe(7);
            expect(players[1].userId).toBe(7);
            expect(players[0].robloxUsername).toBe('builder');
            expect(mockPlayerRepository.save).toHaveBeenCalledTimes(2);
        });
    });

    describe('connectRoblox', () => {
        it('throws ConflictError when another user already holds that roblox account', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(baseUser({ id: 2 }) as never);

            await expect(userService.connectRoblox(1, '55', 'Builder')).rejects.toThrow(ConflictError);
        });

        it('allows reconnecting the same roblox account to its own user', async () => {
            mockUserRepository.findOne
                .mockResolvedValueOnce(baseUser({ id: 1 }) as never)
                .mockResolvedValueOnce(baseUser({ id: 1 }) as never);
            mockPlayerQueryBuilder.getMany.mockResolvedValueOnce([] as never);

            await expect(userService.connectRoblox(1, '55', 'Builder')).resolves.toMatchObject({ robloxUserId: '55' });
        });

        it('throws NotFoundError when the user does not exist', async () => {
            mockUserRepository.findOne
                .mockResolvedValueOnce(null as never)
                .mockResolvedValueOnce(null as never);

            await expect(userService.connectRoblox(999, '55', 'Builder')).rejects.toThrow(NotFoundError);
        });

        it('stores the roblox username normalized', async () => {
            mockUserRepository.findOne
                .mockResolvedValueOnce(null as never)
                .mockResolvedValueOnce(baseUser() as never);
            mockPlayerQueryBuilder.getMany.mockResolvedValueOnce([] as never);

            const saved = await userService.connectRoblox(1, '55', '  BuilderMan  ');

            expect(saved.robloxUsername).toBe('builderman');
        });

        it('links matching players once connected', async () => {
            mockUserRepository.findOne
                .mockResolvedValueOnce(null as never)
                .mockResolvedValueOnce(baseUser() as never);
            mockPlayerQueryBuilder.getMany.mockResolvedValueOnce([{ id: 9 } as any] as never);

            await userService.connectRoblox(1, '55', 'Builder');

            expect(mockPlayerRepository.save).toHaveBeenCalledTimes(1);
        });
    });

    describe('unlinkRoblox', () => {
        it('throws NotFoundError when the user does not exist', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(userService.unlinkRoblox(999)).rejects.toThrow(NotFoundError);
        });

        it('refuses to unlink an account that would be left with no way to log in', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(
                baseUser({ password: null, robloxUserId: '55' }) as never
            );

            await expect(userService.unlinkRoblox(1)).rejects.toThrow(ConflictError);
        });

        it('clears the roblox fields and detaches claimed players', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(
                baseUser({ robloxUserId: '55', robloxUsername: 'builder' }) as never
            );

            const saved = await userService.unlinkRoblox(1);

            expect(saved.robloxUserId).toBeNull();
            expect(saved.robloxUsername).toBeNull();
            expect(mockPlayerQueryBuilder.set).toHaveBeenCalledWith({ userId: null });
            expect(mockPlayerQueryBuilder.execute).toHaveBeenCalled();
        });
    });

    describe('createUserFromRoblox', () => {
        it('returns the existing user instead of creating a duplicate', async () => {
            const existing = baseUser({ robloxUserId: '55' });
            mockUserRepository.findOne.mockResolvedValueOnce(existing as never);

            const { user } = await userService.createUserFromRoblox('55', 'Builder');

            expect(user).toBe(existing);
            expect(mockUserRepository.save).not.toHaveBeenCalled();
        });

        it('derives the username from the normalized roblox name', async () => {
            mockUserRepository.findOne
                .mockResolvedValueOnce(null as never)
                .mockResolvedValueOnce(null as never);
            mockPlayerQueryBuilder.getMany.mockResolvedValueOnce([] as never);

            const { user } = await userService.createUserFromRoblox('55', 'BuilderMan');

            expect(user.username).toBe('builderman');
            expect(user.password).toBeNull();
            expect(user.role).toBe('user');
        });

        it('suffixes the username when it is already taken', async () => {
            mockUserRepository.findOne
                .mockResolvedValueOnce(null as never)
                .mockResolvedValueOnce(baseUser({ username: 'builderman' }) as never);
            mockPlayerQueryBuilder.getMany.mockResolvedValueOnce([] as never);

            const { user } = await userService.createUserFromRoblox('123456', 'BuilderMan');

            expect(user.username).toBe('builderman_3456');
        });

        it('truncates an over-long roblox name to 24 characters', async () => {
            mockUserRepository.findOne
                .mockResolvedValueOnce(null as never)
                .mockResolvedValueOnce(null as never);
            mockPlayerQueryBuilder.getMany.mockResolvedValueOnce([] as never);

            const { user } = await userService.createUserFromRoblox('55', 'a'.repeat(40));

            expect(user.username).toHaveLength(24);
        });
    });

    describe('issueTokenForUser', () => {
        it('throws NotFoundError when the user is gone', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(userService.issueTokenForUser(999)).rejects.toThrow(NotFoundError);
        });

        it('signs a token carrying the current tokenVersion', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(baseUser({ tokenVersion: 5 }) as never);

            const { token } = await userService.issueTokenForUser(1);

            expect(jwt.verify(token, TEST_JWT_SECRET)).toMatchObject({ id: 1, tokenVersion: 5 });
        });
    });

    describe('promoteRoleIfUser', () => {
        it('returns null when the user does not exist', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(null as never);

            await expect(userService.promoteRoleIfUser(999, 'captain', 1)).resolves.toBeNull();
        });

        it('never demotes an admin', async () => {
            const admin = baseUser({ role: 'admin' });
            mockUserRepository.findOne.mockResolvedValueOnce(admin as never);

            const result = await userService.promoteRoleIfUser(1, 'captain', 2);

            expect(result!.role).toBe('admin');
            expect(mockUserRepository.save).not.toHaveBeenCalled();
        });

        it('never demotes a superadmin', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(baseUser({ role: 'superadmin' }) as never);

            const result = await userService.promoteRoleIfUser(1, 'vice_captain', 2);

            expect(result!.role).toBe('superadmin');
            expect(mockUserRepository.save).not.toHaveBeenCalled();
        });

        it('does not step a captain down to a lesser staff role', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(baseUser({ role: 'captain' }) as never);

            const result = await userService.promoteRoleIfUser(1, 'vice_captain', 2);

            expect(result!.role).toBe('captain');
            expect(mockUserRepository.save).not.toHaveBeenCalled();
        });

        it('is a no-op when the user already holds the desired role', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(baseUser({ role: 'court_captain' }) as never);

            await userService.promoteRoleIfUser(1, 'court_captain', 2);

            expect(mockUserRepository.save).not.toHaveBeenCalled();
            expect(mockAuditLogRepository.save).not.toHaveBeenCalled();
        });

        it('promotes a plain user and bumps their tokenVersion', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(baseUser({ role: 'user', tokenVersion: 1 }) as never);

            const result = await userService.promoteRoleIfUser(1, 'captain', 2);

            expect(result!.role).toBe('captain');
            expect(result!.tokenVersion).toBe(2);
        });

        it('writes an audit entry naming the actor and the role transition', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(baseUser({ role: 'user' }) as never);

            await userService.promoteRoleIfUser(1, 'captain', 42, { ip: '127.0.0.1' });

            expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    actorId: 42,
                    targetId: 1,
                    oldRole: 'user',
                    newRole: 'captain',
                    ip: '127.0.0.1',
                })
            );
        });

        it('records a null ip when none was supplied', async () => {
            mockUserRepository.findOne.mockResolvedValueOnce(baseUser({ role: 'user' }) as never);

            await userService.promoteRoleIfUser(1, 'captain', 42);

            expect(mockAuditLogRepository.save).toHaveBeenCalledWith(expect.objectContaining({ ip: null }));
        });
    });
});
