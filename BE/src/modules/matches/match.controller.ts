import { Request, Response } from 'express';
import { MatchService } from './match.service.js';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { CreateMatchInput, UpdateMatchInput, ImportChallongeInput } from './matches.schema.js';

export class MatchController {
    private matchService: MatchService;

    constructor() {
        this.matchService = new MatchService();
    }

    // Get all matches
    getAllMatches = async (req: Request, res: Response): Promise<void> => {
        try {
            const matches = await this.matchService.getAllMatches();
            res.json(matches);
        } catch (error) {
            console.error("Error fetching matches:", error);
            res.status(500).json({ error: "Failed to fetch matches" });
        }
    };

    // Get matches by season
    getMatchesBySeason = async (req: Request, res: Response): Promise<void> => {
        try {
            const { seasonId } = req.params;
            if (!seasonId) {
                throw new MissingFieldError("Season ID is required");
            }

            const matches = await this.matchService.getMatchesBySeason(parseInt(seasonId));
            res.json(matches);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch matches for season";
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error fetching matches by season:", error);
                res.status(500).json({ error: "Failed to fetch matches for season" });
            }
        }
    };

    // Get matches by round
    getMatchesByRound = async (req: Request, res: Response): Promise<void> => {
        try {
            const { seasonId, round } = req.params;
            if (!seasonId || !round) {
                throw new MissingFieldError("Season ID and round are required");
            }

            const matches = await this.matchService.getMatchesByRound(parseInt(seasonId), round);
            res.json(matches);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch matches for round";
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error fetching matches by round:", error);
                res.status(500).json({ error: "Failed to fetch matches for round" });
            }
        }
    };

    // Get match by ID
    getMatchById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new MissingFieldError("Match ID is required");
            }

            const match = await this.matchService.getMatchById(parseInt(id));
            
            if (!match) {
                throw new NotFoundError("Match not found");
            }
            
            res.json(match);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch match";
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error fetching match by ID:", error);
                res.status(500).json({ error: "Failed to fetch match" });
            }
        }
    };

    // Create a new match
    createMatch = async (req: Request, res: Response): Promise<void> => {
        try {
            const matchData: CreateMatchInput = req.body;
            const savedMatch = await this.matchService.createMatch(matchData);
            res.status(201).json(savedMatch);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to create match";
            if (errorMessage.includes("required") || errorMessage.includes("not found")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error creating match:", error);
                res.status(500).json({ error: "Failed to create match" });
            }
        }
    };

    // Update match
    updateMatch = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new MissingFieldError("Match ID is required");
            }

            const matchData: UpdateMatchInput = req.body;
            const updatedMatch = await this.matchService.updateMatch(parseInt(id), matchData);
            
            if (!updatedMatch) {
                throw new NotFoundError("Match not found");
            }

            res.json(updatedMatch);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to update match";
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else if (errorMessage.includes("required")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error updating match:", error);
                res.status(500).json({ error: "Failed to update match" });
            }
        }
    };

    // Delete match
    deleteMatch = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new MissingFieldError("Match ID is required");
            }

            const result = await this.matchService.deleteMatch(parseInt(id));
            
            if (!result) {
                throw new NotFoundError("Match not found");
            }

            res.json({ success: true, message: "Match deleted successfully" });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to delete match";
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error deleting match:", error);
                res.status(500).json({ error: "Failed to delete match" });
            }
        }
    };

    // Import from Challonge
    importFromChallonge = async (req: Request, res: Response): Promise<void> => {
        try {
            const importData: ImportChallongeInput = req.body;
            const matches = await this.matchService.importFromChallonge(importData);
            
            res.status(201).json({
                message: `Successfully imported ${matches.length} matches from Challonge`,
                matches
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to import from Challonge";
            if (errorMessage.includes("required") || errorMessage.includes("not found") || errorMessage.includes("Invalid")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error importing from Challonge:", error);
                res.status(500).json({ error: "Failed to import from Challonge" });
            }
        }
    };
} 