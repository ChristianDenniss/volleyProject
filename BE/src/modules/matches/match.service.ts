import { AppDataSource } from '../../db/data-source.js';
import { Matches, MatchStatus } from './match.entity.js';
import { Teams } from '../teams/team.entity.js';
import { Seasons } from '../seasons/season.entity.js';
import type { CreateMatchInput, UpdateMatchInput, ImportChallongeInput } from './matches.schema.js';

const matchRepository = AppDataSource.getRepository(Matches);
const teamRepository = AppDataSource.getRepository(Teams);
const seasonRepository = AppDataSource.getRepository(Seasons);

export class MatchService {
  async getAllMatches() {
    return await matchRepository.find({
      relations: ['season', 'teams'],
      order: {
        date: 'ASC'
      }
    });
  }

  async getMatchesBySeason(seasonId: number) {
    return await matchRepository.find({
      where: { season: { id: seasonId } },
      relations: ['season', 'teams'],
      order: {
        date: 'ASC'
      }
    });
  }

  async getMatchesByRound(seasonId: number, round: string) {
    return await matchRepository.find({
      where: { 
        season: { id: seasonId },
        round: round
      },
      relations: ['season', 'teams'],
      order: {
        date: 'ASC'
      }
    });
  }

  async getMatchById(id: number) {
    return await matchRepository.findOne({
      where: { id },
      relations: ['season', 'teams']
    });
  }

  async createMatch(data: CreateMatchInput) {
    const season = await seasonRepository.findOne({ where: { id: data.seasonId } });
    if (!season) {
      throw new Error('Season not found');
    }

    const teams = await teamRepository.findByIds(data.teamIds);
    if (teams.length !== 2) {
      throw new Error('Exactly 2 teams are required for a match');
    }

    // Parse set scores and calculate overall score
    const setScores = data.setScores || [];
    const overallScore = this.calculateOverallScoreFromSetScores(setScores);

    const match = matchRepository.create({
      matchNumber: data.matchNumber,
      status: data.status as MatchStatus,
      round: data.round,
      date: data.date,
      team1Score: data.team1Score || overallScore.team1Sets,
      team2Score: data.team2Score || overallScore.team2Sets,
      set1Score: setScores[0] || null,
      set2Score: setScores[1] || null,
      set3Score: setScores[2] || null,
      set4Score: setScores[3] || null,
      set5Score: setScores[4] || null,
      challongeMatchId: data.challongeMatchId,
      challongeTournamentId: data.challongeTournamentId,
      challongeRound: data.challongeRound,
      season,
      teams
    });

    return await matchRepository.save(match);
  }

  async updateMatch(id: number, data: UpdateMatchInput) {
    const match = await matchRepository.findOne({ where: { id } });
    if (!match) {
      throw new Error('Match not found');
    }

    if (data.seasonId) {
      const season = await seasonRepository.findOne({ where: { id: data.seasonId } });
      if (!season) {
        throw new Error('Season not found');
      }
      match.season = season;
    }

    if (data.teamIds) {
      const teams = await teamRepository.findByIds(data.teamIds);
      if (teams.length !== 2) {
        throw new Error('Exactly 2 teams are required for a match');
      }
      match.teams = teams;
    }

    // Update set scores if provided
    if (data.setScores) {
      const setScores = data.setScores;
      match.set1Score = setScores[0] || null;
      match.set2Score = setScores[1] || null;
      match.set3Score = setScores[2] || null;
      match.set4Score = setScores[3] || null;
      match.set5Score = setScores[4] || null;

      // Calculate overall match score from set scores
      const overallScore = this.calculateOverallScoreFromSetScores(setScores);
      match.team1Score = overallScore.team1Sets;
      match.team2Score = overallScore.team2Sets;
    }

    Object.assign(match, data);
    return await matchRepository.save(match);
  }

  async deleteMatch(id: number) {
    const match = await matchRepository.findOne({ where: { id } });
    if (!match) {
      throw new Error('Match not found');
    }

    await matchRepository.remove(match);
    return { success: true };
  }

  private calculateOverallScoreFromSetScores(setScores: string[]) {
    let team1Sets = 0;
    let team2Sets = 0;

    setScores.forEach(setScore => {
      if (!setScore) return;
      
      const [team1Score, team2Score] = setScore.split('-').map(Number);
      if (team1Score > team2Score) {
        team1Sets++;
      } else if (team2Score > team1Score) {
        team2Sets++;
      }
      // If scores are equal, it's a tie and no set is awarded
    });

    return { team1Sets, team2Sets };
  }

  async importFromChallonge(data: ImportChallongeInput) {
    // Extract tournament ID from Challonge URL
    const tournamentId = this.extractTournamentId(data.challongeUrl);
    if (!tournamentId) {
      throw new Error('Invalid Challonge URL');
    }

    // Fetch tournament data from Challonge API
    const tournamentData = await this.fetchChallongeTournament(tournamentId);
    const matchesData = await this.fetchChallongeMatches(tournamentId);

    const season = await seasonRepository.findOne({ where: { id: data.seasonId } });
    if (!season) {
      throw new Error('Season not found');
    }

    const createdMatches = [];
    let matchCounter = 0; // For spacing matches within the time window

    for (const challongeMatch of matchesData) {
      // Filter by round if specified
      if (data.round && challongeMatch.round.toString() !== data.round) {
        continue;
      }

      // Find or create teams based on Challonge participant names
      const team1 = await this.findOrCreateTeam(challongeMatch.player1_name, season);
      const team2 = await this.findOrCreateTeam(challongeMatch.player2_name, season);

      // Parse set scores from Challonge format (e.g., "25-20,20-25,25-22")
      const setScores = this.parseChallongeSetScores(challongeMatch.scores_csv);
      const overallScore = this.calculateOverallScoreFromSetScores(setScores);

      // Determine match date based on completion status
      const matchDate = this.calculateMatchDate(
        challongeMatch.state === 'complete',
        data.roundStartDate,
        data.roundEndDate,
        matchCounter,
        data.matchSpacingMinutes
      );

      // Create match
      const matchData = {
        matchNumber: `Round ${challongeMatch.round} - Match ${challongeMatch.number}`,
        status: challongeMatch.state === 'complete' ? MatchStatus.COMPLETED : MatchStatus.SCHEDULED,
        round: `Round ${challongeMatch.round}`,
        date: matchDate, // Uses calculated matchDate
        team1Score: overallScore.team1Sets,
        team2Score: overallScore.team2Sets,
        set1Score: setScores[0] || null,
        set2Score: setScores[1] || null,
        set3Score: setScores[2] || null,
        set4Score: setScores[3] || null,
        set5Score: setScores[4] || null,
        challongeMatchId: challongeMatch.id.toString(),
        challongeTournamentId: tournamentId,
        challongeRound: challongeMatch.round,
        tags: data.tags || [], // Apply tags from import data
        season,
        teams: [team1, team2]
      };

      const match = matchRepository.create(matchData);
      const savedMatch = await matchRepository.save(match);
      createdMatches.push(savedMatch);
      
      matchCounter++;
    }

    return createdMatches;
  }

  private calculateMatchDate(
    isCompleted: boolean,
    roundStartDate: Date,
    roundEndDate: Date,
    matchIndex: number,
    spacingMinutes: number
  ): Date {
    if (isCompleted) {
      // For completed matches, use the round start date (they happened during the round)
      return new Date(roundStartDate);
    } else {
      // For scheduled matches, space them out within the round time window
      const totalDuration = roundEndDate.getTime() - roundStartDate.getTime();
      const spacingMs = spacingMinutes * 60 * 1000;
      
      // Calculate a reasonable time within the window
      // Start matches 30 minutes after round start, space them out, but don't go too close to end
      const startOffset = 30 * 60 * 1000; // 30 minutes after round start
      const maxOffset = totalDuration - (60 * 60 * 1000); // 1 hour before round end
      
      const matchOffset = Math.min(
        startOffset + (matchIndex * spacingMs),
        maxOffset
      );
      
      return new Date(roundStartDate.getTime() + matchOffset);
    }
  }

  private parseChallongeSetScores(scoresCsv: string) {
    if (!scoresCsv) return [];

    return scoresCsv.split(',').map(setScore => setScore.trim());
  }

  private extractTournamentId(url: string): string | null {
    // Extract tournament ID from Challonge URL
    // Example: https://challonge.com/tournament_name -> tournament_name
    const match = url.match(/challonge\.com\/([^\/]+)/);
    return match ? match[1] : null;
  }

  private async fetchChallongeTournament(tournamentId: string) {
    // This would need Challonge API integration
    // For now, return mock data
    return {
      id: tournamentId,
      name: 'Tournament Name'
    };
  }

  private async fetchChallongeMatches(tournamentId: string) {
    // This would need Challonge API integration
    // For now, return mock data based on the Swiss bracket format with set scores
    return [
      {
        id: 1,
        number: 1,
        round: 1,
        state: 'complete',
        player1_name: 'AS Roma',
        player2_name: 'Inter Milan',
        scores_csv: '25-20,20-25,25-22' // Set scores: 25-20, 20-25, 25-22
      },
      {
        id: 2,
        number: 2,
        round: 1,
        state: 'complete',
        player1_name: 'Benfica',
        player2_name: 'Real Madrid',
        scores_csv: '22-25,25-23,25-20' // Set scores: 22-25, 25-23, 25-20
      }
      // Add more matches as needed
    ];
  }

  private async findOrCreateTeam(teamName: string, season: any) {
    // Try to find existing team
    let team = await teamRepository.findOne({
      where: { name: teamName, season: { id: season.id } }
    });

    // Create team if it doesn't exist
    if (!team) {
      team = teamRepository.create({
        name: teamName,
        season,
        placement: 'TBD'
      });
      team = await teamRepository.save(team);
    }

    return team;
  }
} 