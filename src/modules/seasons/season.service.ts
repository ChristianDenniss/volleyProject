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
    async createSeason(name: string, year: number): Promise<Seasons> {
        // Validation
        if (!name) throw new Error("Season name is required");
        if (!year) throw new Error("Year is required");
        
        // Validate year is reasonable
        const currentYear = new Date().getFullYear();
        if (year < 1900 || year > currentYear + 5) {
            throw new Error(`Year must be between 1900 and ${currentYear + 5}`);
        }

        // Check if season with same name and year already exists
        const existingSeason = await this.seasonRepository.findOne({
            where: { name, year }
        });

        if (existingSeason) {
            throw new Error(`Season with name "${name}" and year ${year} already exists`);
        }

        // Create new season
        const newSeason = new Seasons();
        newSeason.name = name;
        newSeason.year = year;

        return this.seasonRepository.save(newSeason);
    }

    /**
     * Get all seasons
     */
    async getAllSeasons(): Promise<Seasons[]> {
        return this.seasonRepository.find({
            relations: ["teams", "games"],
            order: { year: "DESC" } // Sort by most recent first
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
    async updateSeason(id: number, name?: string, year?: number): Promise<Seasons> {
        if (!id) throw new Error("Season ID is required");

        const season = await this.seasonRepository.findOne({
            where: { id },
            relations: ["teams", "games"],
        });

        if (!season) throw new Error("Season not found");

        if (name) season.name = name;
        
        if (year) {
            // Validate year is reasonable
            const currentYear = new Date().getFullYear();
            if (year < 1900 || year > currentYear + 5) {
                throw new Error(`Year must be between 1900 and ${currentYear + 5}`);
            }
            
            // Check if another season with same name and year already exists
            if (name || season.name) {
                const nameToCheck = name || season.name;
                const existingSeason = await this.seasonRepository.findOne({
                    where: { 
                        name: nameToCheck, 
                        year,
                        id: { $ne: id } as any // Not the current season
                    }
                });

                if (existingSeason) {
                    throw new Error(`Season with name "${nameToCheck}" and year ${year} already exists`);
                }
            }
            
            season.year = year;
        }

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