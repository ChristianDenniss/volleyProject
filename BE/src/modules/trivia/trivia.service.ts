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
    private playerRepository = AppDataSource.getRepository(Players);
    private teamRepository = AppDataSource.getRepository(Teams);
    private seasonRepository = AppDataSource.getRepository(Seasons);
    private awardRepository = AppDataSource.getRepository(Awards);
    private statRepository = AppDataSource.getRepository(Stats);

    /**
     * Get a random trivia player with all relations
     */
    async getRandomTriviaPlayer(difficulty: string): Promise<TriviaPlayer> {
        const players = await this.playerRepository.find({
            relations: ['teams', 'awards', 'stats', 'records']
        });

        // Filter by difficulty
        const filteredPlayers = players.filter(player => 
            this.calculatePlayerDifficulty(player) === difficulty
        );

        if (filteredPlayers.length === 0) {
            throw new Error(`No players found for difficulty: ${difficulty}`);
        }

        // Select random player
        const randomPlayer = filteredPlayers[Math.floor(Math.random() * filteredPlayers.length)];
        
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
     * Get a random trivia team with all relations
     */
    async getRandomTriviaTeam(difficulty: string): Promise<TriviaTeam> {
        const teams = await this.teamRepository.find({
            relations: ['players', 'games', 'season']
        });

        // Filter by difficulty
        const filteredTeams = teams.filter(team => 
            this.calculateTeamDifficulty(team) === difficulty
        );

        if (filteredTeams.length === 0) {
            throw new Error(`No teams found for difficulty: ${difficulty}`);
        }

        // Select random team
        const randomTeam = filteredTeams[Math.floor(Math.random() * filteredTeams.length)];
        
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
     * Get a random trivia season with all relations
     */
    async getRandomTriviaSeason(difficulty: string): Promise<TriviaSeason> {
        const seasons = await this.seasonRepository.find({
            relations: ['teams', 'games', 'awards', 'records']
        });

        // Filter by difficulty
        const filteredSeasons = seasons.filter(season => 
            this.calculateSeasonDifficulty(season) === difficulty
        );

        if (filteredSeasons.length === 0) {
            throw new Error(`No seasons found for difficulty: ${difficulty}`);
        }

        // Select random season
        const randomSeason = filteredSeasons[Math.floor(Math.random() * filteredSeasons.length)];
        
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