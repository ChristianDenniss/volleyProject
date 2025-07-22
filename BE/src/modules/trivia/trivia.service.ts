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
     * Get a random trivia player with all relations - ULTRA OPTIMIZED VERSION
     */
    async getRandomTriviaPlayer(difficulty: 'easy' | 'medium' | 'hard' | 'impossible'): Promise<TriviaPlayer> {
        console.log('🎯 [TriviaService] getRandomTriviaPlayer called with difficulty:', difficulty);
        
        // Step 1: Use raw SQL to get difficulty scores efficiently
        console.log('🎯 [TriviaService] Step 1: Calculating difficulty scores with raw SQL...');
        
        const difficultyQuery = `
            SELECT 
                p.id,
                p.name,
                p.position,
                LENGTH(p.name) as name_length,
                COUNT(DISTINCT pt."teamsId") as team_count,
                COUNT(DISTINCT ap."awardsId") as award_count,
                COUNT(DISTINCT s.id) as stat_count,
                COUNT(DISTINCT r.id) as record_count
            FROM players p
            LEFT JOIN players_teams_teams pt ON p.id = pt."playersId"
            LEFT JOIN awards_players_players ap ON p.id = ap."playersId"
            LEFT JOIN stats s ON p.id = s."playerId"
            LEFT JOIN records r ON p.id = r."playerId"
            GROUP BY p.id, p.name, p.position
        `;
        
        const playersWithScores = await this.playerRepository.query(difficultyQuery);
        console.log('✅ [TriviaService] Calculated scores for', playersWithScores.length, 'players');
        
        // Step 2: Filter by difficulty using the scoring algorithm
        const candidates = playersWithScores.filter((player: any) => {
            try {
                const score = this.calculatePlayerDifficultyFromScores(player);
                return score === difficulty;
            } catch (error) {
                console.warn(`❌ [TriviaService] Error calculating difficulty for player ${player.id}:`, error);
                return false;
            }
        });
        
        console.log('✅ [TriviaService] Found', candidates.length, 'candidates for difficulty:', difficulty);
        
        if (candidates.length === 0) {
            console.error('❌ [TriviaService] No players found for difficulty:', difficulty);
            throw new Error(`No players found for difficulty: ${difficulty}`);
        }
        
        // Step 3: Pick a random candidate
        const randomPlayer = candidates[Math.floor(Math.random() * candidates.length)];
        console.log('🎯 [TriviaService] Step 3: Selected random player:', randomPlayer.name);
        
        // Step 4: Fetch the full player with all relations (only for the selected one)
        console.log('🎯 [TriviaService] Step 4: Fetching full player data...');
        const fullPlayer = await this.playerRepository.findOne({
            where: { id: randomPlayer.id },
            relations: ['teams', 'awards', 'stats', 'records']
        });
        
        if (!fullPlayer) {
            console.error('❌ [TriviaService] Failed to fetch player with ID:', randomPlayer.id);
            throw new Error(`Failed to fetch player with ID ${randomPlayer.id}`);
        }
        
        console.log('✅ [TriviaService] Successfully fetched player:', {
            id: fullPlayer.id,
            name: fullPlayer.name,
            teams: fullPlayer.teams?.length || 0,
            awards: fullPlayer.awards?.length || 0,
            stats: fullPlayer.stats?.length || 0,
            records: fullPlayer.records?.length || 0
        });
        
        const triviaPlayer = {
            id: fullPlayer.id,
            name: fullPlayer.name,
            position: fullPlayer.position,
            teams: fullPlayer.teams || [],
            awards: fullPlayer.awards || [],
            stats: fullPlayer.stats || [],
            records: fullPlayer.records || [],
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
     * Get a random trivia team with all relations - ULTRA OPTIMIZED VERSION
     */
    async getRandomTriviaTeam(difficulty: 'easy' | 'medium' | 'hard' | 'impossible'): Promise<TriviaTeam> {
        console.log('🎯 [TriviaService] getRandomTriviaTeam called with difficulty:', difficulty);
        
        // Step 1: Use raw SQL to get difficulty scores efficiently
        console.log('🎯 [TriviaService] Step 1: Calculating difficulty scores with raw SQL...');
        
        const difficultyQuery = `
            SELECT 
                t.id,
                t.name,
                t.placement,
                LENGTH(t.name) as name_length,
                COUNT(DISTINCT pt."playersId") as player_count,
                COUNT(DISTINCT tg."gamesId") as game_count
            FROM teams t
            LEFT JOIN players_teams_teams pt ON t.id = pt."teamsId"
            LEFT JOIN teams_games tg ON t.id = tg."teamsId"
            GROUP BY t.id, t.name, t.placement
        `;
        
        const teamsWithScores = await this.teamRepository.query(difficultyQuery);
        console.log('✅ [TriviaService] Calculated scores for', teamsWithScores.length, 'teams');
        
        // Step 2: Filter by difficulty using the scoring algorithm
        const candidates = teamsWithScores.filter((team: any) => {
            try {
                const score = this.calculateTeamDifficultyFromScores(team);
                return score === difficulty;
            } catch (error) {
                console.warn(`❌ [TriviaService] Error calculating difficulty for team ${team.id}:`, error);
                return false;
            }
        });
        
        console.log('✅ [TriviaService] Found', candidates.length, 'candidates for difficulty:', difficulty);
        
        if (candidates.length === 0) {
            console.error('❌ [TriviaService] No teams found for difficulty:', difficulty);
            throw new Error(`No teams found for difficulty: ${difficulty}`);
        }
        
        // Step 3: Pick a random candidate
        const randomTeam = candidates[Math.floor(Math.random() * candidates.length)];
        console.log('🎯 [TriviaService] Step 3: Selected random team:', randomTeam.name);
        
        // Step 4: Fetch the full team with all relations (only for the selected one)
        console.log('🎯 [TriviaService] Step 4: Fetching full team data...');
        const fullTeam = await this.teamRepository.findOne({
            where: { id: randomTeam.id },
            relations: ['players', 'games', 'season']
        });
        
        if (!fullTeam) {
            console.error('❌ [TriviaService] Failed to fetch team with ID:', randomTeam.id);
            throw new Error(`Failed to fetch team with ID ${randomTeam.id}`);
        }
        
        const triviaTeam = {
            id: fullTeam.id,
            name: fullTeam.name,
            placement: fullTeam.placement,
            players: fullTeam.players || [],
            games: fullTeam.games || [],
            season: fullTeam.season,
            difficulty: difficulty as 'easy' | 'medium' | 'hard',
            hintCount: this.getHintCount(difficulty)
        };

        // Validate with Zod schema
        return TriviaTeamSchema.parse(triviaTeam);
    }

    /**
     * Get a random trivia season with all relations - ULTRA FAST VERSION
     */
    async getRandomTriviaSeason(difficulty: 'easy' | 'medium' | 'hard' | 'impossible'): Promise<TriviaSeason> {
        console.log('🎯 [TriviaService] getRandomTriviaSeason called with difficulty:', difficulty);
        
        // Seasons don't have impossible difficulty - convert to hard
        if (difficulty === 'impossible') {
            console.log('🎯 [TriviaService] Converting impossible to hard for seasons');
            difficulty = 'hard';
        }
        
        // Step 1: Get ONLY season numbers (super fast)
        console.log('🎯 [TriviaService] Step 1: Fetching season numbers only...');
        const seasonNumbers = await this.seasonRepository.find({
            select: ['id', 'seasonNumber']
        });
        
        console.log('✅ [TriviaService] Found', seasonNumbers.length, 'seasons');
        
        // Step 2: Filter by difficulty using simple season number logic
        const candidates = seasonNumbers.filter((season) => {
            const seasonNum = season.seasonNumber;
            let seasonDifficulty: 'easy' | 'medium' | 'hard';
            
            if (seasonNum >= 9) seasonDifficulty = 'easy';      // Seasons 14-9
            else if (seasonNum >= 5) seasonDifficulty = 'medium'; // Seasons 8-5
            else seasonDifficulty = 'hard';                      // Seasons 4-1
            
            console.log(`🎯 [TriviaService] Season ${seasonNum} -> ${seasonDifficulty}`);
            return seasonDifficulty === difficulty;
        });
        
        console.log('✅ [TriviaService] Found', candidates.length, 'candidates for difficulty:', difficulty);
        
        if (candidates.length === 0) {
            console.error('❌ [TriviaService] No seasons found for difficulty:', difficulty);
            throw new Error(`No seasons found for difficulty: ${difficulty}`);
        }
        
        // Step 3: Pick a random candidate
        const randomSeasonId = candidates[Math.floor(Math.random() * candidates.length)].id;
        console.log('🎯 [TriviaService] Step 3: Selected random season ID:', randomSeasonId);
        
        // Step 4: Fetch ONLY the selected season with all relations
        console.log('🎯 [TriviaService] Step 4: Fetching full season data...');
        const fullSeason = await this.seasonRepository.findOne({
            where: { id: randomSeasonId },
            relations: ['teams', 'games', 'awards', 'records']
        });
        
        if (!fullSeason) {
            console.error('❌ [TriviaService] Failed to fetch season with ID:', randomSeasonId);
            throw new Error(`Failed to fetch season with ID ${randomSeasonId}`);
        }
        
        const triviaSeason = {
            id: fullSeason.id,
            seasonNumber: fullSeason.seasonNumber,
            theme: fullSeason.theme,
            startDate: fullSeason.startDate,
            endDate: fullSeason.endDate,
            teams: fullSeason.teams || [],
            games: fullSeason.games || [],
            awards: fullSeason.awards || [],
            records: fullSeason.records || [],
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

        let correctAnswer: string;
        if (type === 'season') {
            correctAnswer = `Season ${item.seasonNumber}`;
        } else if (type === 'team') {
            // Remove season suffix like "(s5)" from team names for guessing
            correctAnswer = item.name.replace(/\s*\(s\d+\)\s*$/i, '');
        } else {
            correctAnswer = item.name;
        }
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
     * Calculate difficulty for a player from raw SQL scores
     */
    private calculatePlayerDifficultyFromScores(player: any): 'easy' | 'medium' | 'hard' | 'impossible' {
        // Convert string counts to numbers and sum them
        const teamCount = parseInt(player.team_count) || 0;
        const awardCount = parseInt(player.award_count) || 0;
        const statCount = parseInt(player.stat_count) || 0;
        const recordCount = parseInt(player.record_count) || 0;
        const totalRelations = teamCount + awardCount + statCount + recordCount;
        
        console.log(`🎯 [TriviaService] Player ${player.name} difficulty calculation:`, {
            name: player.name,
            team_count: teamCount,
            award_count: awardCount,
            stat_count: statCount,
            record_count: recordCount,
            totalRelations,
            difficulty: totalRelations >= 20 ? 'easy' : totalRelations >= 12 ? 'medium' : totalRelations >= 6 ? 'hard' : 'impossible'
        });

        if (totalRelations >= 20) return 'easy';
        if (totalRelations >= 12) return 'medium';
        if (totalRelations >= 6) return 'hard';
        return 'impossible';
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
     * Calculate difficulty for a team from raw SQL scores
     */
    private calculateTeamDifficultyFromScores(team: any): 'easy' | 'medium' | 'hard' | 'impossible' {
        // Convert string counts to numbers and sum them
        const playerCount = parseInt(team.player_count) || 0;
        const gameCount = parseInt(team.game_count) || 0;
        const totalRelations = playerCount + gameCount;
        
        console.log(`🎯 [TriviaService] Team ${team.name} difficulty calculation:`, {
            name: team.name,
            player_count: playerCount,
            game_count: gameCount,
            totalRelations,
            difficulty: totalRelations >= 15 ? 'easy' : totalRelations >= 10 ? 'medium' : totalRelations >= 5 ? 'hard' : 'impossible'
        });

        if (totalRelations >= 20) return 'easy';
        if (totalRelations >= 15) return 'medium';
        if (totalRelations >= 10) return 'hard';
        return 'impossible';
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
     * Calculate difficulty for a season from raw SQL scores
     */
    private calculateSeasonDifficultyFromScores(season: any): 'easy' | 'medium' | 'hard' {
        const seasonNum = parseInt(season.seasonNumber) || 0;
        
        console.log(`🎯 [TriviaService] Season ${seasonNum} difficulty calculation:`, {
            seasonNumber: seasonNum,
            difficulty: seasonNum >= 9 ? 'easy' : seasonNum >= 5 ? 'medium' : 'hard'
        });

        // Simple season number-based difficulty
        if (seasonNum >= 9) return 'easy';      // Seasons 14-9
        if (seasonNum >= 5) return 'medium';    // Seasons 8-5
        return 'hard';                          // Seasons 4-1
    }

    /**
     * Get number of hints based on difficulty
     */
    private getHintCount(difficulty: string): number {
        switch (difficulty) {
            case 'easy': return 6;
            case 'medium': return 8;
            case 'hard': return 10;
            case 'impossible': return 12;
            default: return 8;
        }
    }

    /**
     * Normalize string for comparison (remove spaces, lowercase)
     */
    private normalizeString(str: string): string {
        return str.toLowerCase().replace(/\s+/g, '').trim();
    }
} 