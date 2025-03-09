// Mock repository
export const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findByIds: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  getMany: jest.fn()
};

// Mock User
export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashedpassword',
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock Users
export const mockUsers = [
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

// Mock Token
export const mockToken = 'mock.jwt.token';

// Create mock season with complete structure
const mockSeasonEntity = {
  id: 1,
  name: 'Season 2024',
  year: 2024,
  teams: [],
  games: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock Team with properly typed season
export const mockTeam = {
  id: 1,
  name: 'Test Team',
  season: mockSeasonEntity,
  players: [],
  games: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock Teams
export const mockTeams = [
  mockTeam,
  {
    id: 2,
    name: 'Another Team',
    season: mockSeasonEntity,
    players: [],
    games: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Mock Season
export const mockSeason = mockSeasonEntity;