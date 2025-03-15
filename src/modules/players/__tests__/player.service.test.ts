import '../../../__mocks__/data-source';
import { PlayerService } from '../player.service';
import { mockRepository, mockPlayer, mockPlayers, mockTeam } from '../../../__mocks__/fixtures';
import { NotFoundError } from '../../../errors/NotFoundError';
import { MissingFieldError } from '../../../errors/MissingFieldError';

describe('PlayerService', () => 
{
    let playerService: PlayerService;

    beforeEach(() => 
    {
        jest.clearAllMocks();
        playerService = new PlayerService();
    });

    describe('createPlayer', () => 
    {
        it('should create a player successfully', async () => 
        {
            mockRepository.findOneBy.mockResolvedValueOnce(mockTeam);
            mockRepository.save.mockResolvedValueOnce(mockPlayer);

            const result = await playerService.createPlayer('John Doe', 'Forward', 1);

            expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
            expect(mockRepository.save).toHaveBeenCalled();
            expect(result).toEqual(mockPlayer);
        });

        it('should throw error if name is missing', async () => 
        {
            await expect(playerService.createPlayer('', 'Forward', 1)).rejects.toThrow('Player name is required');
        });

        it('should throw error if position is missing', async () => 
        {
            await expect(playerService.createPlayer('John Doe', '', 1)).rejects.toThrow('Position is required');
        });

        it('should throw error if teamId is missing', async () => 
        {
            await expect(playerService.createPlayer('John Doe', 'Forward', 0)).rejects.toThrow('Team ID is required');
        });

        it('should throw error if team does not exist', async () => 
        {
            mockRepository.findOneBy.mockResolvedValueOnce(null);

            await expect(playerService.createPlayer('John Doe', 'Forward', 999)).rejects.toThrow('Team with ID 999 not found');
        });
    });

    describe('getAllPlayers', () => 
    {
        it('should return all players', async () => 
        {
            mockRepository.find.mockResolvedValueOnce(mockPlayers);

            const result = await playerService.getAllPlayers();

            expect(mockRepository.find).toHaveBeenCalled();
            expect(result).toEqual(mockPlayers);
        });
    });

    describe('getPlayerById', () => 
    {
        it('should return a player by ID', async () => 
        {
            mockRepository.findOne.mockResolvedValueOnce(mockPlayer);

            const result = await playerService.getPlayerById(1);

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
                relations: ["team", "stats"],
            });
            expect(result).toEqual(mockPlayer);
        });

        it('should throw error if ID is missing', async () => 
        {
            await expect(playerService.getPlayerById(0)).rejects.toThrow('Player ID is required');
        });

        it('should throw error if player is not found', async () => 
        {
            mockRepository.findOne.mockResolvedValueOnce(null);

            await expect(playerService.getPlayerById(999)).rejects.toThrow('Player with ID 999 not found');
        });
    });

    describe('updatePlayer', () => 
    {
        it('should update a player successfully', async () => 
        {
            const updatedPlayer = { ...mockPlayer, name: 'Updated Name' };
            mockRepository.findOne.mockResolvedValueOnce(mockPlayer);
            mockRepository.save.mockResolvedValueOnce(updatedPlayer);

            const result = await playerService.updatePlayer(1, 'Updated Name');

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
                relations: ["team", "stats"],
            });
            expect(mockRepository.save).toHaveBeenCalled();
            expect(result).toEqual(updatedPlayer);
        });

        it('should throw error if ID is missing', async () => 
        {
            await expect(playerService.updatePlayer(0)).rejects.toThrow('Player ID is required');
        });

        it('should throw error if player is not found', async () => 
        {
            mockRepository.findOne.mockResolvedValueOnce(null);

            await expect(playerService.updatePlayer(999, 'Updated Name')).rejects.toThrow('Player with ID 999 not found');
        });

        it('should throw error if team does not exist', async () => 
        {
            mockRepository.findOne.mockResolvedValueOnce(mockPlayer);
            mockRepository.findOneBy.mockResolvedValueOnce(null);

            await expect(playerService.updatePlayer(1, undefined, undefined, undefined, 999)).rejects.toThrow('Team with ID 999 not found');
        });
    });

    describe('deletePlayer', () => 
    {
        it('should delete a player successfully', async () => 
        {
            mockRepository.findOne.mockResolvedValueOnce(mockPlayer);
            mockRepository.remove.mockResolvedValueOnce(undefined);

            await playerService.deletePlayer(1);

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
                relations: ["team", "stats"],
            });
            expect(mockRepository.remove).toHaveBeenCalledWith(mockPlayer);
        });

        it('should throw error if ID is missing', async () => 
        {
            await expect(playerService.deletePlayer(0)).rejects.toThrow('Player ID is required');
        });

        it('should throw error if player is not found', async () => 
        {
            mockRepository.findOne.mockResolvedValueOnce(null);

            await expect(playerService.deletePlayer(999)).rejects.toThrow('Player with ID 999 not found');
        });
    });

    describe('getPlayersByTeamId', () => 
    {
        it('should return players by team ID', async () => 
        {
            mockRepository.findOneBy.mockResolvedValueOnce(mockTeam);
            mockRepository.find.mockResolvedValueOnce(mockPlayers);

            const result = await playerService.getPlayersByTeamId(1);

            expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
            expect(mockRepository.find).toHaveBeenCalledWith({
                where: { team: { id: 1 } },
                relations: ["stats"],
            });
            expect(result).toEqual(mockPlayers);
        });

        it('should throw error if team ID is missing', async () => 
        {
            await expect(playerService.getPlayersByTeamId(0)).rejects.toThrow('Team ID is required');
        });

        it('should throw error if team does not exist', async () => 
        {
            mockRepository.findOneBy.mockResolvedValueOnce(null);

            await expect(playerService.getPlayersByTeamId(999)).rejects.toThrow('Team with ID 999 not found');
        });
    });
});
