import { Repository, In } from 'typeorm';
import { AppDataSource } from '../../db/data-source.js';
import { Awards } from './award.entity.js';
import { Seasons } from '../seasons/season.entity.js';
import { Players } from '../players/player.entity.js';
import { MissingFieldError } from '../../errors/MissingFieldError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { DuplicateError } from '../../errors/DuplicateError.js';
import { MultiplePlayersNotFoundError } from '../../errors/MultiplePlayersNotFoundError.js';
import { CreateAwardDto, CreateMultipleAwardsDto, UpdateAwardDto } from "./awards.schema.js";

export class AwardService {
    private awardRepository: Repository<Awards>;
    private seasonRepository: Repository<Seasons>;
    private playerRepository: Repository<Players>;

    constructor() {
        this.awardRepository = AppDataSource.getRepository(Awards);
        this.seasonRepository = AppDataSource.getRepository(Seasons);
        this.playerRepository = AppDataSource.getRepository(Players);
    }

    /**
     * Create a new award
     * @param awardData - The award data to create
     * @returns The created award
     * @throws {NotFoundError} If the season is not found
     * @throws {DuplicateError} If an award of the same type already exists in the season
     */
    async createAward(awardData: CreateAwardDto): Promise<Awards> {
        const { description, type, imageUrl, seasonId, playerIds } = awardData;

        // Check if season exists
        const season = await this.seasonRepository.findOne({ where: { id: seasonId } });
        if (!season) {
            throw new NotFoundError(`Season with ID ${seasonId} not found`);
        }

        // Check if award of same type exists in the season
        const existingTypeAward = await this.awardRepository.findOne({
            where: { type, season: { id: seasonId } }
        });
        if (existingTypeAward) {
            throw new DuplicateError(`Award of type ${type} already exists in this season`);
        }

        // Create new award
        const award = this.awardRepository.create({
            description,
            type,
            imageUrl,
            season
        });

        // Add players if provided
        if (playerIds && playerIds.length > 0) {
            const players = await this.playerRepository.findBy({ id: In(playerIds) });
            if (players.length !== playerIds.length) {
                const foundIds = players.map(p => p.id);
                const missingIds = playerIds.filter(id => !foundIds.includes(id));
                throw new MultiplePlayersNotFoundError(missingIds);
            }
            award.players = players;
        }

        return this.awardRepository.save(award);
    }

    /**
     * Create multiple awards
     * @param awardsData - Array of award data to create
     * @returns Array of created awards
     */
    async createMultipleAwards(awardsData: CreateMultipleAwardsDto): Promise<Awards[]> {
        const awards: Awards[] = [];

        for (const awardData of awardsData) {
            const award = await this.createAward(awardData);
            awards.push(award);
        }

        return awards;
    }

    /**
     * Find all awards
     * @returns Array of all awards
     */
    async findAllAwards(): Promise<Awards[]> {
        return this.awardRepository.find({
            relations: ["players", "season", "players.teams"]
        });
    }

    /**
     * Find all awards without relations / minimal data
     */
    async findSkinnyAllAwards(): Promise<Awards[]> {
        return this.awardRepository.find({
            relations: ["players", "season"]
        });
    }

    /**
     * Find an award by ID
     * @param id - The award ID
     * @returns The found award or null
     */
    async findAwardById(id: number): Promise<Awards | null> {
        return this.awardRepository.findOne({
            where: { id },
            relations: ["players", "season", "players.teams", "players.teams.season"]
        });
    }

    /**
     * Find awards by type
     * @param type - The award type
     * @returns Array of awards with the specified type
     */
    async findAwardsByType(type: string): Promise<Awards[]> {
        return this.awardRepository.find({
            where: { type },
            relations: ["players", "season", "players.teams"]
        });
    }

    /**
     * Find awards by season
     * @param seasonId - The season ID
     * @returns Array of awards for the specified season
     */
    async findAwardsBySeason(seasonId: number): Promise<Awards[]> {
        return this.awardRepository.find({
            where: { season: { id: seasonId } },
            relations: ["players", "season"]
        });
    }

    /**
     * Update an award
     * @param id - The award ID from URL params
     * @param awardData - The award data to update
     * @returns The updated award
     * @throws {NotFoundError} If the award is not found
     */
    async updateAward(id: number, awardData: UpdateAwardDto): Promise<Awards | null> {
        const { description, type, imageUrl, seasonId, playerIds, playerName, createdAt } = awardData;

        const award = await this.awardRepository.findOne({
            where: { id },
            relations: ["players", "season"]
        });

        if (!award) {
            throw new NotFoundError(`Award with ID ${id} not found`);
        }

        if (description) award.description = description;
        if (type) award.type = type;
        if (imageUrl) award.imageUrl = imageUrl;
        if (createdAt) award.createdAt = new Date(createdAt);

        // Update season if provided
        if (seasonId) {
            const season = await this.seasonRepository.findOne({ where: { id: seasonId } });
            if (!season) {
                throw new NotFoundError(`Season with ID ${seasonId} not found`);
            }
            award.season = season;
        }

        // Update players if provided
        if (playerIds) {
            const players = await this.playerRepository.findBy({ id: In(playerIds) });
            if (players.length !== playerIds.length) {
                const foundIds = players.map(p => p.id);
                const missingIds = playerIds.filter(id => !foundIds.includes(id));
                throw new MultiplePlayersNotFoundError(missingIds);
            }
            award.players = players;
        } else if (playerName) {
            // Find player by name
            const player = await this.playerRepository.findOne({ 
                where: { 
                    name: playerName.toLowerCase() 
                } 
            });
            if (!player) {
                throw new NotFoundError(`Player with name ${playerName} not found`);
            }
            award.players = [player];
        }

        return this.awardRepository.save(award);
    }

    /**
     * Remove an award
     * @param id - The award ID
     * @returns The removed award
     * @throws {NotFoundError} If the award is not found
     */
    async removeAward(id: number): Promise<Awards | null> {
        const award = await this.awardRepository.findOne({
            where: { id },
            relations: ["players", "season"]
        });

        if (!award) {
            throw new NotFoundError(`Award with ID ${id} not found`);
        }

        return this.awardRepository.remove(award);
    }

    /**
     * Create a new award using player name
     * @param awardData - The award data with player name
     * @returns The created award
     * @throws {NotFoundError} If the season or player is not found
     * @throws {DuplicateError} If an award of the same type already exists in the season
     */
    async createAwardWithPlayerNames(
        description: string,
        type: string,
        seasonId: number,
        playerName: string,
        imageUrl?: string
    ): Promise<Awards> {
        try {
            console.log('Service: Starting award creation with:', { description, type, seasonId, playerName, imageUrl });

            // Check database connection
            if (!AppDataSource.isInitialized) {
                console.error('Service: Database not initialized');
                throw new Error('Database connection not initialized');
            }

            // Validate award type
            const validTypes = ["MVP", "Best Spiker", "Best Server", "Best Blocker", "Best Libero", "Best Setter", "MIP", "Best Aper", "FMVP", "DPOS", "Best Receiver", "LuvLate Award"];
            console.log('Service: Validating award type:', type);
            if (!validTypes.includes(type)) {
                throw new Error(`Invalid award type: ${type}. Must be one of: ${validTypes.join(', ')}`);
            }

            // Check if season exists
            console.log('Service: Checking if season exists:', seasonId);
            const season = await this.seasonRepository.findOne({ where: { id: seasonId } });
            console.log('Service: Found season:', season);
            if (!season) {
                throw new NotFoundError(`Season with ID ${seasonId} not found`);
            }

            // Check if award of same type exists in the season
            console.log('Service: Checking for existing award of same type in season');
            const existingTypeAward = await this.awardRepository.findOne({
                where: { type, season: { id: seasonId } }
            });
            console.log('Service: Existing award check result:', existingTypeAward);
            if (existingTypeAward) {
                throw new DuplicateError(`Award of type ${type} already exists in this season`);
            }

            // Find player by name
            console.log('Service: Looking for player with name:', playerName.toLowerCase());
            const player = await this.playerRepository.findOne({ 
                where: { 
                    name: playerName.toLowerCase() 
                } 
            });
            console.log('Service: Found player:', player);
            if (!player) {
                throw new NotFoundError(`Player with name ${playerName} not found`);
            }

            // Create new award without players first
            console.log('Service: Creating new award object');
            const award = this.awardRepository.create({
                description,
                type,
                imageUrl,
                season
            });

            // Save the award first
            console.log('Service: Saving award without players');
            const savedAward = await this.awardRepository.save(award);
            console.log('Service: Successfully saved award:', savedAward);

            // Now add the player relationship
            console.log('Service: Adding player relationship');
            savedAward.players = [player];
            const finalAward = await this.awardRepository.save(savedAward);
            console.log('Service: Successfully saved award with player:', finalAward);

            return finalAward;
        } catch (error) {
            console.error('Service: Error in createAwardWithPlayerNames:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('An unexpected error occurred while creating the award');
        }
    }

    /**
     * Get all awards for a specific player
     * @param playerId - The ID of the player
     * @returns Array of awards for the player
     * @throws NotFoundError if player not found
     */
    async getAwardsByPlayerId(playerId: number): Promise<Awards[]> {
        // Check if player exists
        const player = await this.playerRepository.findOne({
            where: { id: playerId }
        });

        if (!player) {
            throw new NotFoundError(`Player with ID ${playerId} not found`);
        }

        // Get all awards for the player with season information
        const awards = await this.awardRepository.find({
            where: {
                players: { id: playerId }
            },
            relations: ['season', 'players'],
            order: {
                createdAt: 'DESC'
            }
        });

        return awards;
    }
} 