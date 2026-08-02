import { Request, Response, NextFunction } from 'express';
import { GameService, GameFilters } from './game.service.js';
import { ChallongeImportService } from './challongeImport.service.js';
import { GameStatus, GamePhase, GameBracket } from './game.entity.js';
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

    createGame = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { date, seasonId, teamIds, team1Score, team2Score, stage, videoUrl, status, phase, bracket, setScores, tags, name } = req.body;

            if (!date || !seasonId || !stage|| !teamIds || teamIds.length !== 2) {
                console.error("Invalid input fields:", { date, seasonId, teamIds });
                res.status(400).json({
                    error: "Missing or invalid fields: date, seasonId, stage, and exactly two team IDs are required."
                });
                return;
            }

            if (team1Score != null && team1Score < 0 || team2Score != null && team2Score < 0) {
                console.error("Invalid scores:", { team1Score, team2Score });
                res.status(400).json({
                    error: "Scores cannot be negative."
                });
                return;
            }

            console.log("Creating game with parameters:", { date, seasonId, teamIds, team1Score, team2Score, stage, videoUrl });

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

            console.log("Game successfully created:", savedGame);
            res.status(201).json(savedGame);
        } catch (error) {
            next(error);
        }
    };

    createGameByNames = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { date, seasonId, teamNames, team1Score, team2Score, stage, videoUrl, status, phase, bracket, setScores, tags, name } = req.body;

            if (!date || !seasonId || !teamNames || !stage || teamNames.length !== 2) {
                console.error("Invalid input fields:", { date, seasonId, teamNames, team1Score, team2Score });
                res.status(400).json({
                    error: "Missing or invalid fields: date, seasonId, stage, and exactly two team names are required."
                });
                return;
            }

            if (team1Score != null && team1Score < 0 || team2Score != null && team2Score < 0) {
                console.error("Invalid scores:", { team1Score, team2Score });
                res.status(400).json({
                    error: "Scores cannot be negative."
                });
                return;
            }

            console.log("Creating game with parameters:", { date, seasonId, teamNames, team1Score, team2Score, stage, videoUrl });

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

            console.log("Game successfully created:", savedGame);
            res.status(201).json(savedGame);
        } catch (error) {
            next(error);
        }
    };

    createMultipleGames = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { gamesData } = req.body;
            const savedGames = await this.gameService.createMultipleGames(gamesData);
            res.status(201).json(savedGames);
        } catch (error) {
            next(error);
        }
    };

    getGames = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pagination = parsePagination(req.query, GAMES_DEFAULT_LIMIT);
            const sort = parseSort(req.query, GAME_SORT_FIELDS, GAME_DEFAULT_SORT);
            const filters = await this.parseFilters(req);
            const [data, total] = await this.gameService.getAllGames(pagination, filters, sort);
            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    getSkinnyGames = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pagination = parsePagination(req.query, GAMES_DEFAULT_LIMIT);
            const sort = parseSort(req.query, GAME_SORT_FIELDS, GAME_DEFAULT_SORT);
            const filters = await this.parseFilters(req);
            const [data, total] = await this.gameService.getSkinnyAllGames(pagination, filters, sort);
            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    getGameById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const game = await this.gameService.getGameById(parseInt(id));
            res.json(game);
        } catch (error) {
            next(error);
        }
    };

    updateGame = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
        } catch (error) {
            next(error);
        }
    };

    deleteGame = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            await this.gameService.deleteGame(parseInt(id));
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    getGamesBySeasonId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { seasonId } = req.params;
            const pagination = parsePagination(req.query, GAMES_DEFAULT_LIMIT);
            const [data, total] = await this.gameService.getGamesBySeasonId(parseInt(seasonId), pagination);

            if (data.length === 0) {
                res.status(404).json({ message: "No games found for the specified season" });
                return;
            }

            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    getGamesByTeamId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { teamId } = req.params;
            const pagination = parsePagination(req.query, GAMES_DEFAULT_LIMIT);
            const [data, total] = await this.gameService.getGamesByTeamId(parseInt(teamId), pagination);

            if (data.length === 0) {
                res.status(404).json({ message: "No games found for the specified team" });
                return;
            }

            res.json(toPaginatedResult(data, total, pagination));
        } catch (error) {
            next(error);
        }
    };

    getDistinctStages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { seasonId } = req.query;
            const regionFilter = parseRegionQuery(req.query as Record<string, unknown>);
            const regionId = await this.regionService.resolveRegionId(regionFilter);
            const stages = await this.gameService.getDistinctStages({
                seasonId: seasonId ? Number(seasonId) : undefined,
                regionId,
            });
            res.json(stages);
        } catch (error) {
            next(error);
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

    importFromChallonge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dryRun = req.query.dryRun === 'true' || req.body.dryRun === true;
            const result = await this.challongeImportService.importFromChallonge(req.body, dryRun);

            if (!result.success) {
                res.status(422).json(result);
                return;
            }

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    getGameScoreById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const score = await this.gameService.getScoreByGameId(parseInt(id));
            res.json(score);
        } catch (error) {
            next(error);
        }
    };
}
