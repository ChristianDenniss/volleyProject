import { Repository } from 'typeorm';
import { AppDataSource } from '../../db/data-source';
import { Seasons } from './season.entity';
import { MissingFieldError } from '../../errors/MissingFieldError';
import { DuplicateError } from '../../errors/DuplicateError';
import { NotFoundError } from '../../errors/NotFoundError';
import { DateError } from '../../errors/DateErrors';
import { OutOfBoundsError } from '../../errors/OutOfBoundsError';
import { ConflictError } from '../../errors/ConflictError';


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
        if (!seasonNumber) throw new MissingFieldError("Season name");
        if (!startDate) throw new MissingFieldError("Start date");
        if (!endDate) throw new MissingFieldError("End date");

        // Check if season with same name and year already exists
        const existingSeason = await this.seasonRepository.findOne({
            where: { seasonNumber }
        });

        if (existingSeason) {
            throw new DuplicateError(`Season with name ${seasonNumber} already exists`);
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
        if (!id) throw new MissingFieldError("Season ID");

        const season = await this.seasonRepository.findOne({
            where: { id },
            relations: ["teams", "games"],
        });

        if (!season) throw new NotFoundError(`Season with ID ${id} not found`);

        return season;
    }

        /**
     * Update a season with validation
     */
    async updateSeason(id: number, seasonNumber: number, startDate: Date, endDate: Date): Promise<Seasons> {
        if (!id) throw new MissingFieldError("Season ID");

        const season = await this.seasonRepository.findOne({
            where: { id },
            relations: ["teams", "games"],
        });

        if (!season) throw new NotFoundError(`Season with ID: ${id} not found`);

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
            throw new OutOfBoundsError(`${seasonNumber} is out of bounds (less than 1 or greater than 100)`);
        }

        // Optional: Validate startDate and endDate logic (e.g., startDate should not be after endDate)
        if (startDate && endDate && startDate > endDate) {
            throw new DateError(startDate, endDate);
        }

        // Save the updated season object
        return this.seasonRepository.save(season);
    }


    /**
     * Delete a season with validation
     */
    async deleteSeason(id: number): Promise<void> {
        if (!id) throw new MissingFieldError("Season ID");

        const season = await this.seasonRepository.findOne({
            where: { id },
            relations: ["teams", "games"],
        });

        if (!season) throw new NotFoundError(`Season with ID ${id} not found`);

        // Check if season has teams or games
        if ((season.teams && season.teams.length > 0) || (season.games && season.games.length > 0)) {
            throw new ConflictError("Cannot delete season with associated teams or games");
        }

        await this.seasonRepository.remove(season);
    }
}