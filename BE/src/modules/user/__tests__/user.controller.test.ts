import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Request, Response } from 'express';
import { UserController } from '../user.controller.js';
import { UserService } from '../user.service.js';

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashedpassword',
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
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
    updatedAt: new Date(),
  },
];

const mockToken = 'mock.jwt.token';

const mockCreateUser = jest.fn();
const mockGetPublicUsers = jest.fn();
const mockGetUserById = jest.fn();
const mockAuthenticateUser = jest.fn();
const mockGetProfile = jest.fn();

describe('UserController', () => {
  let userController: UserController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;
  let cookieMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn().mockReturnThis();
    sendMock = jest.fn().mockReturnThis();
    cookieMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({
      json: jsonMock,
      send: sendMock,
      cookie: cookieMock,
      clearCookie: jest.fn(),
    });

    mockRequest = {};
    mockResponse = {
      json: jsonMock,
      status: statusMock,
      send: sendMock,
      cookie: cookieMock,
      clearCookie: jest.fn(),
    };

    UserService.prototype.createUser = mockCreateUser;
    UserService.prototype.getPublicUsers = mockGetPublicUsers;
    UserService.prototype.getUserById = mockGetUserById;
    UserService.prototype.authenticateUser = mockAuthenticateUser;
    UserService.prototype.getProfile = mockGetProfile;

    userController = new UserController();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a user and return 201 status', async () => {
      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      mockCreateUser.mockResolvedValueOnce(mockUser);

      await userController.register(mockRequest as Request, mockResponse as Response);

      expect(mockCreateUser).toHaveBeenCalledWith('testuser', 'test@example.com', 'password123', 'user');
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(expect.not.objectContaining({ password: expect.any(String) }));
    });

    it('should handle validation errors with 400 status', async () => {
      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: '',
      };
      mockCreateUser.mockRejectedValueOnce(new Error('Password is required'));

      await userController.register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Password is required' });
    });

    it('should handle duplicate user errors with 400 status', async () => {
      mockRequest.body = {
        username: 'existinguser',
        email: 'test@example.com',
        password: 'password123',
      };
      mockCreateUser.mockRejectedValueOnce(new Error('Username already in use'));

      await userController.register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Username already in use' });
    });

    it('should handle server errors with 500 status', async () => {
      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      mockCreateUser.mockRejectedValueOnce(new Error('Database error'));

      await userController.register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to register user' });
    });
  });

  describe('login', () => {
    it('should login a user and return token', async () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'password123',
      };
      mockAuthenticateUser.mockResolvedValueOnce({
        user: mockUser,
        token: mockToken,
      });

      await userController.login(mockRequest as Request, mockResponse as Response);

      expect(mockAuthenticateUser).toHaveBeenCalledWith('testuser', 'password123');
      expect(jsonMock).toHaveBeenCalledWith({
        user: expect.not.objectContaining({ password: expect.any(String) }),
      });
    });

    it('should handle validation errors with 400 status', async () => {
      mockRequest.body = {
        username: 'testuser',
        password: '',
      };
      mockAuthenticateUser.mockRejectedValueOnce(new Error('Password is required'));

      await userController.login(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Password is required' });
    });

    it('should handle invalid credentials with 401 status', async () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'wrongpassword',
      };
      const { UnauthorizedError } = await import('../../../errors/UnauthorizedError.js');
      mockAuthenticateUser.mockRejectedValueOnce(
        new UnauthorizedError('Invalid username or password')
      );

      await userController.login(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid username or password' });
    });

    it('should handle server errors with 500 status', async () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'password123',
      };
      mockAuthenticateUser.mockRejectedValueOnce(new Error('Database error'));

      await userController.login(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to login' });
    });
  });

  describe('getPublicUsers', () => {
    it('should return paginated users', async () => {
      mockGetPublicUsers.mockResolvedValueOnce([mockUsers, mockUsers.length]);
      mockRequest.query = {};

      await userController.getPublicUsers(mockRequest as Request, mockResponse as Response);

      expect(mockGetPublicUsers).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockUsers,
          total: mockUsers.length,
        })
      );
    });

    it('should handle server errors with 500 status', async () => {
      mockGetPublicUsers.mockRejectedValueOnce(new Error('Database error'));
      mockRequest.query = {};

      await userController.getPublicUsers(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch users' });
    });
  });

  describe('getUserById', () => {
    it('should return a user by id without password', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.user = { id: 1, username: 'testuser', role: 'user' };
      mockGetUserById.mockResolvedValueOnce(mockUser);

      await userController.getUserById(mockRequest as Request, mockResponse as Response);

      expect(mockGetUserById).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith(mockUser);
    });

    it('should handle not found errors with 404 status', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.user = { id: 1, username: 'admin', role: 'admin' };
      mockGetUserById.mockRejectedValueOnce(new Error('User not found'));

      await userController.getUserById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should handle server errors with 500 status', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.user = { id: 1, username: 'admin', role: 'admin' };
      mockGetUserById.mockRejectedValueOnce(new Error('Database error'));

      await userController.getUserById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch user' });
    });
  });

  describe('getProfile', () => {
    it('should return the current user profile without password', async () => {
      mockRequest.user = { id: 1, username: 'testuser', role: 'user' };
      mockGetProfile.mockResolvedValueOnce(mockUser);

      await userController.getProfile(mockRequest as Request, mockResponse as Response);

      expect(mockGetProfile).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith(expect.not.objectContaining({ password: expect.any(String) }));
    });

    it('should handle unauthorized errors with 401 status', async () => {
      mockRequest.user = undefined;

      await userController.getProfile(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should handle not found errors with 404 status', async () => {
      mockRequest.user = { id: 999, username: 'missing', role: 'user' };
      mockGetProfile.mockRejectedValueOnce(new Error('User not found'));

      await userController.getProfile(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should handle server errors with 500 status', async () => {
      mockRequest.user = { id: 1, username: 'testuser', role: 'user' };
      mockGetProfile.mockRejectedValueOnce(new Error('Database error'));

      await userController.getProfile(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch profile' });
    });
  });
});
