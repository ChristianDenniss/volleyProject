import { UserController } from '../user.controller.js';
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

jest.mock('../user.service', () => {
  return {
    UserService: jest.fn().mockImplementation(() => {
      return {
        createUser: jest.fn(),
        getPublicUsers: jest.fn(),
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
  let next;
  let jsonMock;
  let statusMock;
  let sendMock;

  beforeEach(() => {
    jsonMock = jest.fn().mockReturnThis();
    sendMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock, send: sendMock, cookie: jest.fn(), clearCookie: jest.fn() });
    next = jest.fn();

    mockRequest = {};
    mockResponse = {
      json: jsonMock,
      status: statusMock,
      send: sendMock,
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

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
      userController.userService.createUser.mockResolvedValueOnce(mockUser);

      await userController.register(mockRequest, mockResponse, next);

      expect(userController.userService.createUser).toHaveBeenCalledWith('testuser', 'test@example.com', 'password123', 'user');
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
      userController.userService.createUser.mockRejectedValueOnce(validationError);

      await userController.register(mockRequest, mockResponse, next);

      expect(next).toHaveBeenCalledWith(validationError);
    });

    it('should forward server errors to error handler', async () => {
      const serverError = new Error('Database error');
      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      userController.userService.createUser.mockRejectedValueOnce(serverError);

      await userController.register(mockRequest, mockResponse, next);

      expect(next).toHaveBeenCalledWith(serverError);
    });
  });

  describe('login', () => {
    it('should login a user and return token', async () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'password123',
      };
      userController.userService.authenticateUser.mockResolvedValueOnce({
        user: mockUser,
        token: mockToken,
      });

      await userController.login(mockRequest, mockResponse, next);

      expect(userController.userService.authenticateUser).toHaveBeenCalledWith('testuser', 'password123');
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
      userController.userService.authenticateUser.mockRejectedValueOnce(authError);

      await userController.login(mockRequest, mockResponse, next);

      expect(next).toHaveBeenCalledWith(authError);
    });

    it('should forward server errors to error handler', async () => {
      const serverError = new Error('Database error');
      mockRequest.body = {
        username: 'testuser',
        password: 'password123',
      };
      userController.userService.authenticateUser.mockRejectedValueOnce(serverError);

      await userController.login(mockRequest, mockResponse, next);

      expect(next).toHaveBeenCalledWith(serverError);
    });
  });

  describe('getPublicUsers', () => {
    it('should return paginated users', async () => {
      const usersWithoutPasswords = mockUsers.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
      mockRequest.query = {};

      userController.userService.getPublicUsers.mockResolvedValueOnce([usersWithoutPasswords, usersWithoutPasswords.length]);

      await userController.getPublicUsers(mockRequest, mockResponse, next);

      expect(userController.userService.getPublicUsers).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward server errors to error handler', async () => {
      const serverError = new Error('Database error');
      mockRequest.query = {};
      userController.userService.getPublicUsers.mockRejectedValueOnce(serverError);

      await userController.getPublicUsers(mockRequest, mockResponse, next);

      expect(next).toHaveBeenCalledWith(serverError);
    });
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.user = { id: 1, username: 'testuser', role: 'admin' };
      userController.userService.getUserById.mockResolvedValueOnce(mockUser);

      await userController.getUserById(mockRequest, mockResponse, next);

      expect(userController.userService.getUserById).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith(mockUser);
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward not found errors to error handler', async () => {
      const notFoundError = new NotFoundError('User not found');
      mockRequest.params = { id: '999' };
      mockRequest.user = { id: 1, username: 'testuser', role: 'admin' };
      userController.userService.getUserById.mockRejectedValueOnce(notFoundError);

      await userController.getUserById(mockRequest, mockResponse, next);

      expect(next).toHaveBeenCalledWith(notFoundError);
    });
  });

  describe('getProfile', () => {
    it('should return the current user profile without password', async () => {
      mockRequest.user = { id: 1, username: 'testuser', role: 'user' };
      userController.userService.getProfile.mockResolvedValueOnce(mockUser);

      await userController.getProfile(mockRequest, mockResponse, next);

      expect(userController.userService.getProfile).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith(expect.not.objectContaining({ password: expect.any(String) }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle unauthorized errors with 401 status', async () => {
      mockRequest.user = undefined;

      await userController.getProfile(mockRequest, mockResponse, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward not found errors to error handler', async () => {
      const notFoundError = new NotFoundError('User not found');
      mockRequest.user = { id: 999, username: 'missing', role: 'user' };
      userController.userService.getProfile.mockRejectedValueOnce(notFoundError);

      await userController.getProfile(mockRequest, mockResponse, next);

      expect(next).toHaveBeenCalledWith(notFoundError);
    });
  });
});
