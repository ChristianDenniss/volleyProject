import { Repository } from 'typeorm';
import { AppDataSource } from '../../db/data-source';
import { Games } from './game.entity';
import { Teams } from '../teams/team.entity';
import { Seasons } from '../seasons/season.entity';

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
    async createGame(date: Date, seasonId: number, teamIds: number[]): Promise<Games> {
        // Validation
        if (!date) throw new Error("Game date is required");
        if (!seasonId) throw new Error("Season ID is required");
        if (!teamIds || !teamIds.length) throw new Error("At least one team ID is required");
        
        // Validate gameDate is not in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const gameDate = new Date(date);
        
        // Validate date format
        if (isNaN(gameDate.getTime())) {
            throw new Error("Invalid date format");
        }

        // Fetch the season
        const season = await this.seasonRepository.findOneBy({ id: seasonId });
        if (!season) throw new Error("Season not found");

        // Fetch teams
        const teams = await this.teamRepository.findByIds(teamIds);
        if (teams.length !== teamIds.length) {
            throw new Error("Some teams were not found");
        }
        
        // Ensure we have at least 2 teams for a game
        if (teams.length < 2) {
            throw new Error("A game must have at least 2 teams");
        }

        // Create new game
        const newGame = new Games();
        newGame.date = gameDate;
        newGame.season = season;
        newGame.teams = teams;

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
        if (!id) throw new Error("Game ID is required");

        const game = await this.gameRepository.findOne({
            where: { id },
            relations: ["season", "teams", "stats", "stats.player"],
        });

        if (!game) throw new Error("Game not found");

        return game;
    }

    /**
     * Update a game with validation
     */
    async updateGame(
        id: number, 
        date?: Date, 
        location?: string, 
        seasonId?: number, 
        teamIds?: number[]
    ): Promise<Games> {
        if (!id) throw new Error("Game ID is required");

        const game = await this.gameRepository.findOne({
            where: { id },
            relations: ["season", "teams", "stats"],
        });

        if (!game) throw new Error("Game not found");

        if (date) {
            const gameDate = new Date(date);
            
            // Validate date format
            if (isNaN(gameDate.getTime())) {
                throw new Error("Invalid date format");
            }
            
            game.date = gameDate;
        }

        if (seasonId) {
            const season = await this.seasonRepository.findOneBy({ id: seasonId });
            if (!season) throw new Error("Season not found");
            game.season = season;
        }

        if (teamIds && teamIds.length > 0) {
            // Ensure we have at least 2 teams for a game
            if (teamIds.length < 2) {
                throw new Error("A game must have at least 2 teams");
            }
            
            const teams = await this.teamRepository.findByIds(teamIds);
            if (teams.length !== teamIds.length) {
                throw new Error("Some teams were not found");
            }
            
            game.teams = teams;
        }

        return this.gameRepository.save(game);
    }

    /**
     * Delete a game with validation
     */
    async deleteGame(id: number): Promise<void> {
        if (!id) throw new Error("Game ID is required");

        const game = await this.gameRepository.findOne({
            where: { id },
            relations: ["stats"],
        });

        if (!game) throw new Error("Game not found");

        // Check if game has stats
        if (game.stats && game.stats.length > 0) {
            throw new Error("Cannot delete game with recorded stats");
        }

        await this.gameRepository.remove(game);
    }

    /**
     * Get games by season ID with validation
     */
    async getGamesBySeasonId(seasonId: number): Promise<Games[]> {
        if (!seasonId) throw new Error("Season ID is required");

        // Check if season exists
        const season = await this.seasonRepository.findOneBy({ id: seasonId });
        if (!season) throw new Error("Season not found");

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
        if (!teamId) throw new Error("Team ID is required");

        // Check if team exists
        const team = await this.teamRepository.findOne({
            where: { id: teamId },
            relations: ["games"],
        });
        
        if (!team) throw new Error("Team not found");

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