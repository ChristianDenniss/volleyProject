import { Not, Repository } from 'typeorm';
import { AppDataSource } from '../../db/data-source.js';
import { Games } from './game.entity.js';
import { Teams } from '../teams/team.entity.js';
import { Seasons } from '../seasons/season.entity.js';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { InvalidFormatError } from '../../errors/InvalidFormatError.js';

export class GameService {
    private gameRepository: Repository<Games>;
    private teamRepository: Repository<Teams>;
    private seasonRepository: Repository<Seasons>;

    constructor() {
        this.gameRepository = AppDataSource.getRepository(Games);
        this.teamRepository = AppDataSource.getRepository(Teams);
        this.seasonRepository = AppDataSource.getRepository(Seasons);
    }

    /**
     * Create a new game with validation
     */
    async createGame(
        date: Date, 
        seasonId: number, 
        teamIds: number[], 
        team1Score: number, 
        team2Score: number
    ): Promise<Games> {
        // Validation
        if (!date) throw new MissingFieldError("Game date");
        if (!seasonId) throw new MissingFieldError("Season ID");
        if (!teamIds || !teamIds.length) throw new MissingFieldError("Team IDs");
        if (team1Score === undefined || team2Score === undefined) throw new MissingFieldError("Scores");

        // Validate gameDate is not in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const gameDate = new Date(date);
        
        // Validate date format
        if (isNaN(gameDate.getTime())) {
            throw new InvalidFormatError("Invalid date format");
        }

        // Ensure game date is not in the past
        if (gameDate < today) {
            throw new InvalidFormatError("Game date cannot be in the past");
        }

        // Fetch the season
        const season = await this.seasonRepository.findOneBy({ id: seasonId });
        if (!season) throw new NotFoundError(`Season with ID ${seasonId} not found`);

        // Fetch teams
        const teams = await this.teamRepository.findByIds(teamIds);
        if (teams.length !== teamIds.length) {
            const missingTeams = teamIds.filter(id => !teams.some(team => team.id === id));
            throw new NotFoundError(`Teams with IDs ${missingTeams.join(', ')} not found`);
        }
        
        // Ensure we have at least 2 teams for a game
        if (teams.length < 2) {
            throw new MissingFieldError("At least two teams are required for a game");
        }

        // Create new game
        const newGame = new Games();
        newGame.date = gameDate;
        newGame.season = season;
        newGame.teams = teams;
        newGame.team1Score = team1Score;
        newGame.team2Score = team2Score;

        return this.gameRepository.save(newGame);
    }


    /**
     * Get all games
     */
    async getAllGames(): Promise<Games[]> {
        return this.gameRepository.find({
            relations: ["season", "teams", "stats"],
            order: { date: "DESC" } // Most recent games first
        });
    }

    /**
     * Get game by ID with validation
     */
    async getGameById(id: number): Promise<Games> {
        if (!id) throw new MissingFieldError("Game ID");

        const game = await this.gameRepository.findOne({
            where: { id },
            relations: ["season", "teams", "stats", "stats.player"],
        });

        if (!game) throw new NotFoundError(`Game with ID ${id} not found`);

        return game;
    }

    /**
     * Get the score by game ID
     */
    async getScoreByGameId(id: number): Promise<string> {
        if (!id) throw new MissingFieldError("Game ID");

        const game = await this.gameRepository.findOne({
            where: { id },
            relations: ["season", "teams", "stats"],
        });

        if (!game) throw new NotFoundError(`Game with ID ${id} not found`);

        // Return the score as a string in the format "team1Score-team2Score"
        return `${game.team1Score}-${game.team2Score}`;
    }

    /**
     * Update a game with validation
     */
    async updateGame(
        id: number, 
        date?: Date, 
        seasonId?: number, 
        teamIds?: number[], 
        team1Score?: number, 
        team2Score?: number
    ): Promise<Games> {
        if (!id) throw new MissingFieldError("Game ID");

        const game = await this.gameRepository.findOne({
            where: { id },
            relations: ["season", "teams", "stats"],
        });

        if (!game) throw new NotFoundError(`Game with ID ${id} not found`);

        if (date) {
            const gameDate = new Date(date);
            
            // Validate date format
            if (isNaN(gameDate.getTime())) {
                throw new InvalidFormatError("Invalid date format");
            }
            
            game.date = gameDate;
        }

        if (seasonId) {
            const season = await this.seasonRepository.findOneBy({ id: seasonId });
            if (!season) throw new NotFoundError(`Season with ID ${seasonId} not found`);
            game.season = season;
        }

        if (teamIds && teamIds.length > 0) {
            // Ensure we have at least 2 teams for a game
            if (teamIds.length < 2) {
                throw new MissingFieldError("At least two teams are required for a game");
            }
            
            const teams = await this.teamRepository.findByIds(teamIds);
            if (teams.length !== teamIds.length) {
                const missingTeams = teamIds.filter(id => !teams.some(team => team.id === id));
                throw new NotFoundError(`Teams with IDs ${missingTeams.join(', ')} not found`);
            }
            
            game.teams = teams;
        }

        if (team1Score !== undefined && team2Score !== undefined) {
            game.team1Score = team1Score;
            game.team2Score = team2Score;
        }

        return this.gameRepository.save(game);
    }

    /**
     * Delete a game with validation
     */
    async deleteGame(id: number): Promise<void> {
        if (!id) throw new MissingFieldError("Game ID");

        const game = await this.gameRepository.findOne({
            where: { id },
            relations: ["stats"],
        });

        if (!game) throw new NotFoundError(`Game with ID ${id} not found`);

        // Check if game has stats
        if (game.stats && game.stats.length > 0) {
            throw new ConflictError(`Cannot delete game: ${id} as it has recorded stats`);
        }

        await this.gameRepository.remove(game);
    }

    /**
     * Get games by season ID with validation
     */
    async getGamesBySeasonId(seasonId: number): Promise<Games[]> {
        if (!seasonId) throw new MissingFieldError("Season ID");

        // Check if season exists
        const season = await this.seasonRepository.findOneBy({ id: seasonId });
        if (!season) throw new NotFoundError(`Season with ID ${seasonId} not found`);

        return this.gameRepository.find({
            where: { season: { id: seasonId } },
            relations: ["teams", "stats"],
            order: { date: "DESC" } // Most recent games first
        });
    }

    /**
     * Get games by team ID with validation
     */
    async getGamesByTeamId(teamId: number): Promise<Games[]> {
        if (!teamId) throw new MissingFieldError("Team ID");

        // Check if team exists
        const team = await this.teamRepository.findOne({
            where: { id: teamId },
            relations: ["games"],
        });
        
        if (!team) throw new NotFoundError(`Team with ID ${teamId} not found`);

        // Extract game IDs from the team's games
        const gameIds = team.games.map(game => game.id);
        
        // Return early if no games
        if (gameIds.length === 0) {
            return [];
        }
        
        // Fetch full game data with relations
        return this.gameRepository.find({
            where: { id: { $in: gameIds } } as any,
            relations: ["season", "teams", "stats"],
            order: { date: "DESC" } // Most recent games first
        });
    }
}
