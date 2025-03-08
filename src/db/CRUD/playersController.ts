import { Request, Response } from "express";
import { AppDataSource } from "../data-source"; // TypeORM DataSource
import { Players } from "../entities/Players";
import { Teams } from "../entities/Teams"; // We MUST teams to assign players to a team, no floating players
import { In } from 'typeorm'; // To use the In function for finding teams

// Create a new Player
export const createPlayer = async (req: Request, res: Response) => {
    try {
        const { name, position, teamId } = req.body;

        // Validate required fields
        if (!name || !position || !teamId) {
            return res.status(400).send("Name, position, and teamId are required");
        }

        // Get the team by its ID
        const teamsRepository = AppDataSource.getRepository(Teams);
        const team = await teamsRepository.findOneBy({ id: teamId });

        if (!team) {
            return res.status(404).send("Team not found");
        }

        const newPlayer = new Players();
        newPlayer.name = name;
        newPlayer.position = position;
        newPlayer.team = team; // Assign the team to the player

        const playerRepository = AppDataSource.getRepository(Players);
        const savedPlayer = await playerRepository.save(newPlayer);
        res.status(201).json(savedPlayer); // Respond with the saved player
    } catch (error) {
        console.error("Error creating player:", error);
        res.status(500).send("Failed to create player");
    }
};

// Get all Players
export const getPlayers = async (req: Request, res: Response) => {
    try {
        const playerRepository = AppDataSource.getRepository(Players);
        const players = await playerRepository.find({
            relations: ["team", "stats"] // Fetch the team and stats related to each player
        });
        res.json(players); // Respond with the list of players
    } catch (error) {
        console.error("Error fetching players:", error);
        res.status(500).send("Failed to fetch players");
    }
};

// Get a Player by ID
export const getPlayerById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const playerRepository = AppDataSource.getRepository(Players);
        const player = await playerRepository.findOne({
            where: { id: parseInt(id) },
            relations: ["team", "stats"] // Load team and stats related to the player
        });

        if (!player) {
            return res.status(404).send("Player not found");
        }

        res.json(player); // Respond with the found player
    } catch (error) {
        console.error("Error fetching player:", error);
        res.status(500).send("Failed to fetch player");
    }
};

// Update a Player by ID
export const updatePlayer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, position, teamId } = req.body;

        const playerRepository = AppDataSource.getRepository(Players);
        let player = await playerRepository.findOne({
            where: { id: parseInt(id) },
            relations: ["team"] // Load the team related to the player
        });

        if (!player) {
            return res.status(404).send("Player not found");
        }

        // Update fields if provided
        if (name) player.name = name;
        if (position) player.position = position;

        // If teamId is provided, update the team
        if (teamId) {
            const teamsRepository = AppDataSource.getRepository(Teams);
            const team = await teamsRepository.findOneBy({ id: teamId });

            if (!team) {
                return res.status(404).send("Team not found");
            }

            player.team = team; // Assign the new team to the player
        }

        const updatedPlayer = await playerRepository.save(player);
        res.json(updatedPlayer); // Respond with the updated player
    } catch (error) {
        console.error("Error updating player:", error);
        res.status(500).send("Failed to update player");
    }
};

// Delete a Player by ID
export const deletePlayer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const playerRepository = AppDataSource.getRepository(Players);
        const player = await playerRepository.findOne({
            where: { id: parseInt(id) },
            relations: ["team"] // Ensure that team is loaded
        });

        if (!player) {
            return res.status(404).send("Player not found");
        }

        await playerRepository.remove(player); // Delete the player
        res.status(204).send(); // Respond with no content
    } catch (error) {
        console.error("Error deleting player:", error);
        res.status(500).send("Failed to delete player");
    }
};
