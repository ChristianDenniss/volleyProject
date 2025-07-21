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
        console.log('🎯 [TriviaService] getRandomTriviaPlayer called with difficulty:', difficulty);
        
        // Step 1: Fetch all player IDs only (minimal memory usage)
        console.log('🎯 [TriviaService] Step 1: Fetching all player IDs...');
        const playerIds = await this.playerRepository.find({ 
            select: ['id'] 
        });
        console.log('✅ [TriviaService] Found', playerIds.length, 'player IDs');

        if (playerIds.length === 0) {
            console.error('❌ [TriviaService] No players found in database');
            throw new Error('No players found in database');
        }

        // Step 2: Find candidates that match difficulty (fetch minimal data for each)
        console.log('🎯 [TriviaService] Step 2: Finding candidates for difficulty:', difficulty);
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
                    console.log('✅ [TriviaService] Player', player.name, 'matches difficulty', difficulty);
                }
            } catch (error) {
                console.warn(`❌ [TriviaService] Error processing player ${id}:`, error);
                continue; // Skip this player and continue with others
            }
        }

        console.log('✅ [TriviaService] Found', candidates.length, 'candidates for difficulty:', difficulty);

        if (candidates.length === 0) {
            console.error('❌ [TriviaService] No players found for difficulty:', difficulty);
            throw new Error(`No players found for difficulty: ${difficulty}`);
        }

        // Step 3: Pick a random candidate ID
        const randomId = candidates[Math.floor(Math.random() * candidates.length)];
        console.log('🎯 [TriviaService] Step 3: Selected random player ID:', randomId);

        // Step 4: Fetch the full player with all relations
        console.log('🎯 [TriviaService] Step 4: Fetching full player data...');
        const randomPlayer = await this.playerRepository.findOne({
            where: { id: randomId },
            relations: ['teams', 'awards', 'stats', 'records']
        });

        if (!randomPlayer) {
            console.error('❌ [TriviaService] Failed to fetch player with ID:', randomId);
            throw new Error(`Failed to fetch player with ID ${randomId}`);
        }
        
        console.log('✅ [TriviaService] Successfully fetched player:', {
            id: randomPlayer.id,
            name: randomPlayer.name,
            teams: randomPlayer.teams?.length || 0,
            awards: randomPlayer.awards?.length || 0,
            stats: randomPlayer.stats?.length || 0,
            records: randomPlayer.records?.length || 0
        });
        
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
        console.log('🎯 [TriviaService] Validating with Zod schema...');
        const validatedPlayer = TriviaPlayerSchema.parse(triviaPlayer);
        console.log('✅ [TriviaService] Validation successful, returning trivia player');
        return validatedPlayer;
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
        
        // Name complexity (harder names = harder difficulty)
        const nameLength = player.name?.length || 0;
        if (nameLength <= 5) score += 2; // Short names are easier
        else if (nameLength <= 10) score += 1; // Medium names are medium
        // Long names (10+) get no bonus = harder
        
        // Teams (more teams = more recognizable)
        score += Math.min((player.teams?.length || 0), 3); // Cap at 3 teams
        
        // Awards (more awards = more famous)
        score += Math.min((player.awards?.length || 0), 2); // Cap at 2 awards
        
        // Stats (more stats = more data available)
        score += Math.min((player.stats?.length || 0) / 2, 2); // Cap at 2 points for stats
        
        // Records (records = very famous)
        score += Math.min((player.records?.length || 0), 1); // Cap at 1 record

        console.log(`🎯 [TriviaService] Player ${player.name} difficulty calculation:`, {
            name: player.name,
            nameLength,
            teams: player.teams?.length || 0,
            awards: player.awards?.length || 0,
            stats: player.stats?.length || 0,
            records: player.records?.length || 0,
            score,
            difficulty: score >= 6 ? 'easy' : score >= 3 ? 'medium' : 'hard'
        });

        if (score >= 6) return 'easy';
        if (score >= 3) return 'medium';
        return 'hard';
    }

    /**
     * Calculate difficulty for a team
     */
    private calculateTeamDifficulty(team: Teams): 'easy' | 'medium' | 'hard' {
        let score = 0;
        
        // Name complexity (harder names = harder difficulty)
        const nameLength = team.name?.length || 0;
        if (nameLength <= 8) score += 2; // Short names are easier
        else if (nameLength <= 15) score += 1; // Medium names are medium
        // Long names (15+) get no bonus = harder
        
        // Players (more players = more recognizable)
        score += Math.min((team.players?.length || 0) / 2, 2); // Cap at 2 points for players
        
        // Games (more games = more data available)
        score += Math.min((team.games?.length || 0) / 3, 2); // Cap at 2 points for games
        
        // Placement (better placement = more memorable)
        if (team.placement && team.placement !== "Didnt make playoffs") {
            if (team.placement.includes("1st") || team.placement.includes("2nd") || team.placement.includes("3rd")) {
                score += 2; // Top 3 placements
            } else {
                score += 1; // Made playoffs but not top 3
            }
        }

        console.log(`🎯 [TriviaService] Team ${team.name} difficulty calculation:`, {
            name: team.name,
            nameLength,
            players: team.players?.length || 0,
            games: team.games?.length || 0,
            placement: team.placement,
            score,
            difficulty: score >= 6 ? 'easy' : score >= 3 ? 'medium' : 'hard'
        });

        if (score >= 6) return 'easy';
        if (score >= 3) return 'medium';
        return 'hard';
    }

    /**
     * Calculate difficulty for a season
     */
    private calculateSeasonDifficulty(season: Seasons): 'easy' | 'medium' | 'hard' {
        let score = 0;
        
        // Season number complexity (lower numbers = easier to remember)
        const seasonNum = season.seasonNumber;
        if (seasonNum <= 5) score += 3; // Very early seasons are easy
        else if (seasonNum <= 10) score += 2; // Early seasons are medium-easy
        else if (seasonNum <= 15) score += 1; // Mid seasons are medium
        // Higher season numbers (15+) get no bonus = harder
        
        // Teams (more teams = more data available)
        score += Math.min((season.teams?.length || 0) / 2, 2); // Cap at 2 points for teams
        
        // Games (more games = more data available)
        score += Math.min((season.games?.length || 0) / 5, 2); // Cap at 2 points for games
        
        // Awards (more awards = more memorable events)
        score += Math.min((season.awards?.length || 0), 1); // Cap at 1 award
        
        // Recency (more recent = easier to remember, but not as heavily weighted)
        const currentYear = new Date().getFullYear();
        const seasonYear = new Date(season.startDate).getFullYear();
        const yearsAgo = currentYear - seasonYear;
        if (yearsAgo <= 2) score += 2; // Very recent
        else if (yearsAgo <= 5) score += 1; // Recent
        // Older seasons get no bonus = harder

        console.log(`🎯 [TriviaService] Season ${seasonNum} difficulty calculation:`, {
            seasonNumber: seasonNum,
            teams: season.teams?.length || 0,
            games: season.games?.length || 0,
            awards: season.awards?.length || 0,
            yearsAgo,
            score,
            difficulty: score >= 6 ? 'easy' : score >= 3 ? 'medium' : 'hard'
        });

        if (score >= 6) return 'easy';
        if (score >= 3) return 'medium';
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