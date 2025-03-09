import { StatService } from '../stat.service';
import { Repository } from 'typeorm';
import { Stats } from '../stat.entity';
import { Players } from '../../players/player.entity';
import { Games } from '../../games/game.entity';

// Mocking TypeORM's Repository type
jest.mock('../../db/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn().mockImplementation((entity: any) => {
      switch (entity) {
        case Stats:
          return mockedStatsRepository;
        case Players:
          return mockedPlayersRepository;
        case Games:
          return mockedGamesRepository;
        default:
          return {} as Repository<any>;
      }
    }),
  },
}));

// Mocks for the repositories
const mockedStatsRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  find: jest.fn(),
};

const mockedPlayersRepository = {
  findOne: jest.fn(),
};

const mockedGamesRepository = {
  findOne: jest.fn(),
};

describe('StatService', () => {
  let statService: StatService;

  beforeEach(() => {
    statService = new StatService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a stat entry', async () => {
    const playerMock = { id: 1, team: { id: 1 } };
    const gameMock = { id: 1, teams: [{ id: 1 }] };

    mockedPlayersRepository.findOne.mockResolvedValue(playerMock);
    mockedGamesRepository.findOne.mockResolvedValue(gameMock);
    mockedStatsRepository.findOne.mockResolvedValue(null); // No existing stat

    const newStat = {
      spikingErrors: 1,
      apeKills: 2,
      apeAttempts: 3,
      spikeKills: 4,
      spikeAttempts: 5,
      assists: 6,
      blocks: 7,
      digs: 8,
      blockFollows: 9,
      aces: 10,
      miscErrors: 11,
      playerId: 1,
      gameId: 1,
    };

    mockedStatsRepository.save.mockResolvedValue(newStat);

    const result = await statService.createStat(
      newStat.spikingErrors,
      newStat.apeKills,
      newStat.apeAttempts,
      newStat.spikeKills,
      newStat.spikeAttempts,
      newStat.assists,
      newStat.blocks,
      newStat.digs,
      newStat.blockFollows,
      newStat.aces,
      newStat.miscErrors,
      newStat.playerId,
      newStat.gameId
    );

    expect(result).toEqual(newStat);
    expect(mockedStatsRepository.save).toHaveBeenCalledWith(expect.objectContaining(newStat));
  });

  it('should update a stat entry', async () => {
    const statMock = {
      id: 1,
      spikingErrors: 1,
      apeKills: 2,
      apeAttempts: 3,
      spikeKills: 4,
      spikeAttempts: 5,
      assists: 6,
      blocks: 7,
      digs: 8,
      blockFollows: 9,
      aces: 10,
      miscErrors: 11,
      playerId: 1,
      gameId: 1,
    };

    mockedStatsRepository.findOne.mockResolvedValue(statMock);
    mockedStatsRepository.save.mockResolvedValue(statMock);

    const updatedStat = {
      spikingErrors: 10,
      apeKills: 20,
      apeAttempts: 30,
      spikeKills: 40,
      spikeAttempts: 50,
      assists: 60,
      blocks: 70,
      digs: 80,
      blockFollows: 90,
      aces: 100,
      miscErrors: 110,
      playerId: 1,
      gameId: 1,
    };

    const result = await statService.updateStat(1, updatedStat);

    expect(result).toEqual(updatedStat);
    expect(mockedStatsRepository.save).toHaveBeenCalledWith(expect.objectContaining(updatedStat));
  });

  it('should throw an error if stat to update does not exist', async () => {
    mockedStatsRepository.findOne.mockResolvedValue(null);

    const updatedStat = {
      spikingErrors: 10,
      apeKills: 20,
      apeAttempts: 30,
      spikeKills: 40,
      spikeAttempts: 50,
      assists: 60,
      blocks: 70,
      digs: 80,
      blockFollows: 90,
      aces: 100,
      miscErrors: 110,
      playerId: 1,
      gameId: 1,
    };

    await expect(statService.updateStat(1, updatedStat)).rejects.toThrowError('Stat not found');
  });

  it('should delete a stat entry', async () => {
    const statMock = { id: 1 };

    mockedStatsRepository.findOne.mockResolvedValue(statMock);
    mockedStatsRepository.remove.mockResolvedValue(statMock);

    const result = await statService.deleteStat(1);

    expect(result).toEqual(statMock);
    expect(mockedStatsRepository.remove).toHaveBeenCalledWith(statMock);
  });

  it('should throw an error if stat to delete does not exist', async () => {
    mockedStatsRepository.findOne.mockResolvedValue(null);

    await expect(statService.deleteStat(1)).rejects.toThrowError('Stat not found');
  });

  it('should find stats by player id', async () => {
    const statsMock = [{ id: 1, playerId: 1, gameId: 1 }];

    mockedStatsRepository.find.mockResolvedValue(statsMock);

    const result = await statService.getStatsByPlayerId(1);

    expect(result).toEqual(statsMock);
    expect(mockedStatsRepository.find).toHaveBeenCalledWith({ where: { playerId: 1 } });
  });

  it('should return an empty array if no stats found for player id', async () => {
    mockedStatsRepository.find.mockResolvedValue([]);

    const result = await statService.getStatsByPlayerId(999);

    expect(result).toEqual([]);
  });

  it('should find stats by game id', async () => {
    const statsMock = [{ id: 1, playerId: 1, gameId: 1 }];

    mockedStatsRepository.find.mockResolvedValue(statsMock);

    const result = await statService.getStatsByGameId(1);

    expect(result).toEqual(statsMock);
    expect(mockedStatsRepository.find).toHaveBeenCalledWith({ where: { gameId: 1 } });
  });

  it('should return an empty array if no stats found for game id', async () => {
    mockedStatsRepository.find.mockResolvedValue([]);

    const result = await statService.getStatsByGameId(999);

    expect(result).toEqual([]);
  });
});
