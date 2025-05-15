import { GameService } from '../game.service';
import { mockRepository, mockGame, mockGames, mockTeam, mockTeams, mockSeason } from '../../../__mocks__/fixtures';
import { MissingFieldError } from '../../../errors/MissingFieldError';
import { NotFoundError } from '../../../errors/NotFoundError';
import { InvalidFormatError } from '../../../errors/InvalidFormatError';
import { ConflictError } from '../../../errors/ConflictError';

describe('GameService', () => {
  let gameService: GameService;

  beforeEach(() => {
    jest.clearAllMocks();

    gameService = new GameService();
  });

  describe('createGame', () => {
    it('should create a game successfully', async () => {
      mockRepository.save.mockResolvedValueOnce(mockGame);
      mockRepository.findOneBy.mockResolvedValueOnce(mockSeason);
      mockRepository.findByIds.mockResolvedValueOnce(mockTeams);

      const result = await gameService.createGame(new Date(), 1, [1, 2], 2, 3);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockGame);
    });

    it('should throw error if missing fields', async () => {
      
      await expect(gameService.createGame(new Date(), 1, [], 2, 3)).rejects.toThrow(
        new MissingFieldError('Team IDs'),
      );

      // @ts-expect-error: Testing behavior when scores are null
      await expect(gameService.createGame(null, 1, [1, 2], 2, 3)).rejects.toThrow(
        new MissingFieldError('Game date'),
      );

      // @ts-expect-error: Testing behavior when scores are null
      await expect(gameService.createGame(new Date(), 1, [1, 2], null, 3)).rejects.toThrow(
        new MissingFieldError('Scores'),
      );
    });

    it('should throw error if game date is in the past', async () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      await expect(gameService.createGame(pastDate, 1, [1, 2], 2, 3)).rejects.toThrow(
        new InvalidFormatError('Game date cannot be in the past'),
      );
    });

    it('should throw error if season not found', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(null);

      await expect(gameService.createGame(new Date(), 999, [1, 2], 2, 3)).rejects.toThrow(
        new NotFoundError('Season with ID 999 not found'),
      );
    });

    it('should throw error if not all teams found', async () => {
      mockRepository.findByIds.mockResolvedValueOnce([mockTeam]);

      await expect(gameService.createGame(new Date(), 1, [1, 2], 2, 3)).rejects.toThrow(
        new NotFoundError('Teams with IDs 2 not found'),
      );
    });

    it('should throw error if less than 2 teams provided', async () => {
      await expect(gameService.createGame(new Date(), 1, [1], 2, 3)).rejects.toThrow(
        new MissingFieldError('At least two teams are required for a game'),
      );
    });
  });

  describe('getAllGames', () => {
    it('should return all games', async () => {
      mockRepository.find.mockResolvedValueOnce(mockGames);

      const result = await gameService.getAllGames();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['season', 'teams', 'stats'],
        order: { date: 'DESC' },
      });
      expect(result).toEqual(mockGames);
    });
  });

  describe('getGameById', () => {
    it('should return a game by ID', async () => {
      mockRepository.findOne.mockResolvedValueOnce(mockGame);

      const result = await gameService.getGameById(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['season', 'teams', 'stats', 'stats.player'],
      });
      expect(result).toEqual(mockGame);
    });

    it('should throw error if ID is not provided', async () => {
      await expect(gameService.getGameById(0)).rejects.toThrow(
        new MissingFieldError('Game ID'),
      );
    });

    it('should throw error if game is not found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);

      await expect(gameService.getGameById(999)).rejects.toThrow(
        new NotFoundError('Game with ID 999 not found'),
      );
    });
  });

  describe('getScoreByGameId', () => {
    it('should return the score by game ID', async () => {
      mockRepository.findOne.mockResolvedValueOnce(mockGame);

      const result = await gameService.getScoreByGameId(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['season', 'teams', 'stats'],
      });
      expect(result).toEqual('2-3');
    });

    it('should throw error if game is not found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);

      await expect(gameService.getScoreByGameId(999)).rejects.toThrow(
        new NotFoundError('Game with ID 999 not found'),
      );
    });
  });

  describe('updateGame', () => {
    it('should update a game successfully', async () => {
      const updatedGame = { ...mockGame, team1Score: 3, team2Score: 4 };
      mockRepository.findOne.mockResolvedValueOnce(mockGame);
      mockRepository.save.mockResolvedValueOnce(updatedGame)    
      // @ts-expect-error: Testing behavior when scores are null
      const result = await gameService.updateGame(1, null, null, [1, 2], 3, 4);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedGame);
    });

    it('should throw error if game is not found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);


      // @ts-expect-error: Testing behavior when scores are null
      await expect(gameService.updateGame(999, null, null, [1, 2], 3, 4)).rejects.toThrow(
        new NotFoundError('Game with ID 999 not found'),
      );
    });

    it('should throw error if less than 2 teams are provided', async () => {
    // @ts-expect-error: Testing behavior when scores are null
      await expect(gameService.updateGame(1, null, null, [1], 3, 4)).rejects.toThrow(
        new MissingFieldError('At least two teams are required for a game'),
      );
    });
  });

  describe('deleteGame', () => {
    it('should delete a game successfully', async () => {
      mockRepository.findOne.mockResolvedValueOnce(mockGame);
      mockRepository.remove.mockResolvedValueOnce(undefined);

      await gameService.deleteGame(1);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockGame);
    });

    it('should throw error if game is not found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);

      await expect(gameService.deleteGame(999)).rejects.toThrow(
        new NotFoundError('Game with ID 999 not found'),
      );
    });

    it('should throw error if game has recorded stats', async () => {
      mockRepository.findOne.mockResolvedValueOnce({
        ...mockGame,
        stats: [{ id: 1 }],
      });

      await expect(gameService.deleteGame(1)).rejects.toThrow(
        new ConflictError('Cannot delete game: 1 as it has recorded stats'),
      );
    });
  });

  describe('getGamesBySeasonId', () => {
    it('should return games by season ID', async () => {
      mockRepository.find.mockResolvedValueOnce(mockGames);
      mockRepository.findOneBy.mockResolvedValueOnce(mockSeason);

      const result = await gameService.getGamesBySeasonId(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { season: { id: 1 } },
        relations: ['teams', 'stats'],
        order: { date: 'DESC' },
      });
      expect(result).toEqual(mockGames);
    });

    it('should throw error if season not found', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(null);

      await expect(gameService.getGamesBySeasonId(999)).rejects.toThrow(
        new NotFoundError('Season with ID 999 not found'),
      );
    });
  });

  describe('getGamesByTeamId', () => {
    it('should return games by team ID', async () => {
      mockRepository.find.mockResolvedValueOnce(mockGames);
      mockRepository.findOne.mockResolvedValueOnce(mockTeam);

      const result = await gameService.getGamesByTeamId(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { id: { $in: [1] } },
        relations: ['season', 'teams', 'stats'],
        order: { date: 'DESC' },
      });
      expect(result).toEqual(mockGames);
    });

    it('should throw error if team not found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);

      await expect(gameService.getGamesByTeamId(999)).rejects.toThrow(
        new NotFoundError('Team with ID 999 not found'),
      );
    });
  });
});
