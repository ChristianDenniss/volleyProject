import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Request, Response } from 'express';
import { UserController } from '../user.controller.js';

// Mock data
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com', 
  password: 'hashedpassword',
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockUsers = [
  mockUser,
  {
    id: 2,
    username: 'anotheruser',
    email: 'another@example.com',
    password: 'hashedpassword',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockToken = 'mock.jwt.token';

// Mock the UserService
jest.mock('../user.service', () => {
  return {
    UserService: jest.fn().mockImplementation(() => {
      return {
        createUser: jest.fn(),
        getAllUsers: jest.fn(),
        getUserById: jest.fn(),
        authenticateUser: jest.fn(),
        getProfile: jest.fn(),
        getUserByUsername: jest.fn(),
        changePassword: jest.fn(),
      };
    })
  };
});

describe('UserController', () => {
  let userController;
  let mockRequest;
  let mockResponse;
  let jsonMock;
  let statusMock;
  let sendMock;

  beforeEach(() => {
    jsonMock = jest.fn().mockReturnThis();
    sendMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock, send: sendMock, cookie: jest.fn(), clearCookie: jest.fn() });

    mockRequest = {};
    mockResponse = {
      json: jsonMock,
      status: statusMock,
      send: sendMock,
    };

    userController = new UserController();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a user and return 201 status', async () => {
      const { password, ...userWithoutPassword } = mockUser;

      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      userController.userService.createUser.mockResolvedValueOnce(mockUser);

      await userController.register(mockRequest, mockResponse);

      expect(userController.userService.createUser).toHaveBeenCalledWith('testuser', 'test@example.com', 'password123', 'user');
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(expect.not.objectContaining({ password: expect.any(String) }));
    });

    it('should handle validation errors with 400 status', async () => {
      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: '',
      };
      userController.userService.createUser.mockRejectedValueOnce(new Error('Password is required'));

      await userController.register(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Password is required' });
    });

    it('should handle duplicate user errors with 400 status', async () => {
      mockRequest.body = {
        username: 'existinguser',
        email: 'test@example.com',
        password: 'password123',
      };
      userController.userService.createUser.mockRejectedValueOnce(new Error('Username already in use'));

      await userController.register(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Username already in use' });
    });

    it('should handle server errors with 500 status', async () => {
      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      userController.userService.createUser.mockRejectedValueOnce(new Error('Database error'));

      await userController.register(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to register user' });
    });
  });

  describe('login', () => {
    it('should login a user and return token', async () => {
      const { password, ...userWithoutPassword } = mockUser;

      mockRequest.body = {
        username: 'testuser',
        password: 'password123',
      };
      userController.userService.authenticateUser.mockResolvedValueOnce({
        user: mockUser,
        token: mockToken,
      });

      await userController.login(mockRequest, mockResponse);

      expect(userController.userService.authenticateUser).toHaveBeenCalledWith('testuser', 'password123');
      expect(jsonMock).toHaveBeenCalledWith({
        user: expect.not.objectContaining({ password: expect.any(String) }),
      });
    });

    it('should handle validation errors with 400 status', async () => {
      mockRequest.body = {
        username: 'testuser',
        password: '',
      };
      userController.userService.authenticateUser.mockRejectedValueOnce(new Error('Password is required'));

      await userController.login(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Password is required' });
    });

    it('should handle invalid credentials with 401 status', async () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'wrongpassword',
      };
      const { UnauthorizedError } = await import('../../../errors/UnauthorizedError.js');
      userController.userService.authenticateUser.mockRejectedValueOnce(
        new UnauthorizedError('Invalid username or password')
      );

      await userController.login(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid username or password' });
    });

    it('should handle server errors with 500 status', async () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'password123',
      };
      userController.userService.authenticateUser.mockRejectedValueOnce(new Error('Database error'));

      await userController.login(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to login' });
    });
  });

  describe('getUsers', () => {
    it('should return all users without passwords', async () => {
      const usersWithoutPasswords = mockUsers.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      userController.userService.getAllUsers.mockResolvedValueOnce(mockUsers);

      await userController.getUsers(mockRequest, mockResponse);

      expect(userController.userService.getAllUsers).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(usersWithoutPasswords);
    });

    it('should handle server errors with 500 status', async () => {
      userController.userService.getAllUsers.mockRejectedValueOnce(new Error('Database error'));

      await userController.getUsers(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch users' });
    });
  });

  describe('getUserById', () => {
    it('should return a user by id without password', async () => {
      const { password, ...userWithoutPassword } = mockUser;

      mockRequest.params = { id: '1' };
      userController.userService.getUserById.mockResolvedValueOnce(mockUser);

      await userController.getUserById(mockRequest, mockResponse);

      expect(userController.userService.getUserById).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith(expect.not.objectContaining({ password: expect.any(String) }));
    });

    it('should handle not found errors with 404 status', async () => {
      mockRequest.params = { id: '999' };
      userController.userService.getUserById.mockRejectedValueOnce(new Error('User not found'));

      await userController.getUserById(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should handle server errors with 500 status', async () => {
      mockRequest.params = { id: '1' };
      userController.userService.getUserById.mockRejectedValueOnce(new Error('Database error'));

      await userController.getUserById(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch user' });
    });
  });

  describe('getProfile', () => {
    it('should return the current user profile without password', async () => {
      const { password, ...userWithoutPassword } = mockUser;

      mockRequest.user = { id: 1, username: 'testuser', role: 'user' };
      userController.userService.getProfile.mockResolvedValueOnce(mockUser);

      await userController.getProfile(mockRequest, mockResponse);

      expect(userController.userService.getProfile).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith(expect.not.objectContaining({ password: expect.any(String) }));
    });

    it('should handle unauthorized errors with 401 status', async () => {
      mockRequest.user = undefined;

      await userController.getProfile(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should handle not found errors with 404 status', async () => {
      mockRequest.user = { id: 999, username: 'missing', role: 'user' };
      userController.userService.getProfile.mockRejectedValueOnce(new Error('User not found'));

      await userController.getProfile(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should handle server errors with 500 status', async () => {
      mockRequest.user = { id: 1, username: 'testuser', role: 'user' };
      userController.userService.getProfile.mockRejectedValueOnce(new Error('Database error'));

      await userController.getProfile(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch profile' });
    });
  });
});