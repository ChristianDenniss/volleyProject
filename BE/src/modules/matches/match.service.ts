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
    console.log(`Fetched ${matchesData.length} matches from Challonge`);

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

             // Get player names from Challonge match data
       let player1Name = challongeMatch.player1_name;
       let player2Name = challongeMatch.player2_name;
       
       // Since we're getting IDs instead of names, always fetch participants
       console.log(`Match ${challongeMatch.id} has player1_id: ${challongeMatch.player1_id}, player2_id: ${challongeMatch.player2_id}`);
       
       try {
         console.log(`About to fetch participants for tournament ${tournamentId}...`);
         const participants = await this.fetchChallongeParticipants(tournamentId);
         console.log(`Fetched ${participants.length} participants`);
         console.log(`First few participants:`, participants.slice(0, 3));
         
         // Find participant names by ID
         const player1Participant = participants.find((p: any) => p.id === challongeMatch.player1_id);
         const player2Participant = participants.find((p: any) => p.id === challongeMatch.player2_id);
         
         console.log(`Found player1 participant:`, player1Participant);
         console.log(`Found player2 participant:`, player2Participant);
         
         if (player1Participant) {
           player1Name = player1Participant.name || player1Participant.username || `Player ${challongeMatch.player1_id}`;
         } else {
           player1Name = `Player ${challongeMatch.player1_id}`;
         }
         if (player2Participant) {
           player2Name = player2Participant.name || player2Participant.username || `Player ${challongeMatch.player2_id}`;
         } else {
           player2Name = `Player ${challongeMatch.player2_id}`;
         }
         
         console.log(`Resolved names: ${player1Name} vs ${player2Name}`);
       } catch (error) {
         console.error(`Failed to fetch participant data: ${error}`);
         // Fallback to using participant IDs as names
         player1Name = `Player ${challongeMatch.player1_id}`;
         player2Name = `Player ${challongeMatch.player2_id}`;
       }

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
      
      console.log(`Round ${challongeMatch.round} match scheduled for: ${matchDate.toISOString()}`);

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
      // For completed matches, distribute them across the date range
      const totalDays = Math.floor((roundEndDate.getTime() - roundStartDate.getTime()) / (1000 * 60 * 60 * 24));
      const dayOffset = Math.min(matchIndex, totalDays);
      const matchDate = new Date(roundStartDate);
      matchDate.setDate(matchDate.getDate() + dayOffset);
      return matchDate;
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
      
      // Ensure we're scheduling in the correct week for this round
      // Round 1 should be in the first week, Round 2 in the second week, etc.
      // Calculate the start of the target week for this round
      const targetWeekStart = new Date(baseDate);
      targetWeekStart.setDate(targetWeekStart.getDate() + weekOffset);
      
      // Find the weekend of the target week
      const targetWeekend = new Date(targetWeekStart);
      while (!weekendDays.includes(targetWeekend.getDay())) {
        targetWeekend.setDate(targetWeekend.getDate() + 1);
      }
      
      // Use the target weekend date
      weekendDate = targetWeekend;
      
      // Distribute matches evenly across the 3 weekend days
      // Calculate which day of the weekend this match should be on
      const totalMatches = matchIndex + 1; // Total matches in this round
      const baseMatchesPerDay = Math.floor(totalMatches / 3); // Base matches per day
      const extraMatches = totalMatches % 3; // Extra matches to distribute
      
      // Calculate which day this match goes on
      let dayOfWeekend;
      if (matchIndex < baseMatchesPerDay * 3) {
        // Base distribution
        dayOfWeekend = Math.floor(matchIndex / baseMatchesPerDay);
      } else {
        // Extra matches - distribute them evenly
        const extraMatchIndex = matchIndex - (baseMatchesPerDay * 3);
        dayOfWeekend = extraMatchIndex;
      }
      
      // Calculate which match number this is on the specific day
      let matchNumberOnDay;
      if (matchIndex < baseMatchesPerDay * 3) {
        // Base distribution
        matchNumberOnDay = matchIndex % baseMatchesPerDay;
      } else {
        // Extra matches
        matchNumberOnDay = baseMatchesPerDay + (matchIndex - (baseMatchesPerDay * 3));
      }
      
      // Find the specific weekend day for this match
      const matchDate = new Date(weekendDate);
      matchDate.setDate(matchDate.getDate() + dayOfWeekend);
      
      // Calculate match spacing within the day
      const spacingMs = spacingMinutes * 60 * 1000;
      const startOffset = 30 * 60 * 1000; // 30 minutes after start
      
      // Calculate time offset within the day
      const timeOffset = startOffset + (matchNumberOnDay * spacingMs);
      
      // Ensure we don't exceed the round end date
      const maxOffset = Math.min(
        (roundEndDate.getTime() - matchDate.getTime()) - (60 * 60 * 1000), // 1 hour before round end
        24 * 60 * 60 * 1000 // Max 1 day per match
      );
      
      const finalOffset = Math.min(timeOffset, maxOffset);
      
      return new Date(matchDate.getTime() + finalOffset);
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
       
              // Return the raw match data with player names directly from Challonge API
        return {
          id: match.match.id,
          number: match.match.match_number,
          round: match.match.round,
          state: match.match.state,
          player1_name: match.match.player1_name,
          player2_name: match.match.player2_name,
          player1_id: match.match.player1_id,
          player2_id: match.match.player2_id,
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
     return data.map((participant: any) => {
       return {
         id: participant.participant.id,
         name: participant.participant.name,
         username: participant.participant.username
       };
     });
   }

} 