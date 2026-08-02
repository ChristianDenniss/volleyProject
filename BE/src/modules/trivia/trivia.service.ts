import { AppDataSource } from '../../db/data-source.js';
import { Players } from '../players/player.entity.js';
import { Teams } from '../teams/team.entity.js';
import { Seasons } from '../seasons/season.entity.js';
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

type TriviaDifficulty = 'easy' | 'medium' | 'hard' | 'impossible';

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

    /**
     * Pick a random trivia player; difficulty filter and random selection happen in SQL.
     */
    async getRandomTriviaPlayer(difficulty: TriviaDifficulty): Promise<TriviaPlayer> {
        const playerId = await this.pickRandomPlayerId(difficulty);

        const fullPlayer = await this.playerRepository.findOne({
            where: { id: playerId },
            relations: ['teams', 'awards', 'stats', 'records']
        });

        if (!fullPlayer) {
            throw new Error(`Failed to fetch player with ID ${playerId}`);
        }

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

        return TriviaPlayerSchema.parse(triviaPlayer);
    }

    /**
     * Pick a random trivia team; difficulty filter and random selection happen in SQL.
     */
    async getRandomTriviaTeam(difficulty: TriviaDifficulty): Promise<TriviaTeam> {
        const teamId = await this.pickRandomTeamId(difficulty);

        const fullTeam = await this.teamRepository.findOne({
            where: { id: teamId },
            relations: ['players', 'games', 'season']
        });

        if (!fullTeam) {
            throw new Error(`Failed to fetch team with ID ${teamId}`);
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

        return TriviaTeamSchema.parse(triviaTeam);
    }

    /**
     * Pick a random trivia season; difficulty filter and random selection happen in SQL.
     */
    async getRandomTriviaSeason(difficulty: TriviaDifficulty): Promise<TriviaSeason> {
        if (difficulty === 'impossible') {
            difficulty = 'hard';
        }

        const seasonId = await this.pickRandomSeasonId(difficulty);

        const fullSeason = await this.seasonRepository.findOne({
            where: { id: seasonId },
            relations: ['teams', 'games', 'awards', 'records']
        });

        if (!fullSeason) {
            throw new Error(`Failed to fetch season with ID ${seasonId}`);
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

        return TriviaSeasonSchema.parse(triviaSeason);
    }

    /**
     * Validate a user's guess
     */
    async validateGuess(type: string, id: number, guess: string): Promise<GuessResult> {
        let item: Players | Teams | Seasons | null;

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
            correctAnswer = `Season ${(item as Seasons).seasonNumber}`;
        } else if (type === 'team') {
            correctAnswer = (item as Teams).name.replace(/\s*\(s\d+\)\s*$/i, '');
        } else {
            correctAnswer = (item as Players).name;
        }
        const isCorrect = this.normalizeString(guess) === this.normalizeString(correctAnswer);

        return GuessResultSchema.parse({
            correct: isCorrect,
            answer: correctAnswer,
            message: isCorrect ? 'Correct!' : 'Try again!'
        });
    }

    private async pickRandomPlayerId(difficulty: TriviaDifficulty): Promise<number> {
        const rows: Array<{ id: number }> = await this.playerRepository.query(
            `
            WITH scored AS (
                SELECT
                    p.id,
                    (
                        COUNT(DISTINCT pt."teamsId")
                        + COUNT(DISTINCT ap."awardsId")
                        + COUNT(DISTINCT s.id)
                        + COUNT(DISTINCT r.id)
                    ) AS total_relations
                FROM players p
                LEFT JOIN players_teams_teams pt ON p.id = pt."playersId"
                LEFT JOIN awards_players_players ap ON p.id = ap."playersId"
                LEFT JOIN stats s ON p.id = s."playerId"
                LEFT JOIN records r ON p.id = r."playerId"
                GROUP BY p.id
            )
            SELECT id FROM scored
            WHERE CASE
                WHEN total_relations >= 20 THEN 'easy'
                WHEN total_relations >= 12 THEN 'medium'
                WHEN total_relations >= 6 THEN 'hard'
                ELSE 'impossible'
            END = $1
            ORDER BY RANDOM()
            LIMIT 1
            `,
            [difficulty]
        );

        if (rows.length === 0) {
            throw new Error(`No players found for difficulty: ${difficulty}`);
        }

        return Number(rows[0].id);
    }

    private async pickRandomTeamId(difficulty: TriviaDifficulty): Promise<number> {
        const rows: Array<{ id: number }> = await this.teamRepository.query(
            `
            WITH scored AS (
                SELECT
                    t.id,
                    t.placement,
                    (
                        COUNT(DISTINCT pt."playersId")
                        + COUNT(DISTINCT tg."gamesId")
                    ) AS total_relations
                FROM teams t
                LEFT JOIN players_teams_teams pt ON t.id = pt."teamsId"
                LEFT JOIN teams_games tg ON t.id = tg."teamsId"
                GROUP BY t.id, t.placement
            ),
            classified AS (
                SELECT
                    id,
                    CASE
                        WHEN LOWER(COALESCE(placement, '')) LIKE '%didn''t make playoffs%'
                          OR LOWER(COALESCE(placement, '')) LIKE '%didnt make playoffs%' THEN
                            CASE
                                WHEN total_relations >= 15 THEN 'easy'
                                WHEN total_relations >= 5 THEN 'hard'
                                ELSE 'impossible'
                            END
                        ELSE
                            CASE
                                WHEN total_relations >= 15 THEN 'easy'
                                WHEN total_relations >= 10 THEN 'medium'
                                WHEN total_relations >= 5 THEN 'hard'
                                ELSE 'impossible'
                            END
                    END AS difficulty
                FROM scored
            )
            SELECT id FROM classified
            WHERE difficulty = $1
            ORDER BY RANDOM()
            LIMIT 1
            `,
            [difficulty]
        );

        if (rows.length === 0) {
            throw new Error(`No teams found for difficulty: ${difficulty}`);
        }

        return Number(rows[0].id);
    }

    private async pickRandomSeasonId(difficulty: 'easy' | 'medium' | 'hard'): Promise<number> {
        const rows: Array<{ id: number }> = await this.seasonRepository.query(
            `
            SELECT id FROM seasons
            WHERE CASE
                WHEN "seasonNumber" >= 9 THEN 'easy'
                WHEN "seasonNumber" >= 5 THEN 'medium'
                ELSE 'hard'
            END = $1
            ORDER BY RANDOM()
            LIMIT 1
            `,
            [difficulty]
        );

        if (rows.length === 0) {
            throw new Error(`No seasons found for difficulty: ${difficulty}`);
        }

        return Number(rows[0].id);
    }

    private getHintCount(difficulty: string): number {
        switch (difficulty) {
            case 'easy': return 6;
            case 'medium': return 8;
            case 'hard': return 10;
            case 'impossible': return 12;
            default: return 8;
        }
    }

    private normalizeString(str: string): string {
        return str.toLowerCase().replace(/\s+/g, '').trim();
    }
}
