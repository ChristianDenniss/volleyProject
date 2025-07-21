import { AppDataSource } from '../../db/data-source.js';
import { Players } from '../players/player.entity.js';
import { Teams } from '../teams/team.entity.js';
import { Seasons } from '../seasons/season.entity.js';
import { Awards } from '../awards/award.entity.js';
import { Stats } from '../stats/stat.entity.js';
import { 
    TriviaPlayerSchema, 
    TriviaTeamSchema, 
    TriviaSeasonSchema, 
    GuessResultSchema,
    type TriviaPlayer,
    type TriviaTeam,
    type TriviaSeason,
    type GuessResult
} from './trivia.schema.js';

export class TriviaService {
    private get playerRepository() {
        return AppDataSource.getRepository(Players);
    }
    
    private get teamRepository() {
        return AppDataSource.getRepository(Teams);
    }
    
    private get seasonRepository() {
        return AppDataSource.getRepository(Seasons);
    }
    
    private get awardRepository() {
        return AppDataSource.getRepository(Awards);
    }
    
    private get statRepository() {
        return AppDataSource.getRepository(Stats);
    }

    /**
     * Get a random trivia player with all relations - OPTIMIZED VERSION
     */
    async getRandomTriviaPlayer(difficulty: string): Promise<TriviaPlayer> {
        // Step 1: Fetch all player IDs only (minimal memory usage)
        const playerIds = await this.playerRepository.find({ 
            select: ['id'] 
        });

        if (playerIds.length === 0) {
            throw new Error('No players found in database');
        }

        // Step 2: Find candidates that match difficulty (fetch minimal data for each)
        const candidates: number[] = [];
        
        for (const { id } of playerIds) {
            try {
                // Fetch minimal player data needed for difficulty calculation
                const player = await this.playerRepository.findOne({
                    where: { id },
                    relations: ['teams', 'awards', 'stats', 'records'],
                    select: ['id', 'name', 'position'] // Only fetch fields needed for difficulty calc
                });

                if (player && this.calculatePlayerDifficulty(player) === difficulty) {
                    candidates.push(id);
                }
            } catch (error) {
                console.warn(`Error processing player ${id}:`, error);
                continue; // Skip this player and continue with others
            }
        }

        if (candidates.length === 0) {
            throw new Error(`No players found for difficulty: ${difficulty}`);
        }

        // Step 3: Pick a random candidate ID
        const randomId = candidates[Math.floor(Math.random() * candidates.length)];

        // Step 4: Fetch the full player with all relations
        const randomPlayer = await this.playerRepository.findOne({
            where: { id: randomId },
            relations: ['teams', 'awards', 'stats', 'records']
        });

        if (!randomPlayer) {
            throw new Error(`Failed to fetch player with ID ${randomId}`);
        }
        
        const triviaPlayer = {
            id: randomPlayer.id,
            name: randomPlayer.name,
            position: randomPlayer.position,
            teams: randomPlayer.teams || [],
            awards: randomPlayer.awards || [],
            stats: randomPlayer.stats || [],
            records: randomPlayer.records || [],
            difficulty: difficulty as 'easy' | 'medium' | 'hard',
            hintCount: this.getHintCount(difficulty)
        };

        // Validate with Zod schema
        return TriviaPlayerSchema.parse(triviaPlayer);
    }

    /**
     * Get a random trivia team with all relations - OPTIMIZED VERSION
     */
    async getRandomTriviaTeam(difficulty: string): Promise<TriviaTeam> {
        // Step 1: Fetch all team IDs only
        const teamIds = await this.teamRepository.find({ 
            select: ['id'] 
        });

        if (teamIds.length === 0) {
            throw new Error('No teams found in database');
        }

        // Step 2: Find candidates that match difficulty
        const candidates: number[] = [];
        
        for (const { id } of teamIds) {
            try {
                // Fetch minimal team data needed for difficulty calculation
                const team = await this.teamRepository.findOne({
                    where: { id },
                    relations: ['players', 'games', 'season'],
                    select: ['id', 'name', 'placement'] // Only fetch fields needed for difficulty calc
                });

                if (team && this.calculateTeamDifficulty(team) === difficulty) {
                    candidates.push(id);
                }
            } catch (error) {
                console.warn(`Error processing team ${id}:`, error);
                continue;
            }
        }

        if (candidates.length === 0) {
            throw new Error(`No teams found for difficulty: ${difficulty}`);
        }

        // Step 3: Pick a random candidate ID
        const randomId = candidates[Math.floor(Math.random() * candidates.length)];

        // Step 4: Fetch the full team with all relations
        const randomTeam = await this.teamRepository.findOne({
            where: { id: randomId },
            relations: ['players', 'games', 'season']
        });

        if (!randomTeam) {
            throw new Error(`Failed to fetch team with ID ${randomId}`);
        }
        
        const triviaTeam = {
            id: randomTeam.id,
            name: randomTeam.name,
            placement: randomTeam.placement,
            players: randomTeam.players || [],
            games: randomTeam.games || [],
            season: randomTeam.season,
            difficulty: difficulty as 'easy' | 'medium' | 'hard',
            hintCount: this.getHintCount(difficulty)
        };

        // Validate with Zod schema
        return TriviaTeamSchema.parse(triviaTeam);
    }

    /**
     * Get a random trivia season with all relations - OPTIMIZED VERSION
     */
    async getRandomTriviaSeason(difficulty: string): Promise<TriviaSeason> {
        // Step 1: Fetch all season IDs only
        const seasonIds = await this.seasonRepository.find({ 
            select: ['id'] 
        });

        if (seasonIds.length === 0) {
            throw new Error('No seasons found in database');
        }

        // Step 2: Find candidates that match difficulty
        const candidates: number[] = [];
        
        for (const { id } of seasonIds) {
            try {
                // Fetch minimal season data needed for difficulty calculation
                const season = await this.seasonRepository.findOne({
                    where: { id },
                    relations: ['teams', 'games', 'awards', 'records'],
                    select: ['id', 'seasonNumber', 'theme', 'startDate'] // Only fetch fields needed for difficulty calc
                });

                if (season && this.calculateSeasonDifficulty(season) === difficulty) {
                    candidates.push(id);
                }
            } catch (error) {
                console.warn(`Error processing season ${id}:`, error);
                continue;
            }
        }

        if (candidates.length === 0) {
            throw new Error(`No seasons found for difficulty: ${difficulty}`);
        }

        // Step 3: Pick a random candidate ID
        const randomId = candidates[Math.floor(Math.random() * candidates.length)];

        // Step 4: Fetch the full season with all relations
        const randomSeason = await this.seasonRepository.findOne({
            where: { id: randomId },
            relations: ['teams', 'games', 'awards', 'records']
        });

        if (!randomSeason) {
            throw new Error(`Failed to fetch season with ID ${randomId}`);
        }
        
        const triviaSeason = {
            id: randomSeason.id,
            seasonNumber: randomSeason.seasonNumber,
            theme: randomSeason.theme,
            startDate: randomSeason.startDate,
            endDate: randomSeason.endDate,
            teams: randomSeason.teams || [],
            games: randomSeason.games || [],
            awards: randomSeason.awards || [],
            records: randomSeason.records || [],
            difficulty: difficulty as 'easy' | 'medium' | 'hard',
            hintCount: this.getHintCount(difficulty)
        };

        // Validate with Zod schema
        return TriviaSeasonSchema.parse(triviaSeason);
    }

    /**
     * Validate a user's guess
     */
    async validateGuess(type: string, id: number, guess: string): Promise<GuessResult> {
        let item: any;
        
        switch (type) {
            case 'player':
                item = await this.playerRepository.findOne({ where: { id } });
                break;
            case 'team':
                item = await this.teamRepository.findOne({ where: { id } });
                break;
            case 'season':
                item = await this.seasonRepository.findOne({ where: { id } });
                break;
            default:
                throw new Error('Invalid type');
        }

        if (!item) {
            throw new Error(`${type} not found`);
        }

        const correctAnswer = type === 'season' ? `Season ${item.seasonNumber}` : item.name;
        const isCorrect = this.normalizeString(guess) === this.normalizeString(correctAnswer);

        const result = {
            correct: isCorrect,
            answer: correctAnswer,
            message: isCorrect ? 'Correct!' : 'Try again!'
        };

        // Validate with Zod schema
        return GuessResultSchema.parse(result);
    }

    /**
     * Calculate difficulty for a player
     */
    private calculatePlayerDifficulty(player: Players): 'easy' | 'medium' | 'hard' {
        let score = 0;
        
        score += (player.teams?.length || 0) * 2; // More teams = easier
        score += (player.awards?.length || 0) * 3; // More awards = easier
        score += (player.stats?.length || 0); // More stats = easier
        score += (player.records?.length || 0) * 2; // Records = easier

        if (score >= 8) return 'easy';
        if (score >= 4) return 'medium';
        return 'hard';
    }

    /**
     * Calculate difficulty for a team
     */
    private calculateTeamDifficulty(team: Teams): 'easy' | 'medium' | 'hard' {
        let score = 0;
        
        score += (team.players?.length || 0); // More players = easier
        score += (team.games?.length || 0); // More games = easier
        // Better placement = easier
        if (team.placement && team.placement !== "Didnt make playoffs") {
            score += 3;
        }

        if (score >= 8) return 'easy';
        if (score >= 4) return 'medium';
        return 'hard';
    }

    /**
     * Calculate difficulty for a season
     */
    private calculateSeasonDifficulty(season: Seasons): 'easy' | 'medium' | 'hard' {
        let score = 0;
        
        score += (season.teams?.length || 0); // More teams = easier
        score += (season.games?.length || 0); // More games = easier
        score += (season.awards?.length || 0) * 2; // More awards = easier
        // More recent = easier
        const currentYear = new Date().getFullYear();
        const seasonYear = new Date(season.startDate).getFullYear();
        score += Math.max(0, 5 - (currentYear - seasonYear));

        if (score >= 8) return 'easy';
        if (score >= 4) return 'medium';
        return 'hard';
    }

    /**
     * Get number of hints based on difficulty
     */
    private getHintCount(difficulty: string): number {
        switch (difficulty) {
            case 'easy': return 3;
            case 'medium': return 4;
            case 'hard': return 5;
            default: return 4;
        }
    }

    /**
     * Normalize string for comparison (remove spaces, lowercase)
     */
    private normalizeString(str: string): string {
        return str.toLowerCase().replace(/\s+/g, '').trim();
    }
} 