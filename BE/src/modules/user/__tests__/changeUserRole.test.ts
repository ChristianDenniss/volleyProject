import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { RoleAuditLog } from '../role-audit-log.entity.js';
import { UserService } from '../user.service.js';
import { UnauthorizedError } from '../../../errors/UnauthorizedError.js';
import { NotFoundError } from '../../../errors/NotFoundError.js';
import { AppDataSource } from '../../../db/data-source.js';

const mockUserRepo = {
  findOne: jest.fn(),
};

const mockQueryRunner = {
  connect: jest.fn().mockResolvedValue(undefined),
  startTransaction: jest.fn().mockResolvedValue(undefined),
  commitTransaction: jest.fn().mockResolvedValue(undefined),
  rollbackTransaction: jest.fn().mockResolvedValue(undefined),
  release: jest.fn().mockResolvedValue(undefined),
  manager: {
    save: jest.fn().mockImplementation(async (entity: unknown) => entity),
  },
};

const getRepositoryMock = jest.fn((entity: unknown) => {
  if (entity === RoleAuditLog) {
    return {};
  }
  return mockUserRepo;
});

describe('UserService.changeUserRole', () => {
  let userService: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryRunner.manager.save.mockImplementation(async (entity: unknown) => entity);
    (AppDataSource.getRepository as jest.Mock).mockImplementation(getRepositoryMock);
    (AppDataSource.createQueryRunner as jest.Mock).mockReturnValue(mockQueryRunner);
    userService = new UserService();
  });

  it('rejects non-superadmin requesters', async () => {
    await expect(
      userService.changeUserRole({ id: 2, role: 'admin' }, 3, 'admin')
    ).rejects.toThrow(UnauthorizedError);

    expect(mockUserRepo.findOne).not.toHaveBeenCalled();
  });

  it('rejects regular users', async () => {
    await expect(
      userService.changeUserRole({ id: 2, role: 'user' }, 3, 'admin')
    ).rejects.toThrow('Only superadmin can change user roles');
  });

  it('promotes a user to admin and writes an audit log', async () => {
    const target = {
      id: 3,
      username: 'player',
      role: 'user',
      tokenVersion: 0,
    };

    mockUserRepo.findOne.mockResolvedValueOnce(target);

    const result = await userService.changeUserRole(
      { id: 1, role: 'superadmin' },
      3,
      'admin',
      { ip: '127.0.0.1' }
    );

    expect(result.role).toBe('admin');
    expect(result.tokenVersion).toBe(1);
    expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 1,
        targetId: 3,
        oldRole: 'user',
        newRole: 'admin',
        ip: '127.0.0.1',
      })
    );
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
  });

  it('prevents demoting another superadmin', async () => {
    mockUserRepo.findOne.mockResolvedValueOnce({
      id: 4,
      username: 'other-super',
      role: 'superadmin',
      tokenVersion: 0,
    });

    await expect(
      userService.changeUserRole({ id: 1, role: 'superadmin' }, 4, 'admin')
    ).rejects.toThrow('Cannot modify another superadmin');

    expect(mockQueryRunner.manager.save).not.toHaveBeenCalled();
  });

  it('allows a superadmin no-op on another superadmin', async () => {
    const target = {
      id: 4,
      username: 'other-super',
      role: 'superadmin',
      tokenVersion: 2,
    };

    mockUserRepo.findOne.mockResolvedValueOnce(target);

    const result = await userService.changeUserRole(
      { id: 1, role: 'superadmin' },
      4,
      'superadmin'
    );

    expect(result.role).toBe('superadmin');
    expect(result.tokenVersion).toBe(3);
    expect(mockQueryRunner.manager.save).toHaveBeenCalled();
  });

  it('throws when target user does not exist', async () => {
    mockUserRepo.findOne.mockResolvedValueOnce(null);

    await expect(
      userService.changeUserRole({ id: 1, role: 'superadmin' }, 999, 'admin')
    ).rejects.toThrow(NotFoundError);
  });

  it('rejects invalid desired roles', async () => {
    await expect(
      userService.changeUserRole({ id: 1, role: 'superadmin' }, 3, 'guest' as 'admin')
    ).rejects.toThrow('Invalid role');
  });
});
