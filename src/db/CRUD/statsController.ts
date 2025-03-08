import { Request, Response } from "express";
import { AppDataSource } from "../data-source"; // TypeORM DataSource
import { Stats } from "../entities/Stats";
import { Players } from "../entities/Players";
import { Games } from "../entities/Games";

// Create a new Stats entry
export const createStat = async (req: Request, res: Response) => {
    try {
        const { playerId, gameId, spikingErrors, apeKills, apeAttempts, spikeKills, spikeAttempts, blocks, assists, digs, blockFollows, aces, miscErrors } = req.body;

        // Validate our required fields
        if (!playerId || !gameId) {
            return res.status(400).send("Player ID and Game ID are required");
        }

        // Fetch the player and game to associate with the stat
        const playerRepository = AppDataSource.getRepository(Players);
        const player = await playerRepository.findOneBy({ id: playerId });

        if (!player) {
            return res.status(404).send("Player not found");
        }

        const gameRepository = AppDataSource.getRepository(Games);
        const game = await gameRepository.findOneBy({ id: gameId });

        if (!game) {
            return res.status(404).send("Game not found");
        }

        // Create a new stat
        const newStat = new Stats();
        newStat.spikingErrors = spikingErrors;
        newStat.apeKills = apeKills;
        newStat.apeAttempts = apeAttempts;
        newStat.spikeKills = spikeKills;
        newStat.spikeAttempts = spikeAttempts;
        newStat.blocks = blocks;
        newStat.assists = assists;
        newStat.digs = digs;
        newStat.blockFollows = blockFollows;
        newStat.aces = aces;
        newStat.miscErrors = miscErrors;
        newStat.player = player; // Assign the player
        newStat.game = game; // Assign the game

        const statRepository = AppDataSource.getRepository(Stats);
        const savedStat = await statRepository.save(newStat);

        res.status(201).json(savedStat); // Respond with the saved stat
    } catch (error) {
        console.error("Error creating stat:", error);
        res.status(500).send("Failed to create stat");
    }
};

// Get all Stats for a Player
export const getStatsByPlayer = async (req: Request, res: Response) => {
    try {
        const { playerId } = req.params;
        const statRepository = AppDataSource.getRepository(Stats);

        const stats = await statRepository.find({
            where: { player: { id: parseInt(playerId) } },
            relations: ["game", "player"], // Fetch game and player details
        });

        res.json(stats); // Respond with the stats
    } catch (error) {
        console.error("Error fetching stats for player:", error);
        res.status(500).send("Failed to fetch stats for player");
    }
};

// Get all Stats for a Game
export const getStatsByGame = async (req: Request, res: Response) => {
    try {
        const { gameId } = req.params;
        const statRepository = AppDataSource.getRepository(Stats);

        const stats = await statRepository.find({
            where: { game: { id: parseInt(gameId) } },
            relations: ["game", "player"], // Fetch game and player details
        });

        res.json(stats); // Respond with the stats
    } catch (error) {
        console.error("Error fetching stats for game:", error);
        res.status(500).send("Failed to fetch stats for game");
    }
};

// Update a Stats entry by ID
export const updateStat = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { spikingErrors, apeKills, apeAttempts, spikeKills, spikeAttempts, blocks, assists, digs, blockFollows, aces, miscErrors } = req.body;

        const statRepository = AppDataSource.getRepository(Stats);
        let stat = await statRepository.findOne({
            where: { id: parseInt(id) },
            relations: ["game", "player"] // Load the player and game
        });

        if (!stat) {
            return res.status(404).send("Stat not found");
        }

        // Update stat values
        if (spikingErrors !== undefined) stat.spikingErrors = spikingErrors;
        if (apeKills !== undefined) stat.apeKills = apeKills;
        if (apeAttempts !== undefined) stat.apeAttempts = apeAttempts;
        if (spikeKills !== undefined) stat.spikeKills = spikeKills;
        if (spikeAttempts !== undefined) stat.spikeAttempts = spikeAttempts;
        if (blocks !== undefined) stat.blocks = blocks;
        if (assists !== undefined) stat.assists = assists;
        if (digs !== undefined) stat.digs = digs;
        if (blockFollows !== undefined) stat.blockFollows = blockFollows;
        if (aces !== undefined) stat.aces = aces;
        if (miscErrors !== undefined) stat.miscErrors = miscErrors;

        const updatedStat = await statRepository.save(stat);

        res.json(updatedStat); // Respond with the updated stat
    } catch (error) {
        console.error("Error updating stat:", error);
        res.status(500).send("Failed to update stat");
    }
};

// Delete a Stats entry by ID
export const deleteStat = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const statRepository = AppDataSource.getRepository(Stats);
        const stat = await statRepository.findOne({
            where: { id: parseInt(id) },
            relations: ["game", "player"] // Ensure that game and player are loaded
        });

        if (!stat) {
            return res.status(404).send("Stat not found");
        }

        await statRepository.remove(stat); // Delete the stat
        res.status(204).send(); // Respond with no content
    } catch (error) {
        console.error("Error deleting stat:", error);
        res.status(500).send("Failed to delete stat");
    }
};
