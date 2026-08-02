import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { UserController } from '../user.controller.js';
import { UserService } from '../user.service.js';
import { MissingFieldError } from '../../../errors/MissingFieldError.js';
import { NotFoundError } from '../../../errors/NotFoundError.js';
import { UnauthorizedError } from '../../../errors/UnauthorizedError.js';

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
  let next: jest.Mock;
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
    next = jest.fn();

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

      await userController.register(mockRequest as Request, mockResponse as Response, next);

      expect(mockCreateUser).toHaveBeenCalledWith('testuser', 'test@example.com', 'password123', 'user');
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(expect.not.objectContaining({ password: expect.any(String) }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward validation errors to error handler', async () => {
      const validationError = new MissingFieldError('Password');
      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: '',
      };
      mockCreateUser.mockRejectedValueOnce(validationError);

      await userController.register(mockRequest as Request, mockResponse as Response, next);

      expect(next).toHaveBeenCalledWith(validationError);
    });

    it('should forward server errors to error handler', async () => {
      const serverError = new Error('Database error');
      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      mockCreateUser.mockRejectedValueOnce(serverError);

      await userController.register(mockRequest as Request, mockResponse as Response, next);

      expect(next).toHaveBeenCalledWith(serverError);
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

      await userController.login(mockRequest as Request, mockResponse as Response, next);

      expect(mockAuthenticateUser).toHaveBeenCalledWith('testuser', 'password123');
      expect(jsonMock).toHaveBeenCalledWith({
        user: expect.not.objectContaining({ password: expect.any(String) }),
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward invalid credentials to error handler', async () => {
      const authError = new UnauthorizedError('Invalid username or password');
      mockRequest.body = {
        username: 'testuser',
        password: 'wrongpassword',
      };
      mockAuthenticateUser.mockRejectedValueOnce(authError);

      await userController.login(mockRequest as Request, mockResponse as Response, next);

      expect(next).toHaveBeenCalledWith(authError);
    });

    it('should forward server errors to error handler', async () => {
      const serverError = new Error('Database error');
      mockRequest.body = {
        username: 'testuser',
        password: 'password123',
      };
      mockAuthenticateUser.mockRejectedValueOnce(serverError);

      await userController.login(mockRequest as Request, mockResponse as Response, next);

      expect(next).toHaveBeenCalledWith(serverError);
    });
  });

  describe('getPublicUsers', () => {
    it('should return paginated users', async () => {
      const usersWithoutPasswords = mockUsers.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
      mockRequest.query = {};
      mockGetPublicUsers.mockResolvedValueOnce([usersWithoutPasswords, usersWithoutPasswords.length]);

      await userController.getPublicUsers(mockRequest as Request, mockResponse as Response, next);

      expect(mockGetPublicUsers).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward server errors to error handler', async () => {
      const serverError = new Error('Database error');
      mockRequest.query = {};
      mockGetPublicUsers.mockRejectedValueOnce(serverError);

      await userController.getPublicUsers(mockRequest as Request, mockResponse as Response, next);

      expect(next).toHaveBeenCalledWith(serverError);
    });
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.user = { id: 1, username: 'testuser', role: 'admin' };
      mockGetUserById.mockResolvedValueOnce(mockUser);

      await userController.getUserById(mockRequest as Request, mockResponse as Response, next);

      expect(mockGetUserById).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith(mockUser);
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward not found errors to error handler', async () => {
      const notFoundError = new NotFoundError('User not found');
      mockRequest.params = { id: '999' };
      mockRequest.user = { id: 1, username: 'testuser', role: 'admin' };
      mockGetUserById.mockRejectedValueOnce(notFoundError);

      await userController.getUserById(mockRequest as Request, mockResponse as Response, next);

      expect(next).toHaveBeenCalledWith(notFoundError);
    });
  });

  describe('getProfile', () => {
    it('should return the current user profile without password', async () => {
      mockRequest.user = { id: 1, username: 'testuser', role: 'user' };
      mockGetProfile.mockResolvedValueOnce(mockUser);

      await userController.getProfile(mockRequest as Request, mockResponse as Response, next);

      expect(mockGetProfile).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith(expect.not.objectContaining({ password: expect.any(String) }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle unauthorized errors with 401 status', async () => {
      mockRequest.user = undefined;

      await userController.getProfile(mockRequest as Request, mockResponse as Response, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward not found errors to error handler', async () => {
      const notFoundError = new NotFoundError('User not found');
      mockRequest.user = { id: 999, username: 'missing', role: 'user' };
      mockGetProfile.mockRejectedValueOnce(notFoundError);

      await userController.getProfile(mockRequest as Request, mockResponse as Response, next);

      expect(next).toHaveBeenCalledWith(notFoundError);
    });
  });
});
