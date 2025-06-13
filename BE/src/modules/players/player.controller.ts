import { Request, Response } from 'express';
import { MissingFieldError } from '../../errors/MissingFieldError.ts';
import { NotFoundError } from '../../errors/NotFoundError.ts';
import { PlayerService } from './player.service.ts';

export class PlayerController {
    private playerService: PlayerService;

    constructor() {
        this.playerService = new PlayerService();
    }

    // Create a new player
    createPlayer = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, position, teamId } = req.body;
            const savedPlayer = await this.playerService.createPlayer(
                name, 
                position, 
                teamId
            );
            
            res.status(201).json(savedPlayer);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to create player";
            
            if (errorMessage.includes("required") || 
                errorMessage.includes("not found") || 
                errorMessage.includes("already in use") ||
                errorMessage.includes("must be")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error creating player:", error);
                res.status(500).json({ error: "Failed to create player" });
            }
        }
    };

    // Create a new player using team name
    createPlayerByName = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, position, teamName } = req.body;

            const savedPlayer = await this.playerService.createPlayerByName(
                name,
                position,
                teamName
            );

            res.status(201).json(savedPlayer);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to create player";

            if (errorMessage.includes("required") || 
                errorMessage.includes("not found") || 
                errorMessage.includes("already exists")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error creating player:", error);
                res.status(500).json({ error: "Failed to create player" });
            }
        }
    };

    /**
     * Controller to handle the request to get teams by player name
     */
    getTeamsByPlayerName = async (req: Request, res: Response): Promise<void> =>
    {
        const { playerName } = req.params;
        console.log("Received request for playerName:", playerName); // 👈 Log incoming value

        try 
        {
            const teamNames = await this.playerService.getTeamsByPlayerName(playerName);
            console.log("Found team names:", teamNames); // 👈 Log what service returns

            res.status(200).json({
                success: true,
                playerName: playerName,
                teams: teamNames
            });
        } 
        catch (error) 
        {
            console.error("Error occurred:", error); // 👈 Log actual error

            if (error instanceof MissingFieldError) 
            {
                res.status(400).json({ success: false, message: error.message });
            } 
            else if (error instanceof NotFoundError) 
            {
                res.status(404).json({ success: false, message: error.message });
            } 
            else 
            {
                res.status(500).json({ success: false, message: "Internal Server Error" });
            }
        }
    }

     // Create multiple players at once
     createMultiplePlayers = async (req: Request, res: Response): Promise<void> => {
        try {
            const playersData = req.body;
            
            // Ensure the request body is an array
            if (!Array.isArray(playersData)) {
                res.status(400).json({ error: "Request body must be an array of player objects" });
                return;
            }

            // Create multiple players
            const createdPlayers = await this.playerService.createMultiplePlayers(playersData);
            res.status(201).json(createdPlayers);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to create multiple players";
            
            if (errorMessage.includes("required") || errorMessage.includes("not found")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error creating multiple players:", error);
                res.status(500).json({ error: "Failed to create multiple players" });
            }
        }
    };

    // Create multiple players at once using team name
    createMultiplePlayersByName = async (req: Request, res: Response): Promise<void> => {
        try {
            const playersData = req.body;

            // Log the incoming request data
            console.log('Request Body:', playersData);
            
            // Ensure the request body is an array
            if (!Array.isArray(playersData)) {
                console.log('Error: Request body is not an array');
                res.status(400).json({ error: "Request body must be an array of player objects" });
                return;
            }

            // Validate player structure (check for 'name' and 'teamNames' array)
            if (!playersData.every(player => player.name && Array.isArray(player.teamNames) && player.teamNames.length > 0)) {
                console.log('Error: Validation failed - Some players are missing "name" or "teamNames"');
                res.status(400).json({ error: "Each player must have a name and at least one team name in teamNames" });
                return;
            }

            console.log('All players have a valid structure, proceeding to creation...');

            // Create multiple players by name
            const createdPlayers = await this.playerService.createMultiplePlayersByName(playersData);

            console.log('Created players:', createdPlayers);

            // Respond with success and number of players created
            res.status(201).json({
                message: `${createdPlayers.length} players created successfully`,
                players: createdPlayers
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to create multiple players by name";

            console.error('Error occurred:', errorMessage);

            if (errorMessage.includes("required") || errorMessage.includes("not found") || errorMessage.includes("already exists")) {
                // Check if it's a duplicate error
                if (errorMessage.includes("already exists")) {
                    console.log('Conflict error: Duplicate player(s)');
                    res.status(409).json({ error: errorMessage }); // 409 Conflict for duplicates
                } else {
                    console.log('Bad request error: Validation error');
                    res.status(400).json({ error: errorMessage }); // 400 for other validation errors
                }
            } else {
                console.error("Error creating multiple players by name:", error);
                res.status(500).json({ error: "Failed to create multiple players by name" });
            }
        }
    };



    // Get all players
    getPlayers = async (req: Request, res: Response): Promise<void> => {
        try {
            const players = await this.playerService.getAllPlayers();
            res.json(players);
        } catch (error) {
            console.error("Error fetching players:", error);
            res.status(500).json({ error: "Failed to fetch players" });
        }
    };

    // Get player by ID
    getPlayerById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const player = await this.playerService.getPlayerById(parseInt(id));
            res.json(player);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch player";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error fetching player by ID:", error);
                res.status(500).json({ error: "Failed to fetch player" });
            }
        }
    };

    // Update a player
    updatePlayer = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const updatedPlayer = await this.playerService.updatePlayer(
                parseInt(id),
                updateData
            );
            res.json(updatedPlayer);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to update player";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else if (errorMessage.includes("required") || 
                      errorMessage.includes("already in use") ||
                      errorMessage.includes("must be")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error updating player:", error);
                res.status(500).json({ error: "Failed to update player" });
            }
        }
    };

    // Delete a player
    deletePlayer = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            await this.playerService.deletePlayer(parseInt(id));
            res.status(204).send();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to delete player";
            
            if (errorMessage.includes("not found")) {
                res.status(404).json({ error: errorMessage });
            } else {
                console.error("Error deleting player:", error);
                res.status(500).json({ error: "Failed to delete player" });
            }
        }
    };

    // Get players by team ID
    getPlayersByTeamId = async (req: Request, res: Response): Promise<void> => {
        try {
            const { teamId } = req.params;
            const players = await this.playerService.getPlayersByTeamId(parseInt(teamId));
            
            if (players.length === 0) {
                res.status(404).json({ message: "No players found for the specified team" });
                return;
            }
            
            res.json(players);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch players by team";
            
            if (errorMessage.includes("not found") || errorMessage.includes("required")) {
                res.status(400).json({ error: errorMessage });
            } else {
                console.error("Error fetching players by team ID:", error);
                res.status(500).json({ error: "Failed to fetch players by team" });
            }
        }
    };

    // Merge one player into another
    mergePlayers = async (req: Request, res: Response): Promise<void> =>
    {
        try
        {
            const { targetId, mergedId } = req.body;
            await this.playerService.mergePlayers(targetId, mergedId);
            res.sendStatus(204);
         }
        catch (error)
        {
            const msg = error instanceof Error ? error.message : 'Failed to merge players';
    
            if (error instanceof MissingFieldError) 
            {
                res.status(400).json({ error: msg });
            }
            else if (error instanceof NotFoundError) 
            {
                    res.status(404).json({ error: msg });
            }
            else 
            {
                    console.error('Error merging players:', error);
                    res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    };
    
}