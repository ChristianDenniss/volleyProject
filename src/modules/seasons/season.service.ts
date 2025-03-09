import { Repository } from 'typeorm';
import { AppDataSource } from '../../db/data-source';
import { Seasons } from './season.entity';

export class SeasonService {
    private seasonRepository: Repository<Seasons>;

    constructor() {
        this.seasonRepository = AppDataSource.getRepository(Seasons);
    }

    /**
     * Create a new season with validation
     */
    async createSeason(seasonNumber: number, startDate: Date, endDate: Date ): Promise<Seasons> {
        // Validation
        if (!seasonNumber) throw new Error("Season name is required");
        if (!startDate) throw new Error("Start date is required");
        if (!endDate) throw new Error("End date is required");

        // Check if season with same name and year already exists
        const existingSeason = await this.seasonRepository.findOne({
            where: { seasonNumber }
        });

        if (existingSeason) {
            throw new Error(`Season with name "${seasonNumber}" already exists`);
        }

        // Create new season
        const newSeason = new Seasons();
        newSeason.seasonNumber = seasonNumber;
        newSeason.startDate = startDate;
        newSeason.endDate = endDate;

        return this.seasonRepository.save(newSeason);
    }

    /**
     * Get all seasons
     */
    async getAllSeasons(): Promise<Seasons[]> {
        return this.seasonRepository.find({
            relations: ["teams", "games"],
            order: { seasonNumber: "DESC" } // Sort by most recent season
        });
    }

    /**
     * Get season by ID with validation
     */
    async getSeasonById(id: number): Promise<Seasons> {
        if (!id) throw new Error("Season ID is required");

        const season = await this.seasonRepository.findOne({
            where: { id },
            relations: ["teams", "games"],
        });

        if (!season) throw new Error("Season not found");

        return season;
    }

        /**
     * Update a season with validation
     */
    async updateSeason(id: number, seasonNumber: number, startDate: Date, endDate: Date): Promise<Seasons> {
        if (!id) throw new Error("Season ID is required");

        const season = await this.seasonRepository.findOne({
            where: { id },
            relations: ["teams", "games"],
        });

        if (!season) throw new Error("Season not found");

        // Update season number if provided
        if (seasonNumber) {
            season.seasonNumber = seasonNumber;
        }

        // Update startDate and endDate if provided
        if (startDate) {
            season.startDate = startDate;
        }
        
        if (endDate) {
            season.endDate = endDate;
        }

        // Optional: Validate seasonNumber if necessary (e.g., if it's within a valid range)
        if (seasonNumber && (seasonNumber < 1 || seasonNumber > 100)) {
            throw new Error("Season number must be between 1 and 100");
        }

        // Optional: Validate startDate and endDate logic (e.g., startDate should not be after endDate)
        if (startDate && endDate && startDate > endDate) {
            throw new Error("Start date cannot be after end date");
        }

        // Save the updated season object
        return this.seasonRepository.save(season);
    }


    /**
     * Delete a season with validation
     */
    async deleteSeason(id: number): Promise<void> {
        if (!id) throw new Error("Season ID is required");

        const season = await this.seasonRepository.findOne({
            where: { id },
            relations: ["teams", "games"],
        });

        if (!season) throw new Error("Season not found");

        // Check if season has teams or games
        if ((season.teams && season.teams.length > 0) || (season.games && season.games.length > 0)) {
            throw new Error("Cannot delete season with associated teams or games");
        }

        await this.seasonRepository.remove(season);
    }
}