import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { RoleAuditLog } from '../role-audit-log.entity.js';
import { UserService } from '../user.service.js';
import { UnauthorizedError } from '../../../errors/UnauthorizedError.js';
import { NotFoundError } from '../../../errors/NotFoundError.js';

const mockUserRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
};

const mockAuditRepo = {
  save: jest.fn(),
};

const getRepositoryMock = jest.fn((entity: unknown) => {
  if (entity === RoleAuditLog) {
    return mockAuditRepo;
  }
  return mockUserRepo;
});

jest.unstable_mockModule('../../../db/data-source.js', () => ({
  AppDataSource: {
    getRepository: getRepositoryMock,
  },
}));

const { UserService: UserServiceClass } = await import('../user.service.js');

describe('UserService.changeUserRole', () => {
  let userService: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    getRepositoryMock.mockImplementation((entity: unknown) => {
      if (entity === RoleAuditLog) {
        return mockAuditRepo;
      }
      return mockUserRepo;
    });
    userService = new UserServiceClass();
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
    mockUserRepo.save.mockImplementation(async (user: typeof target) => user);
    mockAuditRepo.save.mockResolvedValue(undefined);

    const result = await userService.changeUserRole(
      { id: 1, role: 'superadmin' },
      3,
      'admin',
      { ip: '127.0.0.1' }
    );

    expect(result.role).toBe('admin');
    expect(result.tokenVersion).toBe(1);
    expect(mockAuditRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 1,
        targetId: 3,
        oldRole: 'user',
        newRole: 'admin',
        ip: '127.0.0.1',
      })
    );
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

    expect(mockUserRepo.save).not.toHaveBeenCalled();
    expect(mockAuditRepo.save).not.toHaveBeenCalled();
  });

  it('allows a superadmin no-op on another superadmin', async () => {
    const target = {
      id: 4,
      username: 'other-super',
      role: 'superadmin',
      tokenVersion: 2,
    };

    mockUserRepo.findOne.mockResolvedValueOnce(target);
    mockUserRepo.save.mockImplementation(async (user: typeof target) => user);
    mockAuditRepo.save.mockResolvedValue(undefined);

    const result = await userService.changeUserRole(
      { id: 1, role: 'superadmin' },
      4,
      'superadmin'
    );

    expect(result.role).toBe('superadmin');
    expect(result.tokenVersion).toBe(3);
    expect(mockAuditRepo.save).toHaveBeenCalled();
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
