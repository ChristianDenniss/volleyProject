import '../../../__mocks__/data-source';
import { UserService } from '../user.service.ts';
import { mockRepository, mockUser, mockUsers, mockToken } from '../../../__mocks__/fixtures.ts';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Mock crypto and jwt
jest.mock('crypto', () => ({
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('hashed_password')
  }),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked_token'),
}));

describe('UserService', () => {
  let userService: UserService;
 
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    userService = new UserService();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      // Setup mocks
      mockRepository.findOne.mockResolvedValueOnce(null);
      mockRepository.save.mockResolvedValueOnce(mockUser);

      // Execute
      const result = await userService.createUser('testuser', 'test@example.com', 'password123');

      // Verify
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: [{ username: 'testuser' }, { email: 'test@example.com' }],
      });
      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw error if username is not provided', async () => {
      await expect(userService.createUser('', 'test@example.com', 'password123')).rejects.toThrow('Username is required');
    });

    it('should throw error if email is not provided', async () => {
      await expect(userService.createUser('testuser', '', 'password123')).rejects.toThrow('Email is required');
    });

    it('should throw error if password is not provided', async () => {
      await expect(userService.createUser('testuser', 'test@example.com', '')).rejects.toThrow('Password is required');
    });

    it('should throw error if password is too short', async () => {
      await expect(userService.createUser('testuser', 'test@example.com', '12345')).rejects.toThrow('Password must be at least 6 characters long');
    });

    it('should throw error if email format is invalid', async () => {
      await expect(userService.createUser('testuser', 'invalid-email', 'password123')).rejects.toThrow('Invalid email format');
    });

    it('should throw error if username already exists', async () => {
      mockRepository.findOne.mockResolvedValueOnce(mockUser);

      await expect(userService.createUser('testuser', 'new@example.com', 'password123')).rejects.toThrow('Username already in use');
    });

    it('should throw error if email already exists', async () => {
      const existingUserWithSameEmail = { ...mockUser, username: 'different' };
      mockRepository.findOne.mockResolvedValueOnce(existingUserWithSameEmail);

      await expect(userService.createUser('newuser', 'test@example.com', 'password123')).rejects.toThrow('Email already in use');
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      mockRepository.find.mockResolvedValueOnce(mockUsers);

      const result = await userService.getAllUsers();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(mockUser);

      const result = await userService.getUserById(1);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(mockUser);
    });

    it('should throw error if id is not provided', async () => {
      await expect(userService.getUserById(0)).rejects.toThrow('User ID is required');
    });

    it('should throw error if user is not found', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(null);

      await expect(userService.getUserById(999)).rejects.toThrow('User not found');
    });
  });

  describe('getUserByUsername', () => {
    it('should return a user by username', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(mockUser);

      const result = await userService.getUserByUsername('testuser');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ username: 'testuser' });
      expect(result).toEqual(mockUser);
    });

    it('should throw error if username is not provided', async () => {
      await expect(userService.getUserByUsername('')).rejects.toThrow('Username is required');
    });

    it('should throw error if user is not found', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(null);

      await expect(userService.getUserByUsername('nonexistent')).rejects.toThrow('User not found');
    });
  });

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      const updatedUser = { ...mockUser, username: 'updateduser' };
      mockRepository.findOneBy.mockResolvedValueOnce(mockUser);
      mockRepository.findOneBy.mockResolvedValueOnce(null); // No other user with the same username
      mockRepository.save.mockResolvedValueOnce(updatedUser);

      const result = await userService.updateUser(1, 'updateduser');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ username: 'updateduser' });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedUser);
    });

    it('should throw error if id is not provided', async () => {
      await expect(userService.updateUser(0)).rejects.toThrow('User ID is required');
    });

    it('should throw error if user is not found', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(null);

      await expect(userService.updateUser(999, 'updateduser')).rejects.toThrow('User not found');
    });

    it('should throw error if username is already in use', async () => {
      const existingUser = { ...mockUser, id: 2 };
      mockRepository.findOneBy.mockResolvedValueOnce(mockUser);
      mockRepository.findOneBy.mockResolvedValueOnce(existingUser);

      await expect(userService.updateUser(1, 'existinguser')).rejects.toThrow('Username already in use');
    });

    it('should throw error if email is already in use', async () => {
      const existingUser = { ...mockUser, id: 2 };
      mockRepository.findOneBy.mockResolvedValueOnce(mockUser);
      mockRepository.findOneBy.mockResolvedValueOnce(existingUser);

      await expect(userService.updateUser(1, undefined, 'existing@example.com')).rejects.toThrow('Email already in use');
    });

    it('should throw error if email format is invalid', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(mockUser);

      await expect(userService.updateUser(1, undefined, 'invalid-email')).rejects.toThrow('Invalid email format');
    });

    it('should hash password if provided', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(mockUser);
      mockRepository.save.mockResolvedValueOnce({ ...mockUser, password: 'hashed_password' });

      await userService.updateUser(1, undefined, undefined, 'newpassword123');

      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
    });

    it('should throw error if password is too short', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(mockUser);

      await expect(userService.updateUser(1, undefined, undefined, '12345')).rejects.toThrow('Password must be at least 6 characters long');
    });

    it('should update role if provided', async () => {
      const updatedUser = { ...mockUser, role: 'admin' };
      mockRepository.findOneBy.mockResolvedValueOnce(mockUser);
      mockRepository.save.mockResolvedValueOnce(updatedUser);

      const result = await userService.updateUser(1, undefined, undefined, undefined, 'admin');

      expect(result.role).toBe('admin');
    });

    it('should throw error if role is invalid', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(mockUser);

      await expect(userService.updateUser(1, undefined, undefined, undefined, 'invalid_role')).rejects.toThrow('Invalid role');
    });
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(mockUser);
      mockRepository.remove.mockResolvedValueOnce(undefined);

      await userService.deleteUser(1);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw error if id is not provided', async () => {
      await expect(userService.deleteUser(0)).rejects.toThrow('User ID is required');
    });

    it('should throw error if user is not found', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(null);

      await expect(userService.deleteUser(999)).rejects.toThrow('User not found');
    });
  });

  describe('authenticateUser', () => {
    it('should authenticate a user successfully', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(mockUser);
      (jwt.sign as jest.Mock).mockReturnValueOnce(mockToken);

      const result = await userService.authenticateUser('testuser', 'password123');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ username: 'testuser' });
      expect(crypto.createHash).toHaveBeenCalledWith('sha256'); 
      expect(jwt.sign).toHaveBeenCalled();
      expect(result).toEqual({ user: mockUser, token: mockToken });
    });

    it('should throw error if username is not provided', async () => {
      await expect(userService.authenticateUser('', 'password123')).rejects.toThrow('Username is required');
    });

    it('should throw error if password is not provided', async () => {
      await expect(userService.authenticateUser('testuser', '')).rejects.toThrow('Password is required');
    });

    it('should throw error if user is not found', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(null);

      await expect(userService.authenticateUser('nonexistent', 'password123')).rejects.toThrow('Invalid username or password');
    });

    it('should throw error if password is invalid', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(mockUser);
      // Force the crypto hash to return something different for verification
      jest.spyOn(crypto, 'createHash').mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('different_hash')
      } as any);

      await expect(userService.authenticateUser('testuser', 'wrongpassword')).rejects.toThrow('Invalid username or password');
    });
  });

  describe('getProfile', () => {
    it('should return a user profile by id', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(mockUser);

      const result = await userService.getProfile(1);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(mockUser);
    });

    it('should throw error if id is not provided', async () => {
      await expect(userService.getProfile(0)).rejects.toThrow('User ID is required');
    });

    it('should throw error if user is not found', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(null);

      await expect(userService.getProfile(999)).rejects.toThrow('User not found');
    });
  });
});