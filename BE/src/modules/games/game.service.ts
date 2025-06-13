import { Not, Repository, In } from 'typeorm';
import { AppDataSource } from '../../db/data-source.ts';
import { Games } from './game.entity.ts';
import { Teams } from '../teams/team.entity.ts';
import { Seasons } from '../seasons/season.entity.ts';
import { MissingFieldError } from '../../errors/MissingFieldError.ts';
import { NotFoundError } from '../../errors/NotFoundError.ts';
import { ConflictError } from '../../errors/ConflictError.ts';
import { DuplicateError } from '../../errors/DuplicateError.ts';
import { InvalidFormatError } from '../../errors/InvalidFormatError.ts';

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
        team1Score: number,  // Added team1Score
        team2Score: number,   // Added team2Score
        stage: string,
        videoUrl?: string

    ): Promise<Games> {
        try {
            // Validation
            if (!seasonId) throw new MissingFieldError("Season ID");
            if (!stage) throw new MissingFieldError("Game Stage/Round");
            if (!teamIds || !teamIds.length) throw new MissingFieldError("Team IDs");
            if (team1Score < 0 || team2Score < 0) throw new InvalidFormatError("Scores cannot be negative");

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

            // Log the creation step
            console.log("Creating new game with teams:", teams.map(team => team.name));

            // Create new game
            const newGame = new Games();
            newGame.date = date; // No date validation
            newGame.season = season;
            newGame.teams = teams;
            newGame.team1Score = team1Score;  // Set team1Score
            newGame.team2Score = team2Score;  // Set team2Score
            newGame.videoUrl = videoUrl ?? '';
            newGame.stage = stage;

            return this.gameRepository.save(newGame);
        } catch (error) {
            // Log error details for debugging
            console.error("Error creating game:", error);
            throw error; // Rethrow the error to be handled at the controller level
        }
    }

     /**
     * Create multiple games with validation and transaction handling
     */
    async createMultipleGames(gamesData: { date: Date, seasonId: number, teamIds: number[], videoUrl?: string, stage: string }[]): Promise<Games[]> {
        // Validation for missing game data
        gamesData.forEach(gameData => {
            if (!gameData.date) throw new MissingFieldError("Game date");
            if (!gameData.stage) throw new MissingFieldError("Game Stage/Round");
            if (!gameData.seasonId) throw new MissingFieldError("Season ID");
            if (!gameData.teamIds || gameData.teamIds.length !== 2) throw new MissingFieldError("Exactly 2 teams are required for each game");
        });

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.startTransaction();

        try {
            // Fetch all the seasons
            const seasonIds = gamesData.map(game => game.seasonId);
            const seasons = await this.seasonRepository.findBy({ id: In(seasonIds) });

            // Fetch all the teams
            const teamIds = gamesData.flatMap(game => game.teamIds);
            const teams = await this.teamRepository.findBy({ id: In(teamIds) });

            // Create the games
            const newGames = await Promise.all(gamesData.map(async (data) => {
                const season = seasons.find(season => season.id === data.seasonId);
                if (!season) throw new NotFoundError(`Season with ID ${data.seasonId} not found`);

                // Find the teams by their IDs
                const teamsInGame = teams.filter(team => data.teamIds.includes(team.id));
                if (teamsInGame.length !== 2) {
                    throw new NotFoundError(`Both teams with IDs ${data.teamIds} must be valid`);
                }

                // Check if the game already exists with the same teams and season
                const existingGame = await this.gameRepository.findOne({
                    where: {
                        season: { id: data.seasonId },
                        teams: { id: In(data.teamIds) },
                    }
                });
                if (existingGame) {
                    throw new DuplicateError(`A game between these teams already exists for the season on ${data.date}`);
                }

                const newGame = new Games();
                newGame.date = data.date;
                newGame.season = season;
                newGame.teams = teamsInGame;
                newGame.videoUrl = data.videoUrl ?? '';
                newGame.stage = data.stage;

                return newGame;
            }));

            // Save all new games at once
            await queryRunner.manager.save(newGames);
            await queryRunner.commitTransaction();

            return newGames;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
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

    async createGameByNames(
        date: Date, 
        seasonId: number, 
        teamNames: string[], 
        team1Score: number,  // Added team1Score
        team2Score: number,   // Added team2Score
        stage: string,
        videoUrl?: string
    ): Promise<Games> {
        console.log("Received createGameByNames parameters:", { date, seasonId, teamNames, team1Score, team2Score, videoUrl, stage });
    
        try {
            // Validate that scores are not negative
            if (team1Score < 0 || team2Score < 0) {
                throw new InvalidFormatError("Scores cannot be negative.");
            }
    
            // Fetch teams by names
            const teams = await this.teamRepository.findBy({ name: In(teamNames) });
            console.log("Teams fetched from the database:", teams);
    
            // Ensure we have exactly two teams
            if (teams.length !== 2) {
                const missingTeams = teamNames.filter(name => !teams.some(team => team.name === name));
                console.error("Missing teams:", missingTeams);
                throw new NotFoundError(`Teams with names ${missingTeams.join(', ')} not found`);
            }
    
            // Fetch the season by ID
            const season = await this.seasonRepository.findOneBy({ id: seasonId });
            if (!season) {
                throw new NotFoundError(`Season with ID ${seasonId} not found`);
            }
    
            // Call the original createGame method with team IDs and the provided scores
            const teamIds = teams.map(team => team.id);
            console.log("Creating game with team IDs:", teamIds);
            return this.createGame(date, seasonId, teamIds, team1Score, team2Score, stage, videoUrl); // Pass the scores to createGame
        } catch (error) {
            console.error("Error occurred in createGameByNames service:", error);
            throw error; // Re-throw the error to be handled by the controller
        }
    }
    
    
    /**
     * Get game by ID with validation
     */
    async getGameById(id: number): Promise<Games> {
        if (!id) throw new MissingFieldError("Game ID");
    
        const game = await this.gameRepository.findOne({
            where: { id },
            relations: [
                "season",
                "teams",
                "teams.players",  // ← remove the []
                "stats",
                "stats.player"
            ],
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
        team2Score?: number,
        stage?: string,
        videoUrl?: string
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

        if (videoUrl) {
            game.videoUrl = videoUrl;   
        }

        if (stage) {
            game.stage = stage;   
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

        // Fetch full game data with relations using TypeORM's In()
        return this.gameRepository.find({
            where: { id: In(gameIds) },
            relations: ["season", "teams", "stats"],
            order: { date: "DESC" }
        });
    }

}
