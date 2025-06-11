import { Repository } from "typeorm";
import { AppDataSource } from "../../db/data-source.js";
import { Seasons } from "./season.entity.js";
import { MissingFieldError } from "../../errors/MissingFieldError.js";
import { DuplicateError } from "../../errors/DuplicateError.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { DateError } from "../../errors/DateErrors.js";
import { OutOfBoundsError } from "../../errors/OutOfBoundsError.js";
import { ConflictError } from "../../errors/ConflictError.js";

export class SeasonService
{
    private seasonRepository: Repository<Seasons>;

    constructor()
    {
        this.seasonRepository = AppDataSource.getRepository(Seasons);
    }

    /**
     * Create a new season with validation
     */
    async createSeason(
        seasonNumber: number,
        startDate: Date,
        endDate: Date,
        theme: string,
        image?: string
    ): Promise<Seasons>
    {
        /* ---------- Field presence checks ---------- */
        if (!seasonNumber)   throw new MissingFieldError("Season name");
        if (!startDate)      throw new MissingFieldError("Start date");
        if (!endDate)        throw new MissingFieldError("End date");
        if (!theme)          throw new MissingFieldError("Theme");

        /* ---------- Duplicate season check ---------- */
        const existingSeason = await this.seasonRepository.findOne({
            where: { seasonNumber }
        });

        if (existingSeason)
        {
            throw new DuplicateError(`Season with name ${seasonNumber} already exists`);
        }

        /* ---------- Create and save ---------- */
        const newSeason        = new Seasons();
        newSeason.seasonNumber = seasonNumber;
        newSeason.startDate    = startDate;
        newSeason.endDate      = endDate;
        newSeason.theme        = theme;
        if (image !== undefined)
        {
            newSeason.image = image;
        }

        return this.seasonRepository.save(newSeason);
    }

    /**
     * Get all seasons
     */
    async getAllSeasons(): Promise<Seasons[]>
    {
        try {
            console.log('Fetching all seasons...');
            const seasons = await this.seasonRepository.find({
                relations: ["teams", "games", "awards"],
                order: { seasonNumber: "DESC" }
            });
            console.log(`Found ${seasons.length} seasons`);
            return seasons;
        } catch (error) {
            console.error('Error in getAllSeasons:', {
                error: error instanceof Error ? {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                } : error,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    /**
     * Get season by ID with validation
     */
    async getSeasonById(id: number): Promise<Seasons>
    {
        if (!id) throw new MissingFieldError("Season ID");

        const season = await this.seasonRepository.findOne({
            where: { id },
            relations: ["teams", "games", "teams.players"]
        });

        if (!season) throw new NotFoundError(`Season with ID ${id} not found`);

        return season;
    }

    /**
     * Update a season with validation
     */
    async updateSeason(
        id: number,
        seasonNumber?: number,
        startDate?: Date,
        endDate?: Date,
        theme?: string,
        image?: string
    ): Promise<Seasons>
    {
        if (!id) throw new MissingFieldError("Season ID");

        const season = await this.seasonRepository.findOne({
            where: { id },
            relations: ["teams", "games"]
        });

        if (!season) throw new NotFoundError(`Season with ID: ${id} not found`);

        /* ---------- Update simple scalar fields if supplied ---------- */
        if (seasonNumber !== undefined)
        {
            season.seasonNumber = seasonNumber;

            // Optional numeric range guard
            if (seasonNumber < 1 || seasonNumber > 100)
            {
                throw new OutOfBoundsError(
                    `${seasonNumber} is out of bounds (less than 1 or greater than 100)`
                );
            }
        }

        if (startDate !== undefined)
        {
            season.startDate = startDate;
        }

        if (endDate !== undefined)
        {
            season.endDate = endDate;
        }

        if (theme !== undefined)
        {
            if (!theme) throw new MissingFieldError("Theme");
            season.theme = theme;
        }

        if (image !== undefined)
        {
            season.image = image;
        }

        /* ---------- Cross-field date consistency ---------- */
        if (season.startDate && season.endDate && season.startDate > season.endDate)
        {
            throw new DateError(season.startDate, season.endDate);
        }

        return this.seasonRepository.save(season);
    }

    /**
     * Delete a season with validation
     */
    async deleteSeason(id: number): Promise<void>
    {
        if (!id) throw new MissingFieldError("Season ID");

        const season = await this.seasonRepository.findOne({
            where: { id },
            relations: ["teams", "games"]
        });

        if (!season) throw new NotFoundError(`Season with ID ${id} not found`);

        /* ---------- Guard against removing seasons in use ---------- */
        if (
            (season.teams && season.teams.length > 0) ||
            (season.games && season.games.length > 0)
        )
        {
            throw new ConflictError("Cannot delete season with associated teams or games");
        }

        await this.seasonRepository.remove(season);
    }
}
