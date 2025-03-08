import { Request, Response } from "express";
import { AppDataSource } from "../data-source"; // TypeORM DataSource
import { Teams } from "../entities/Teams";
import { Players } from "../entities/Players";
import { Seasons } from "../entities/Seasons";
import { Games } from "../entities/Games";

// Create a new Team
export const createTeam = async (req: Request, res: Response) => {
    try {
        const { name, seasonId, playerIds, gameIds } = req.body;

        // Validate required fields
        if (!name || !seasonId) {
            return res.status(400).send("Team name and season ID are required");
        }

        // Fetch the season to associate with the team
        const seasonRepository = AppDataSource.getRepository(Seasons);
        const season = await seasonRepository.findOneBy({ id: seasonId });

        if (!season) {
            return res.status(404).send("Season not found");
        }

        // Create a new team
        const newTeam = new Teams();
        newTeam.name = name;
        newTeam.season = season;

        // Add players and games relationships
        if (playerIds && playerIds.length > 0) {
            const playerRepository = AppDataSource.getRepository(Players);
            const players = await playerRepository.findByIds(playerIds);
            newTeam.players = players;
        }

        if (gameIds && gameIds.length > 0) {
            const gameRepository = AppDataSource.getRepository(Games);
            const games = await gameRepository.findByIds(gameIds);
            newTeam.games = games;
        }

        const teamRepository = AppDataSource.getRepository(Teams);
        const savedTeam = await teamRepository.save(newTeam);

        res.status(201).json(savedTeam); // Respond with the saved team
    } catch (error) {
        console.error("Error creating team:", error);
        res.status(500).send("Failed to create team");
    }
};

// Get all Teams
export const getTeams = async (req: Request, res: Response) => {
    try {
        const teamRepository = AppDataSource.getRepository(Teams);

        const teams = await teamRepository.find({
            relations: ["season", "players", "games"], // Fetch related entities
        });

        res.json(teams); // Respond with the list of teams
    } catch (error) {
        console.error("Error fetching teams:", error);
        res.status(500).send("Failed to fetch teams");
    }
};

// Get Team by ID
export const getTeamById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const teamRepository = AppDataSource.getRepository(Teams);

        const team = await teamRepository.findOne({
            where: { id: parseInt(id) },
            relations: ["season", "players", "games"], // Fetch related entities
        });

        if (!team) {
            return res.status(404).send("Team not found");
        }

        res.json(team); // Respond with the found team
    } catch (error) {
        console.error("Error fetching team by ID:", error);
        res.status(500).send("Failed to fetch team");
    }
};

// Update a Team by ID
export const updateTeam = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, seasonId, playerIds, gameIds } = req.body;

        const teamRepository = AppDataSource.getRepository(Teams);
        let team = await teamRepository.findOne({
            where: { id: parseInt(id) },
            relations: ["season", "players", "games"], // Load related entities
        });

        if (!team) {
            return res.status(404).send("Team not found");
        }

        // Update team fields
        if (name) team.name = name;
        if (seasonId) {
            const seasonRepository = AppDataSource.getRepository(Seasons);
            const season = await seasonRepository.findOneBy({ id: seasonId });
            if (season) team.season = season;
        }

        if (playerIds && playerIds.length > 0) {
            const playerRepository = AppDataSource.getRepository(Players);
            const players = await playerRepository.findByIds(playerIds);
            team.players = players;
        }

        if (gameIds && gameIds.length > 0) {
            const gameRepository = AppDataSource.getRepository(Games);
            const games = await gameRepository.findByIds(gameIds);
            team.games = games;
        }

        const updatedTeam = await teamRepository.save(team);

        res.json(updatedTeam); // Respond with the updated team
    } catch (error) {
        console.error("Error updating team:", error);
        res.status(500).send("Failed to update team");
    }
};

// Delete a Team by ID
export const deleteTeam = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const teamRepository = AppDataSource.getRepository(Teams);
        const team = await teamRepository.findOne({
            where: { id: parseInt(id) },
            relations: ["season", "players", "games"], // Ensure relationships are loaded
        });

        if (!team) {
            return res.status(404).send("Team not found");
        }

        await teamRepository.remove(team); // Delete the team
        res.status(204).send(); // Respond with no content
    } catch (error) {
        console.error("Error deleting team:", error);
        res.status(500).send("Failed to delete team");
    }
};

// Fetch teams by season ID
export const getTeamsBySeasonId = async (req: Request, res: Response) => {
    try {
        const { seasonId } = req.params;

        if (!seasonId) {
            return res.status(400).send("Season ID is required");
        }

        const teamRepository = AppDataSource.getRepository(Teams);

        // Fetch teams that belong to the given season
        const teams = await teamRepository.find({
            where: { season: { id: parseInt(seasonId) } }, // Filter teams by seasonId
        });

        if (teams.length === 0) {
            return res.status(404).send("No teams found for the specified season");
        }

        res.json(teams); // Respond with the list of teams
    } catch (error) {
        console.error("Error fetching teams by season ID:", error);
        res.status(500).send("Failed to fetch teams by season");
    }
};
