import { Request, Response } from "express";
import { AppDataSource } from "../data-source"; // TypeORM DataSource
import { Games } from "../entities/Games";
import { Teams } from "../entities/Teams"; // We also need teams because a game requires 2 teams
import { Stats } from "../entities/Stats"; // Optional game stat can be added
import { In } from 'typeorm'; // To use the In function, chat said find by id is deprecated

// Create a new Game
export const createGame = async (req: Request, res: Response) => {
    try {
        const { teamIds } = req.body;

        // Validate the teamIds array
        if (!Array.isArray(teamIds) || teamIds.length === 0) {
            return res.status(400).send("Invalid team IDs");
        }

        // Get the teams by their IDs (many-to-many relation)
        const teamsRepository = AppDataSource.getRepository(Teams);
        const teams = await teamsRepository.findBy({
            id: In(teamIds)
        });

        // If teams are not found, return an error
        if (teams.length !== teamIds.length) {
            return res.status(404).send("One or more teams not found");
        }

        const newGame = new Games();
        newGame.teams = teams; // Assign the teams to the game

        const gameRepository = AppDataSource.getRepository(Games);
        const savedGame = await gameRepository.save(newGame);
        res.status(201).json(savedGame); // Respond with the saved game
    } catch (error) {
        console.error("Error creating Game:", error);
        res.status(500).send("Failed to create Game");
    }
};

// Get all the Games
export const getGames = async (req: Request, res: Response) => {
    try {
        const gameRepository = AppDataSource.getRepository(Games);
        const games = await gameRepository.find({
            relations: ["teams"] // Fetch the teams related to each game
        });
        res.json(games); // Respond with the list of games
    } catch (error) {
        console.error("Error fetching games:", error);
        res.status(500).send("Failed to fetch games");
    }
};

// Get a game by ID
export const getGameById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const gameRepository = AppDataSource.getRepository(Games);
        const game = await gameRepository.findOne({
            where: { id: parseInt(id) },
            relations: ["teams", "stats"] // Load teams and stats related to the game
        });

        if (!game) {
            return res.status(404).send("Game not found");
        }

        res.json(game); // Respond with the found game
    } catch (error) {
        console.error("Error fetching game:", error);
        res.status(500).send("Failed to fetch game");
    }
};

// Update a game by ID
export const updateGame = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { teamIds } = req.body;

        const gameRepository = AppDataSource.getRepository(Games);
        let game = await gameRepository.findOne({
            where: { id: parseInt(id) },
            relations: ["teams"] // Load the teams related to the game
        });

        if (!game) {
            return res.status(404).send("Game not found");
        }

        // If teams are provided, update the teams
        if (teamIds && teamIds.length > 0) {
            const teamsRepository = AppDataSource.getRepository(Teams);
            const teams = await teamsRepository.findBy({
                id: In(teamIds)
            });

            // If teams are not found, return an error
            if (teams.length !== teamIds.length) {
                return res.status(404).send("One or more teams not found");
            }

            game.teams = teams; // Assign the new teams to the game
        }

        const updatedGame = await gameRepository.save(game);
        res.json(updatedGame); // Respond with the updated game
    } catch (error) {
        console.error("Error updating game:", error);
        res.status(500).send("Failed to update game");
    }
};

// Delete a game by ID
export const deleteGame = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const gameRepository = AppDataSource.getRepository(Games);
        const game = await gameRepository.findOne({
            where: { id: parseInt(id) },
            relations: ["teams"] // Ensure that teams are loaded
        });

        if (!game) {
            return res.status(404).send("Game not found");
        }

        await gameRepository.remove(game); // Delete the game
        res.status(204).send(); // Respond with no content
    } catch (error) {
        console.error("Error deleting game:", error);
        res.status(500).send("Failed to delete game");
    }
};

// Add stats to an existing game
export const addStatsToGame = async (req: Request, res: Response) => {
    try {
        const { gameId, statIds } = req.body;

        // Fetch the game by its ID
        const gameRepository = AppDataSource.getRepository(Games);
        const game = await gameRepository.findOne({
            where: { id: parseInt(gameId) },
            relations: ["stats"] // Make sure to load existing stats if any
        });

        if (!game) {
            return res.status(404).send("Game not found");
        }

        // Fetch the stats by their IDs
        const statsRepository = AppDataSource.getRepository(Stats);
        const stats = await statsRepository.findByIds(statIds);

        // If any stats are not found, return an error
        if (stats.length !== statIds.length) {
            return res.status(404).send("One or more stats not found");
        }

        // Add the new stats to the game's existing stats
        game.stats = [...game.stats, ...stats]; // Concatenate existing stats with new stats

        // Save the updated game
        const updatedGame = await gameRepository.save(game);
        res.json(updatedGame); // Respond with the updated game
    } catch (error) {
        console.error("Error adding stats to game:", error);
        res.status(500).send("Error adding stats to game");
    }
};