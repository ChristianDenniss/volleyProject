import { Request, Response } from "express";
import { AppDataSource } from "../data-source"; //  TypeORM DataSource
import { Seasons } from "../entities/Seasons"; // Import Seasons entity

// Create a new season
export const createSeason = async (req: Request, res: Response) => {
    try {
        const { seasonNumber, startDate, endDate, isActive } = req.body;
        const newSeason = new Seasons();
        newSeason.seasonNumber = seasonNumber;
        newSeason.startDate = new Date(startDate);
        newSeason.endDate = new Date(endDate);
        newSeason.isActive = isActive;

        const seasonRepository = AppDataSource.getRepository(Seasons);
        const savedSeason = await seasonRepository.save(newSeason);
        res.status(201).json(savedSeason); // Respond with the saved season
    } catch (error) {
        console.error("Error creating season:", error);
        res.status(500).send("Error creating season");
    }
};

// Get all the seasons
export const getSeasons = async (req: Request, res: Response) => {
    try {
        const seasonRepository = AppDataSource.getRepository(Seasons);
        const seasons = await seasonRepository.find(); // Fetch all seasons
        res.json(seasons); // Respond with the list of seasons
    } catch (error) {
        console.error("Error fetching seasons:", error);
        res.status(500).send("Error fetching seasons");
    }
};

// Get a season by ID
export const getSeasonById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const seasonRepository = AppDataSource.getRepository(Seasons);
        const season = await seasonRepository.findOne({ where: { id: parseInt(id) } });

        if (!season) {
            return res.status(404).send("Season not found");
        }

        res.json(season); // Respond with the found season
    } catch (error) {
        console.error("Error fetching season:", error);
        res.status(500).send("Error fetching season");
    }
};

// Update a season by ID
export const updateSeason = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { seasonNumber, startDate, endDate, isActive } = req.body;

        const seasonRepository = AppDataSource.getRepository(Seasons);
        let season = await seasonRepository.findOne({ where: { id: parseInt(id) } });

        if (!season) {
            return res.status(404).send("Season not found");
        }

        // Update the season properties
        season.seasonNumber = seasonNumber ?? season.seasonNumber;
        season.startDate = new Date(startDate) ?? season.startDate;
        season.endDate = new Date(endDate) ?? season.endDate;
        season.isActive = isActive ?? season.isActive;

        const updatedSeason = await seasonRepository.save(season);
        res.json(updatedSeason); // Respond with the updated season
    } catch (error) {
        console.error("Error updating season:", error);
        res.status(500).send("Error updating season");
    }
};

// Delete a season by ID
export const deleteSeason = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const seasonRepository = AppDataSource.getRepository(Seasons);
        const season = await seasonRepository.findOne({ where: { id: parseInt(id) } });

        if (!season) {
            return res.status(404).send("Season not found");
        }

        await seasonRepository.remove(season); // Delete the season
        res.status(204).send(); // Respond with no content
    } catch (error) {
        console.error("Error deleting season:", error);
        res.status(500).send("Error deleting season");
    }
};
