import { Request, Response } from 'express';
import { GameService, GameFilters } from './game.service.js';
import { ChallongeImportService } from './challongeImport.service.js';
import { GameStatus, GamePhase, GameBracket } from './game.entity.js';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { DuplicateError } from '../../errors/DuplicateError.js';
import { DateError } from '../../errors/DateErrors.js';
import { InvalidFormatError } from '../../errors/InvalidFormatError.js';
import { parsePagination, parseSort, toPaginatedResult } from '../../utils/pagination.js';
import { parseRegionQuery } from '../../utils/regionQuery.js';
import { RegionService } from '../regions/region.service.js';
import { GAME_SORT_FIELDS, GAME_DEFAULT_SORT } from './game.service.js';

const GAMES_DEFAULT_LIMIT = 10;

export class GameController {
    private gameService: GameService;
    private challongeImportService: ChallongeImportService;
    private regionService: RegionService;

    constructor() {
        this.gameService = new GameService();
        this.challongeImportService = new ChallongeImportService();
        this.regionService = new RegionService();
    }

    // Create a new game
    createGame = async (req: Request, res: Response): Promise<void> => {
        try {
            // Destructure the required fields from the request body
            const { date, seasonId, teamIds, team1Score, team2Score, stage, videoUrl, status, phase, bracket, setScores, tags, name } = req.body;

            // Validate the required fields
            if (!date || !seasonId || !stage|| !teamIds || teamIds.length !== 2) {
                console.error("Invalid input fields:", { date, seasonId, teamIds });
                res.status(400).json({
                    error: "Missing or invalid fields: date, seasonId, stage, and exactly two team IDs are required."
                });
                return;
            }

            // Validate scores are non-negative
            if (team1Score != null && team1Score < 0 || team2Score != null && team2Score < 0) {
                console.error("Invalid scores:", { team1Score, team2Score });
                res.status(400).json({
                    error: "Scores cannot be negative."
                });
                return;
            }

            // Log the creation parameters
            console.log("Creating game with parameters:", { date, seasonId, teamIds, team1Score, team2Score, stage, videoUrl });

            // Call the service method to create the game
            const savedGame = await this.gameService.createGame(
                date, seasonId, teamIds, team1Score ?? null, team2Score ?? null, stage, videoUrl,
                {
                    status: status as GameStatus | undefined,
                    phase: phase as GamePhase | undefined,
                    bracket: bracket as GameBracket | null | undefined,
                    setScores,
                    tags,
                    name,
                }
            );

            // Log the successful response
            console.log("Game successfully created:", savedGame);

            // Respond with the saved game data
            res.status(201).json(savedGame);
        } catch (error: any) {
            // Log the error details for debugging
            console.error("Error occurred during game creation:", error);

            // Handle custom errors
            if (error instanceof MissingFieldError ||
                error instanceof NotFoundError ||
                error instanceof InvalidFormatError ||
                error instanceof DateError ||
                error instanceof ConflictError ||
                error instanceof DuplicateError) {
                console.error("Custom error details:", error);
                res.status(400).json({ error: error.message });
                return; // Exit the function early
            }

            // Log full stack trace for debugging
            console.error("Unexpected error details:", error.stack || error);
            res.status(500).json({ error: `Failed to create game. Error: ${error.message}` });
        }
    };


    // Create a game by team names
    createGameByNames = async (req: Request, res: Response): Promise<void> => {
        try {
            // Extract the relevant fields from the request body
            const { date, seasonId, teamNames, team1Score, team2Score, stage, videoUrl, status, phase, bracket, setScores, tags, name } = req.body;

            // Validate the required fields
            if (!date || !seasonId || !teamNames || !stage || teamNames.length !== 2) {
                console.error("Invalid input fields:", { date, seasonId, teamNames, team1Score, team2Score });
                res.status(400).json({ 
                    error: "Missing or invalid fields: date, seasonId, stage, and exactly two team names are required." 
                });
                return; 
            }

            // Validate scores are non-negative
            if (team1Score != null && team1Score < 0 || team2Score != null && team2Score < 0) {
                console.error("Invalid scores:", { team1Score, team2Score });
                res.status(400).json({
                    error: "Scores cannot be negative."
                });
                return;
            }

            // Log parameters before calling service
            console.log("Creating game with parameters:", { date, seasonId, teamNames, team1Score, team2Score, stage, videoUrl });

            // Call the service method to create the game
            const savedGame = await this.gameService.createGameByNames(
                date, seasonId, teamNames, team1Score ?? null, team2Score ?? null, stage, videoUrl,
                {
                    status: status as GameStatus | undefined,
                    phase: phase as GamePhase | undefined,
                    bracket: bracket as GameBracket | null | undefined,
                    setScores,
                    tags,
                    name,
                }
            );

            // Log the successful response
            console.log("Game successfully created:", savedGame);

            // Respond with the saved game data
            res.status(201).json(savedGame);
        } catch (error: any) {
            // Log the error details with stack trace for unexpected errors
            console.error("Error occurred during game creation:", error);

            // Handle custom errors
            if (error instanceof MissingFieldError || 
                error instanceof NotFoundError || 
                error instanceof InvalidFormatError || 
                error instanceof DateError || 
                error instanceof ConflictError || 
                error instanceof DuplicateError) {
                console.error("Custom error details:", error);
                res.status(400).json({ error: error.message });
                return; // Exit the function early
            }

            // Log full stack trace for debugging
            console.error("Unexpected error details:", error.stack || error);
            res.status(500).json({ error: `Failed to create game. Error: ${error.message}` });
        }
    };



    // Create multiple games (batch method)
    createMultipleGames = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gamesData } = req.body;  // Expect an array of game data
            const savedGames = await this.gameService.createMultipleGames(gamesData);
            res.status(201).json(savedGames);
        } catch (error: any) {
            if (error instanceof MissingFieldError || 
                error instanceof NotFoundError || 
                error instanceof InvalidFormatError || 
                error instanceof DateError || 
                error instanceof ConflictError || 
                error instanceof DuplicateError) {
                console.error("Custom error creating multiple games:", error);
                res.status(400).json({ error: error.message });
            } else {
                console.error("Unexpected error creating multiple games:", error);
                res.status(500).json({ error: "Failed to create multiple games" });
            }
        }
    };

    // Get all games
    getGames = async (req: Request, res: Response): Promise<void> => {
        try {
            const pagination = parsePagination(req.query, GAMES_DEFAULT_LIMIT);
            const sort = parseSort(req.query, GAME_SORT_FIELDS, GAME_DEFAULT_SORT);
            const filters = await this.parseFilters(req);
            const [data, total] = await this.gameService.getAllGames(pagination, filters, sort);
            res.json(toPaginatedResult(data, total, pagination));
        } catch (error: any) {
            if (error !instanceof MissingFieldError || 
                error instanceof NotFoundError || 
                error instanceof InvalidFormatError || 
                error instanceof DateError || 
                error instanceof ConflictError || 
                error instanceof DuplicateError) {
                console.error("Custom error fetching games:", error);
                res.status(400).json({ error: error.message });
            } 
            else 
            {
                console.error("Unexpected error fetching games:", error);
                res.status(500).json({ error: "Failed to fetch games" });
            }
        }
    };

    // Get all games without relations / minimal data
    getSkinnyGames = async (req: Request, res: Response): Promise<void> => {
        try {
            const pagination = parsePagination(req.query, GAMES_DEFAULT_LIMIT);
            const sort = parseSort(req.query, GAME_SORT_FIELDS, GAME_DEFAULT_SORT);
            const filters = await this.parseFilters(req);
            const [data, total] = await this.gameService.getSkinnyAllGames(pagination, filters, sort);
            res.json(toPaginatedResult(data, total, pagination));
        } catch (error: any) {
            if (error !instanceof MissingFieldError || 
                error instanceof NotFoundError || 
                error instanceof InvalidFormatError || 
                error instanceof DateError || 
                error instanceof ConflictError || 
                error instanceof DuplicateError) {
                console.error("Custom error fetching games without relations:", error);
                res.status(400).json({ error: error.message });
            } 
            else 
            {
                console.error("Unexpected error fetching games without relations:", error);
                res.status(500).json({ error: "Failed to fetch games without relations" });
            }
        }
    };

    // Get game by ID
    getGameById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const game = await this.gameService.getGameById(parseInt(id));
            res.json(game);
        } catch (error: any) {
            if (error instanceof MissingFieldError || 
                error instanceof NotFoundError || 
                error instanceof InvalidFormatError || 
                error instanceof DateError || 
                error instanceof ConflictError || 
                error instanceof DuplicateError) {
                console.error("Custom error fetching game by ID:", error);
                res.status(400).json({ error: error.message });
            } else {
                console.error("Unexpected error fetching game by ID:", error);
                res.status(500).json({ error: "Failed to fetch game" });
            }
        }
    };

    // Update a game
    updateGame = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { date, seasonId, teamIds, team1Score, team2Score, videoUrl, stage, status, phase, bracket, region, setScores, tags, name } = req.body;
            const updatedGame = await this.gameService.updateGame(
                parseInt(id), date, seasonId, teamIds, team1Score, team2Score, stage, videoUrl,
                {
                    status: status as GameStatus | undefined,
                    phase: phase as GamePhase | undefined,
                    bracket: bracket as GameBracket | null | undefined,
                    setScores,
                    tags,
                    name,
                }
            );
            res.json(updatedGame);
        } catch (error: any) {
            if (error instanceof MissingFieldError || 
                error instanceof NotFoundError || 
                error instanceof InvalidFormatError || 
                error instanceof DateError || 
                error instanceof ConflictError || 
                error instanceof DuplicateError) {
                console.error("Custom error updating game:", error);
                res.status(400).json({ error: error.message });
            } else {
                console.error("Unexpected error updating game:", error);
                res.status(500).json({ error: "Failed to update game" });
            }
        }
    };

    // Delete a game
    deleteGame = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            await this.gameService.deleteGame(parseInt(id));
            res.status(204).send();
        } catch (error: any) {
            if (error instanceof MissingFieldError || 
                error instanceof NotFoundError || 
                error instanceof InvalidFormatError || 
                error instanceof DateError || 
                error instanceof ConflictError || 
                error instanceof DuplicateError) {
                console.error("Custom error deleting game:", error);
                res.status(400).json({ error: error.message });
            } else {
                console.error("Unexpected error deleting game:", error);
                res.status(500).json({ error: "Failed to delete game" });
            }
        }
    };

    // Get games by season ID
    getGamesBySeasonId = async (req: Request, res: Response): Promise<void> => {
        try {
            const { seasonId } = req.params;
            const games = await this.gameService.getGamesBySeasonId(parseInt(seasonId));

            if (games.length === 0) {
                res.status(404).json({ message: "No games found for the specified season" });
                return;
            }

            res.json(games);
        } catch (error: any) {
            if (error instanceof MissingFieldError || 
                error instanceof NotFoundError || 
                error instanceof InvalidFormatError || 
                error instanceof DateError || 
                error instanceof ConflictError || 
                error instanceof DuplicateError) {
                console.error("Custom error fetching games by season:", error);
                res.status(400).json({ error: error.message });
            } else {
                console.error("Unexpected error fetching games by season:", error);
                res.status(500).json({ error: "Failed to fetch games by season" });
            }
        }
    };

    // Get games by team ID
    getGamesByTeamId = async (req: Request, res: Response): Promise<void> => {
        try {
            const { teamId } = req.params;
            const games = await this.gameService.getGamesByTeamId(parseInt(teamId));

            if (games.length === 0) {
                res.status(404).json({ message: "No games found for the specified team" });
                return;
            }

            res.json(games);
        } catch (error: any) {
            if (error instanceof MissingFieldError || 
                error instanceof NotFoundError || 
                error instanceof InvalidFormatError || 
                error instanceof DateError || 
                error instanceof ConflictError || 
                error instanceof DuplicateError) {
                console.error("Custom error fetching games by team:", error);
                res.status(400).json({ error: error.message });
            } else {
                console.error("Unexpected error fetching games by team:", error);
                res.status(500).json({ error: "Failed to fetch games by team" });
            }
        }
    };

    // Get the distinct stage labels currently in use (for filter dropdowns)
    getDistinctStages = async (req: Request, res: Response): Promise<void> => {
        try {
            const { seasonId } = req.query;
            const regionFilter = parseRegionQuery(req.query as Record<string, unknown>);
            const regionId = await this.regionService.resolveRegionId(regionFilter);
            const stages = await this.gameService.getDistinctStages({
                seasonId: seasonId ? Number(seasonId) : undefined,
                regionId,
            });
            res.json(stages);
        } catch (error: any) {
            console.error("Unexpected error fetching distinct game stages:", error);
            res.status(500).json({ error: "Failed to fetch game stages" });
        }
    };

    private async parseFilters(req: Request): Promise<GameFilters> {
        const { search, seasonId, stage, status, phase, bracket } = req.query;
        const regionFilter = parseRegionQuery(req.query as Record<string, unknown>);
        const regionId = await this.regionService.resolveRegionId(regionFilter);
        return {
            search: typeof search === 'string' && search.length > 0 ? search : undefined,
            seasonId: seasonId ? Number(seasonId) : undefined,
            stage: typeof stage === 'string' && stage.length > 0 ? stage : undefined,
            status: typeof status === 'string' && status.length > 0 ? status : undefined,
            phase: typeof phase === 'string' && phase.length > 0 ? phase : undefined,
            regionId,
            bracket: typeof bracket === 'string' && bracket.length > 0 ? bracket : undefined,
        };
    }

    importFromChallonge = async (req: Request, res: Response): Promise<void> => {
        try {
            const dryRun = req.query.dryRun === 'true' || req.body.dryRun === true;
            const result = await this.challongeImportService.importFromChallonge(req.body, dryRun);

            if (!result.success) {
                res.status(422).json(result);
                return;
            }

            res.status(200).json(result);
        } catch (error: any) {
            console.error('Challonge import error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to import from Challonge',
                summary: { created: 0, updated: 0, skipped: 0, failed: 1 },
            });
        }
    };

    // Get score for a game by ID
    getGameScoreById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const score = await this.gameService.getScoreByGameId(parseInt(id));
            res.json(score);
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                console.error("Game not found for score:", error);
                res.status(404).json({ error: "Game not found" });
            } else {
                console.error("Unexpected error fetching score:", error);
                res.status(500).json({ error: "Failed to fetch score" });
            }
        }
    };
}
