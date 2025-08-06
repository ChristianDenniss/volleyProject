import { Request, Response } from 'express';
import { TeamService } from './team.service.js';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { CreateTeamDto, UpdateTeamDto } from './teams.schema.js';

export class TeamController {
    private teamService: TeamService;

    constructor() {
        this.teamService = new TeamService();
    }

    // Create a new Team
    createTeam = async (req: Request, res: Response): Promise<void> => {
        try {
            const teamData: CreateTeamDto = req.body;
            const savedTeam = await this.teamService.createTeam(teamData);
            res.status(201).json(savedTeam);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to create team";
            if (errorMessage.includes("required") || errorMessage.includes("not found")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error creating team:", error);
                res.status(500).json({ error: "Failed to create team" });
            }
        }
    };

    createMultipleTeams = async (req: Request, res: Response): Promise<void> => 
        {
            try
            {
                // Grab array of team creation data from request body
                const teamsData = req.body;
        
                // Call the service method to create teams
                const savedTeams = await this.teamService.createMultipleTeams(teamsData);
        
                // Respond with created team objects
                res.status(201).json(savedTeams);
            }
            catch (error)
            {
                // Extract message safely
                const errorMessage = error instanceof Error ? error.message : "Failed to create teams";
        
                // Handle known validation errors
                if (errorMessage.includes("required") || errorMessage.includes("not found") || errorMessage.includes("Duplicate"))
                {
                    res.status(400).json({ error: errorMessage });
                }
                else
                {
                    // Log and return generic server error
                    console.error("Error creating teams:", error);
                    res.status(500).json({ error: "Failed to create teams" });
                }
            }
        };
        
    
    // TeamController
    getTeamPlayersByName = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name } = req.params;  // Get team name from params
            const team = await this.teamService.getTeamPlayersByName(name); // Call service method to fetch players by name

            if (!team) {
                res.status(404).json({ error: "Team not found" });
                return;
            }

            res.json(team.players);  // Return players associated with the team
        } catch (error) {
            console.error("Error fetching team players by name:", error);
            res.status(500).json({ error: "Failed to fetch players for team" });
        }
    };


    // Get players of a specific team
    getTeamPlayers = async (req: Request, res: Response): Promise<void> => {
        try {
            const { teamId } = req.params; // Get team ID from request parameters
            const players = await this.teamService.getTeamPlayers(parseInt(teamId)); // Call service method
            
            if (players.length === 0) {
                res.status(404).json({ message: `No players found for team with ID ${teamId}` });
                return;
            }

            res.json(players); // Return the players of the team
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch team players";
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error fetching team players:", error);
                res.status(500).json({ error: "Failed to fetch team players" });
            }
        }
    };


    // Get all Teams
    getTeams = async (req: Request, res: Response): Promise<void> => {
        try {
            const teams = await this.teamService.getAllTeams();
            res.json(teams);
        } catch (error) {
            console.error("Error fetching teams:", error);
            res.status(500).json({ error: "Failed to fetch teams" });
        }
    };

    // Get all Teams without relations / minimal data
    getSkinnyTeams = async (req: Request, res: Response): Promise<void> => {
        try {
            const teams = await this.teamService.getSkinnyAllTeams();
            res.json(teams);
        } catch (error) {
            console.error("Error fetching teams with skinny relations:", error);
            res.status(500).json({ error: "Failed to fetch skinny teams" });
        }
    };

    // Get all Teams without relations / minimal data (players, season)
    getMediumTeams = async (req: Request, res: Response): Promise<void> => {
        try {
            const teams = await this.teamService.getMediumAllTeams();
            res.json(teams);
        } catch (error) {
            console.error("Error fetching teams with medium relations:", error);
            res.status(500).json({ error: "Failed to fetch medium teams" });
        }
    };

    // Get Team by ID
    getTeamById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const team = await this.teamService.getTeamById(parseInt(id));
            res.json(team);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch team";
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error fetching team by ID:", error);
                res.status(500).json({ error: "Failed to fetch team" });
            }
        }
    };

    // Update a Team by ID
    updateTeam = async (req: Request, res: Response): Promise<void> => {
        try {
            // Parse and validate route param
            const id = parseInt(req.params.id, 10);

            // Destructure placement alongside the other fields
            const { name, seasonNumber, placement, playerIds, gameIds, logoUrl } = req.body;

            // Call service with a single data object
            const updatedTeam = await this.teamService.updateTeam(
                id,
                { name, seasonNumber, placement, playerIds, gameIds, logoUrl }
            );

            // Return the updated team
            res.json(updatedTeam);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to update team";
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else if (errorMessage.includes("required")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error updating team:", error);
                res.status(500).json({ error: "Failed to update team" });
            }
        }
    };


    // Delete a Team by ID
    deleteTeam = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            await this.teamService.deleteTeam(parseInt(id));
            res.status(204).send();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to delete team";
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error deleting team:", error);
                res.status(500).json({ error: "Failed to delete team" });
            }
        }
    };

    async getTeamsByName(req: Request, res: Response): Promise<void> {
        try {
            const { name } = req.params;
        
            if (!name) {
                throw new MissingFieldError("Team name is required");
            }
        
            const teams = await this.teamService.getTeamsByName(name);
            res.status(200).json(teams);
        } catch (error: unknown) {
            console.error('Error in getTeamsByName:', error);
            
            if (error instanceof Error) {
                if (error instanceof NotFoundError || error instanceof MissingFieldError) {
                    res.status(400).json({ message: error.message });
                } else {
                    res.status(500).json({ message: 'An unexpected error occurred', error: error.message });
                }
            } else {
                res.status(500).json({ message: 'An unexpected error occurred', error: JSON.stringify(error) });
            }
        }
    }    
         

    // Fetch teams by season ID
    getTeamsBySeasonId = async (req: Request, res: Response): Promise<void> => {
        try {
            const { seasonId } = req.params;
            const teams = await this.teamService.getTeamsBySeasonId(parseInt(seasonId));
            
            if (teams.length === 0) {
                res.status(404).json({ message: "No teams found for the specified season" });
                return;
            }
            
            res.json(teams);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch teams by season";
            if (errorMessage.includes("not found") || errorMessage.includes("required")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error fetching teams by season ID:", error);
                res.status(500).json({ error: "Failed to fetch teams by season" });
            }
        }
    };
}