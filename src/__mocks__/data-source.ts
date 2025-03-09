import { mockRepository } from './fixtures';

// Mock all entity classes in one place
jest.mock('../modules/user/user.entity', () => ({
  User: class User {
    id = 0;
    username = '';
    email = '';
    password = '';
    role = '';
    createdAt = new Date();
    updatedAt = new Date();
  }
}));

jest.mock('../modules/teams/team.entity', () => ({
  Teams: class Teams {
    id = 0;
    name = '';
    season = null;
    players = [];
    games = [];
    createdAt = new Date();
    updatedAt = new Date();
  }
}));

jest.mock('../modules/seasons/season.entity', () => ({
  Seasons: class Seasons {
    id = 0;
    name = '';
    year = 0;
    teams = [];
    games = [];
    createdAt = new Date();
    updatedAt = new Date();
  }
}));

jest.mock('../modules/players/player.entity', () => ({
  Players: class Players {
    id = 0;
    name = '';
    position = '';
    jerseyNumber = 0;
    teams = [];
    stats = [];
    createdAt = new Date();
    updatedAt = new Date();
  }
}));

jest.mock('../modules/games/game.entity', () => ({
  Games: class Games {
    id = 0;
    date = new Date();
    location = '';
    homeTeam = null;
    awayTeam = null;
    season = null;
    stats = [];
    createdAt = new Date();
    updatedAt = new Date();
  }
}));

jest.mock('../modules/stats/stat.entity', () => ({
  Stats: class Stats {
    id = 0;
    player = null;
    game = null;
    kills = 0;
    errors = 0;
    aces = 0;
    serviceErrors = 0;
    blocks = 0;
    digs = 0;
    createdAt = new Date();
    updatedAt = new Date();
  }
}));

// Mock typeorm module
jest.mock('typeorm', () => ({
  getRepository: jest.fn().mockReturnValue(mockRepository),
  createConnection: jest.fn().mockResolvedValue(true),
  Entity: jest.fn(),
  PrimaryGeneratedColumn: jest.fn(),
  Column: jest.fn(),
  CreateDateColumn: jest.fn(),
  UpdateDateColumn: jest.fn(),
  ManyToOne: jest.fn(),
  OneToMany: jest.fn(),
  JoinColumn: jest.fn(),
  ManyToMany: jest.fn(),
  JoinTable: jest.fn(),
  In: jest.fn().mockImplementation(value => value),
  DataSource: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    isInitialized: true,
    getRepository: jest.fn().mockReturnValue(mockRepository)
  }))
}));

// Mock the data-source module
jest.mock('../db/data-source', () => ({
  AppDataSource: {
    initialize: jest.fn().mockResolvedValue(true),
    isInitialized: true,
    getRepository: jest.fn().mockReturnValue(mockRepository)
  }
}));