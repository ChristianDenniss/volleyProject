import { Repository, In, ILike, FindOptionsWhere, FindOptionsOrder } from 'typeorm';
import { AppDataSource } from '../../db/data-source.js';
import { Games, GameStatus, GamePhase, GameBracket } from './game.entity.js';
import { Teams } from '../teams/team.entity.js';
import { Seasons } from '../seasons/season.entity.js';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { DuplicateError } from '../../errors/DuplicateError.js';
import { InvalidFormatError } from '../../errors/InvalidFormatError.js';
import { PaginationParams, SortParams } from '../../utils/pagination.js';
import { orderTeamsByIds, applyWinnerToGame } from './gameWinner.js';
import { resolveGameBracket } from './gameBracket.js';

export interface GameFilters {
    search?: string;
    seasonId?: number;
    stage?: string;
    status?: string;
    phase?: string;
    regionId?: number;
    bracket?: string;
}

export const GAME_SORT_FIELDS = ['date', 'name', 'stage', 'team1Score', 'team2Score'] as const;
export type GameSortField = typeof GAME_SORT_FIELDS[number];
export const GAME_DEFAULT_SORT: GameSortField = 'date';

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
        team1Score: number | null,
        team2Score: number | null,
        stage: string,
        videoUrl?: string,
        options?: {
            status?: GameStatus;
            phase?: GamePhase;
            bracket?: GameBracket | null;
            region?: never;
            setScores?: string[];
            tags?: string[];
            name?: string;
        }
    ): Promise<Games> {
        try {
            if (!seasonId) throw new MissingFieldError("Season ID");
            if (!stage) throw new MissingFieldError("Game Stage/Round");
            if (!teamIds || !teamIds.length) throw new MissingFieldError("Team IDs");
            if ((team1Score ?? 0) < 0 || (team2Score ?? 0) < 0) throw new InvalidFormatError("Scores cannot be negative");

            // Fetch the season
            const season = await this.seasonRepository.findOneBy({ id: seasonId });
            if (!season) throw new NotFoundError(`Season with ID ${seasonId} not found`);

            // Fetch teams in request order so scores map to team1/team2 consistently
            const fetchedTeams = await this.teamRepository.findBy({ id: In(teamIds) });
            if (fetchedTeams.length !== teamIds.length) {
                const missingTeams = teamIds.filter(id => !fetchedTeams.some(team => team.id === id));
                throw new NotFoundError(`Teams with IDs ${missingTeams.join(', ')} not found`);
            }

            const teams = orderTeamsByIds(teamIds, fetchedTeams);
            
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
            newGame.team1Score = team1Score;
            newGame.team2Score = team2Score;
            newGame.videoUrl = videoUrl ?? '';
            newGame.stage = stage;
            newGame.status = options?.status ?? (team1Score != null && team2Score != null ? GameStatus.COMPLETED : GameStatus.SCHEDULED);
            newGame.phase = options?.phase ?? GamePhase.QUALIFIERS;
            newGame.regionId = season.regionId;
            newGame.bracket = resolveGameBracket({
                stage,
                phase: newGame.phase,
                explicitBracket: options?.bracket,
            });
            newGame.tags = options?.tags ?? null;
            newGame.name = options?.name ?? null;

            const setScores = options?.setScores ?? [];
            newGame.set1Score = setScores[0] ?? null;
            newGame.set2Score = setScores[1] ?? null;
            newGame.set3Score = setScores[2] ?? null;
            newGame.set4Score = setScores[3] ?? null;
            newGame.set5Score = setScores[4] ?? null;
            applyWinnerToGame(newGame);

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

                const teamsInGame = orderTeamsByIds(
                    data.teamIds,
                    teams.filter(team => data.teamIds.includes(team.id))
                );
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
                newGame.regionId = season.regionId;

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

    private buildWhere(filters: GameFilters): FindOptionsWhere<Games> {
        const where: FindOptionsWhere<Games> = {};
        if (filters.search) where.name = ILike(`%${filters.search}%`);
        if (filters.seasonId) where.season = { id: filters.seasonId } as any;
        if (filters.stage) where.stage = filters.stage;
        if (filters.status) where.status = filters.status as GameStatus;
        if (filters.phase) where.phase = filters.phase as GamePhase;
        if (filters.regionId) where.regionId = filters.regionId;
        if (filters.bracket) where.bracket = filters.bracket as GameBracket;
        return where;
    }

    private buildOrder(sort?: SortParams<GameSortField>): FindOptionsOrder<Games> {
        const sortBy = sort?.sortBy ?? GAME_DEFAULT_SORT;
        const sortDir = sort?.sortDir ?? 'DESC';
        return { [sortBy]: sortDir } as FindOptionsOrder<Games>;
    }

    /**
     * Get all games
     */
    async getAllGames(
        pagination: PaginationParams,
        filters: GameFilters = {},
        sort?: SortParams<GameSortField>
    ): Promise<[Games[], number]> {
        return this.gameRepository.findAndCount({
            where: this.buildWhere(filters),
            relations: ["season", "teams", "winner", "stats", "region"],
            order: this.buildOrder(sort), // Defaults to most recent games first
            skip: pagination.skip,
            take: pagination.take
        });
    }

    /**
     * Get all games without relations / minimal data
     */
    async getSkinnyAllGames(
        pagination: PaginationParams,
        filters: GameFilters = {},
        sort?: SortParams<GameSortField>
    ): Promise<[Games[], number]> {
        return this.gameRepository.findAndCount({
            where: this.buildWhere(filters),
            relations: ["season", "region", "teams"],
            order: this.buildOrder(sort), // Defaults to most recent games first
            skip: pagination.skip,
            take: pagination.take
        });
    }

    /**
     * Get the distinct stage labels currently in use, matching the given filters.
     * Backs the Games/GamesPage stage-filter dropdown without fetching a page of games.
     */
    async getDistinctStages(filters: Pick<GameFilters, 'seasonId' | 'regionId'> = {}): Promise<string[]> {
        const qb = this.gameRepository.createQueryBuilder('game')
            .select('DISTINCT game.stage', 'stage')
            .where('game.stage IS NOT NULL');

        if (filters.seasonId) qb.andWhere('game.seasonId = :seasonId', { seasonId: filters.seasonId });
        if (filters.regionId) qb.andWhere('game.regionId = :regionId', { regionId: filters.regionId });

        const rows = await qb.orderBy('game.stage', 'ASC').getRawMany<{ stage: string }>();
        return rows.map(row => row.stage);
    }


    async createGameByNames(
        date: Date, 
        seasonId: number, 
        teamNames: string[], 
        team1Score: number | null,
        team2Score: number | null,
        stage: string,
        videoUrl?: string,
        options?: {
            status?: GameStatus;
            phase?: GamePhase;
            bracket?: GameBracket | null;
            region?: never;
            setScores?: string[];
            tags?: string[];
            name?: string;
        }
    ): Promise<Games> {
        console.log("Received createGameByNames parameters:", { date, seasonId, teamNames, team1Score, team2Score, videoUrl, stage });
    
        try {
            // Validate that scores are not negative
            if ((team1Score ?? 0) < 0 || (team2Score ?? 0) < 0) {
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
    
            const teamIds = teamNames.map(teamName => {
                const team = teams.find(entry => entry.name === teamName);
                if (!team) {
                    throw new NotFoundError(`Team with name ${teamName} not found`);
                }

                return team.id;
            });
            console.log("Creating game with team IDs:", teamIds);
            return this.createGame(date, seasonId, teamIds, team1Score, team2Score, stage, videoUrl, {
                ...options,
                name: options?.name ?? `${teamNames[0]} vs ${teamNames[1]}`,
            });
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
            relations: ["season", "teams", "teams.players", "winner", "stats", "stats.player", "region"],
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
            relations: ["season", "teams", "winner", "stats", "region"],
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
        team1Score?: number | null, 
        team2Score?: number | null,
        stage?: string,
        videoUrl?: string,
        options?: {
            status?: GameStatus;
            phase?: GamePhase;
            bracket?: GameBracket | null;
            region?: never;
            setScores?: string[];
            tags?: string[];
            name?: string;
        }
    ): Promise<Games> {
        if (!id) throw new MissingFieldError("Game ID");

        const game = await this.gameRepository.findOne({
            where: { id },
            relations: ["season", "teams", "winner", "stats", "region"],
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
            game.regionId = season.regionId;
        }

        

        if (teamIds && teamIds.length > 0) {
            // Ensure we have at least 2 teams for a game
            if (teamIds.length < 2) {
                throw new MissingFieldError("At least two teams are required for a game");
            }
            
            const fetchedTeams = await this.teamRepository.findBy({ id: In(teamIds) });
            if (fetchedTeams.length !== teamIds.length) {
                const missingTeams = teamIds.filter(id => !fetchedTeams.some(team => team.id === id));
                throw new NotFoundError(`Teams with IDs ${missingTeams.join(', ')} not found`);
            }

            game.teams = orderTeamsByIds(teamIds, fetchedTeams);
        }

        if (team1Score !== undefined) {
            game.team1Score = team1Score;
        }
        
        if (team2Score !== undefined) {
            game.team2Score = team2Score;
        }

        applyWinnerToGame(game);

        if (videoUrl) {
            game.videoUrl = videoUrl;   
        }

        if (stage) {
            game.stage = stage;   
        }

        if (options?.status) game.status = options.status;
        if (options?.phase) game.phase = options.phase;
        if (options?.tags !== undefined) game.tags = options.tags;
        if (options?.name !== undefined) game.name = options.name;

        game.bracket = resolveGameBracket({
            stage: game.stage,
            phase: game.phase,
            explicitBracket: options?.bracket,
            challongeRound: game.challongeRound,
        });

        if (options?.setScores) {
            const setScores = options.setScores;
            game.set1Score = setScores[0] ?? null;
            game.set2Score = setScores[1] ?? null;
            game.set3Score = setScores[2] ?? null;
            game.set4Score = setScores[3] ?? null;
            game.set5Score = setScores[4] ?? null;
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
            relations: ["season", "teams", "winner", "stats", "region"],
            order: { date: "DESC" }
        });
    }

}
