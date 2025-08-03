import { AppDataSource } from '../../db/data-source.js';
import { Matches, MatchStatus, MatchPhase, MatchRegion } from './match.entity.js';
import { Seasons } from '../seasons/season.entity.js';
import type { CreateMatchInput, UpdateMatchInput, ImportChallongeInput } from './matches.schema.js';

const matchRepository = AppDataSource.getRepository(Matches);
const seasonRepository = AppDataSource.getRepository(Seasons);

export class MatchService {
  async getAllMatches() {
    return await matchRepository.find({
      relations: ['season'],
      order: {
        date: 'ASC'
      }
    });
  }

  async getMatchesBySeason(seasonId: number) {
    return await matchRepository.find({
      where: { season: { id: seasonId } },
      relations: ['season'],
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
      relations: ['season'],
      order: {
        date: 'ASC'
      }
    });
  }

  async getMatchById(id: number) {
    return await matchRepository.findOne({
      where: { id },
      relations: ['season']
    });
  }

  async createMatch(data: CreateMatchInput) {
    const season = await seasonRepository.findOne({ where: { id: data.seasonId } });
    if (!season) {
      throw new Error('Season not found');
    }

    // Parse set scores and calculate overall score
    const setScores = data.setScores || [];
    const overallScore = this.calculateOverallScoreFromSetScores(setScores);

    const match = matchRepository.create({
      matchNumber: data.matchNumber,
      status: data.status as MatchStatus,
      round: data.round,
      phase: data.phase as MatchPhase,
      region: data.region as MatchRegion,
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
      team1Name: data.team1Name,
      team2Name: data.team2Name,
      season
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
      if (!setScore || setScore.trim() === '') return;
      
      const scores = setScore.split('-');
      if (scores.length !== 2) return; // Invalid format
      
      const team1Score = parseInt(scores[0].trim());
      const team2Score = parseInt(scores[1].trim());
      
      if (isNaN(team1Score) || isNaN(team2Score)) return; // Invalid numbers
      
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
    console.log('Starting Challonge import with data:', data);
    
    // Extract tournament ID from Challonge URL
    const tournamentId = this.extractTournamentId(data.challongeUrl);
    if (!tournamentId) {
      throw new Error('Invalid Challonge URL');
    }
    console.log('Extracted tournament ID:', tournamentId);

    // Fetch tournament data from Challonge API
    const tournamentData = await this.fetchChallongeTournament(tournamentId);
    const matchesData = await this.fetchChallongeMatches(tournamentId);
    const participantsData = await this.fetchChallongeParticipants(tournamentId);
    console.log(`Fetched ${matchesData.length} matches and ${participantsData.length} participants from Challonge`);

    const season = await seasonRepository.findOne({ where: { id: data.seasonId } });
    if (!season) {
      throw new Error('Season not found');
    }

    const createdMatches = [];
    let matchCounter = 0; // For spacing matches within the time window

    for (const challongeMatch of matchesData) {
      // Filter by round if specified
      if (data.round && challongeMatch.round.toString() !== data.round) {
        console.log(`Skipping match ${challongeMatch.id} - round ${challongeMatch.round} doesn't match requested round ${data.round}`);
        continue;
      }

      // Get participant names from their IDs
      const player1 = participantsData.find((p: any) => p.id === challongeMatch.player1_id);
      const player2 = participantsData.find((p: any) => p.id === challongeMatch.player2_id);
      const player1Name = player1?.name || 'TBD';
      const player2Name = player2?.name || 'TBD';

      // Parse set scores from Challonge format (e.g., "25-20,20-25,25-22")
      const setScores = this.parseChallongeSetScores(challongeMatch.scores_csv);
      const overallScore = this.calculateOverallScoreFromSetScores(setScores);
      
      console.log(`Processing match ${challongeMatch.id}: ${player1Name} vs ${player2Name}`);
      console.log(`Raw scores: ${challongeMatch.scores_csv}`);
      console.log(`Parsed set scores:`, setScores);
      console.log(`Overall score: ${overallScore.team1Sets}-${overallScore.team2Sets}`);

      // Determine match date based on completion status
      const matchDate = this.calculateMatchDate(
        challongeMatch.state === 'complete',
        data.roundStartDate,
        data.roundEndDate,
        matchCounter,
        data.matchSpacingMinutes,
        challongeMatch.round
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
        team1Name: player1Name,
        team2Name: player2Name,
        season
      };
      
      console.log(`Creating match with team names: "${player1Name}" vs "${player2Name}"`);

      const match = matchRepository.create(matchData);
      const savedMatch = await matchRepository.save(match);
      createdMatches.push(savedMatch);
      
      console.log(`Created match: ${savedMatch.id} - ${savedMatch.team1Name} ${savedMatch.team1Score}-${savedMatch.team2Score} ${savedMatch.team2Name}`);
      matchCounter++;
    }

    return createdMatches;
  }

  private calculateMatchDate(
    isCompleted: boolean,
    roundStartDate: Date,
    roundEndDate: Date,
    matchIndex: number,
    spacingMinutes: number,
    roundNumber: number
  ): Date {
    if (isCompleted) {
      // For completed matches, use the round start date (they happened during the round)
      return new Date(roundStartDate);
    } else {
      // For scheduled matches, ensure different rounds are in different weeks
      const baseDate = new Date(roundStartDate);
      
      // Calculate week offset based on round number
      // Round 1: Week 0, Round 2: Week 1, Round 3: Week 2, etc.
      const weekOffset = (roundNumber - 1) * 7; // 7 days per week
      const adjustedDate = new Date(baseDate);
      adjustedDate.setDate(adjustedDate.getDate() + weekOffset);
      
      // Find the next weekend day (Friday = 5, Saturday = 6, Sunday = 0)
      const weekendDays = [5, 6, 0]; // Friday, Saturday, Sunday
      let weekendDate = new Date(adjustedDate);
      
      // Find the next available weekend day
      while (!weekendDays.includes(weekendDate.getDay())) {
        weekendDate.setDate(weekendDate.getDate() + 1);
      }
      
      // Calculate match spacing within the weekend
      const spacingMs = spacingMinutes * 60 * 1000;
      const startOffset = 30 * 60 * 1000; // 30 minutes after start
      
      // Ensure we don't exceed the round end date
      const maxOffset = Math.min(
        (roundEndDate.getTime() - weekendDate.getTime()) - (60 * 60 * 1000), // 1 hour before round end
        3 * 24 * 60 * 60 * 1000 // Max 3 days (weekend only)
      );
      
      const matchOffset = Math.min(
        startOffset + (matchIndex * spacingMs),
        maxOffset
      );
      
      return new Date(weekendDate.getTime() + matchOffset);
    }
  }

  private parseChallongeSetScores(scoresCsv: string) {
    if (!scoresCsv || scoresCsv.trim() === '') return [];

    // Split by comma and filter out empty strings
    return scoresCsv.split(',')
      .map(setScore => setScore.trim())
      .filter(setScore => setScore && setScore !== '');
  }

  private extractTournamentId(url: string): string | null {
    // Extract tournament ID from Challonge URL
    // Examples: 
    // https://challonge.com/tournament_name -> tournament_name
    // https://challonge.com/username/tournament_name -> tournament_name
    // tournament_name -> tournament_name (already extracted)
    
    // If it's already just the tournament name
    if (!url.includes('challonge.com')) {
      return url;
    }
    
    // Extract from full URL
    const match = url.match(/challonge\.com\/(?:[^\/]+\/)?([^\/\?]+)/);
    return match ? match[1] : null;
  }

  private async fetchChallongeTournament(tournamentId: string) {
    // Get Challonge API key from environment
    const apiKey = process.env.CHALLONGE_API_KEY;
    if (!apiKey) {
      throw new Error('CHALLONGE_API_KEY not found in environment. Please set the API key to use Challonge import.');
    }

    const apiUrl = `https://api.challonge.com/v1/tournaments/${tournamentId}.json?api_key=${apiKey}`;
    console.log(`Fetching tournament from: ${apiUrl.replace(apiKey, '[API_KEY_HIDDEN]')}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Challonge API error response: ${errorText}`);
      throw new Error(`Challonge API error: ${response.status} ${response.statusText} - Tournament ID: ${tournamentId}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched tournament: ${data.tournament?.name || 'Unknown'}`);
    return data.tournament;
  }

  private async fetchChallongeMatches(tournamentId: string) {
    // Get Challonge API key from environment
    const apiKey = process.env.CHALLONGE_API_KEY;
    if (!apiKey) {
      throw new Error('CHALLONGE_API_KEY not found in environment. Please set the API key to use Challonge import.');
    }

    const apiUrl = `https://api.challonge.com/v1/tournaments/${tournamentId}/matches.json?api_key=${apiKey}`;
    console.log(`Fetching matches from: ${apiUrl.replace(apiKey, '[API_KEY_HIDDEN]')}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Challonge API error response: ${errorText}`);
      throw new Error(`Challonge API error: ${response.status} ${response.statusText} - Tournament ID: ${tournamentId}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.length} matches from Challonge API`);
    
    // Transform Challonge API response to our format
    return data.map((match: any) => {
      console.log('Raw Challonge match data:', JSON.stringify(match, null, 2));
      
      // According to Challonge API docs, player names are directly in player1_name and player2_name
      const player1Name = match.match.player1_name || 'TBD';
      const player2Name = match.match.player2_name || 'TBD';
      
      console.log(`Mapped player names: ${player1Name} vs ${player2Name}`);
      
      return {
        id: match.match.id,
        number: match.match.match_number,
        round: match.match.round,
        state: match.match.state,
        player1_name: player1Name,
        player2_name: player2Name,
        scores_csv: match.match.scores_csv || ''
      };
    });
  }

  private async fetchChallongeParticipants(tournamentId: string) {
    // Get Challonge API key from environment
    const apiKey = process.env.CHALLONGE_API_KEY;
    if (!apiKey) {
      throw new Error('CHALLONGE_API_KEY not found in environment. Please set the API key to use Challonge import.');
    }

    const apiUrl = `https://api.challonge.com/v1/tournaments/${tournamentId}/participants.json?api_key=${apiKey}`;
    console.log(`Fetching participants from: ${apiUrl.replace(apiKey, '[API_KEY_HIDDEN]')}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Challonge API error response: ${errorText}`);
      throw new Error(`Challonge API error: ${response.status} ${response.statusText} - Tournament ID: ${tournamentId}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.length} participants from Challonge API`);
    
    // Transform Challonge API response to our format
    return data.map((participant: any) => ({
      id: participant.participant.id,
      name: participant.participant.name || 'Unknown'
    }));
  }

} 