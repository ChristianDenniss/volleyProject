import { jest } from '@jest/globals';
import { mockRepository } from './src/__mocks__/fixtures.js';

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

await jest.unstable_mockModule('./src/db/data-source.js', () => ({
  AppDataSource: {
    initialize: jest.fn().mockResolvedValue(true),
    isInitialized: true,
    getRepository: jest.fn(() => mockRepository),
    createQueryRunner: jest.fn(() => mockQueryRunner),
  },
  initializeDataSource: jest.fn().mockResolvedValue({}),
}));

await jest.unstable_mockModule('./src/utils/cache.js', () => ({
  cacheService: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    invalidatePattern: jest.fn().mockResolvedValue(0),
    invalidateEntity: jest.fn().mockResolvedValue(undefined),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    isConnected: jest.fn().mockReturnValue(false),
  },
}));
