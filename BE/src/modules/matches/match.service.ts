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
      where: { seasonId: seasonId },
      relations: ['season'],
      order: {
        date: 'ASC'
      }
    });
  }

  async getMatchesByRound(seasonId: number, round: string) {
    return await matchRepository.find({
      where: { 
        seasonId: seasonId,
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

    // Find team logos by name (case-insensitive search) - same logic as Challonge import
    const team1Logo = data.team1Name ? await this.findTeamLogo(data.team1Name) : null;
    const team2Logo = data.team2Name ? await this.findTeamLogo(data.team2Name) : null;
    
    console.log(`Team logos found for manual match creation: ${data.team1Name || 'undefined'} -> ${team1Logo || 'none'}, ${data.team2Name || 'undefined'} -> ${team2Logo || 'none'}`);

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
      team1LogoUrl: team1Logo,
      team2LogoUrl: team2Logo,
      seasonId: data.seasonId,
      season
    });

    return await matchRepository.save(match);
  }

  async updateMatch(id: number, data: UpdateMatchInput) {
    const match = await matchRepository.findOne({ 
      where: { id }, 
      relations: ['season'] 
    });
    if (!match) {
      throw new Error('Match not found');
    }

    if (data.seasonId) {
      const season = await seasonRepository.findOne({ where: { id: data.seasonId } });
      if (!season) {
        throw new Error('Season not found');
      }
      match.seasonId = data.seasonId;
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

    // Update team logos if team names change
    if (data.team1Name && data.team1Name !== match.team1Name) {
      const team1Logo = await this.findTeamLogo(data.team1Name);
      match.team1LogoUrl = team1Logo;
      console.log(`Updated team1 logo for "${data.team1Name}": ${team1Logo || 'none'}`);
    }
    
    if (data.team2Name && data.team2Name !== match.team2Name) {
      const team2Logo = await this.findTeamLogo(data.team2Name);
      match.team2LogoUrl = team2Logo;
      console.log(`Updated team2 logo for "${data.team2Name}": ${team2Logo || 'none'}`);
    }

    Object.assign(match, data);
    const savedMatch = await matchRepository.save(match);
    
    // Return the match with full relations
    return await matchRepository.findOne({
      where: { id: savedMatch.id },
      relations: ['season']
    });
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

      // Skip matches without both participants assigned (future/incomplete matches)
      if (!challongeMatch.player1_id || !challongeMatch.player2_id) {
        console.log(`Skipping match ${challongeMatch.id} - missing participants (player1_id: ${challongeMatch.player1_id}, player2_id: ${challongeMatch.player2_id})`);
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
         
                 // Find participant names by ID - try multiple approaches
        let player1Participant = participants.find((p: any) => p.id === challongeMatch.player1_id);
        let player2Participant = participants.find((p: any) => p.id === challongeMatch.player2_id);
        
        // If direct ID match fails, try to map by position/seed
        if (!player1Participant && challongeMatch.player1_id) {
          // Try to find by seed/position (Challonge sometimes uses 1-based indexing)
          const player1Index = challongeMatch.player1_id - 1;
          if (player1Index >= 0 && player1Index < participants.length) {
            player1Participant = participants[player1Index];
            console.log(`Mapped player1_id ${challongeMatch.player1_id} to participant by index:`, player1Participant);
          }
        }
        
        if (!player2Participant && challongeMatch.player2_id) {
          const player2Index = challongeMatch.player2_id - 1;
          if (player2Index >= 0 && player2Index < participants.length) {
            player2Participant = participants[player2Index];
            console.log(`Mapped player2_id ${challongeMatch.player2_id} to participant by index:`, player2Participant);
          }
        }
        
        console.log(`Found player1 participant:`, player1Participant);
        console.log(`Found player2 participant:`, player2Participant);
        
        if (player1Participant) {
          player1Name = player1Participant.name || player1Participant.display_name || player1Participant.username || `Player ${challongeMatch.player1_id}`;
        } else {
          player1Name = `Player ${challongeMatch.player1_id}`;
          console.warn(`Could not resolve name for player1_id: ${challongeMatch.player1_id}`);
        }
        if (player2Participant) {
          player2Name = player2Participant.name || player2Participant.display_name || player2Participant.username || `Player ${challongeMatch.player2_id}`;
        } else {
          player2Name = `Player ${challongeMatch.player2_id}`;
          console.warn(`Could not resolve name for player2_id: ${challongeMatch.player2_id}`);
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

      // Find team logos by name (case-insensitive search)
      const team1Logo = await this.findTeamLogo(player1Name);
      const team2Logo = await this.findTeamLogo(player2Name);
      
      console.log(`Team logos found: ${player1Name} -> ${team1Logo || 'none'}, ${player2Name} -> ${team2Logo || 'none'}`);

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
        team1LogoUrl: team1Logo,
        team2LogoUrl: team2Logo,
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
    // All matches from a single round must happen in the same week
    const weekendDays = [5, 6, 0]; // Friday, Saturday, Sunday
    
    // Calculate which week this round should be on
    const roundWeekOffset = (roundNumber - 1) * 7; // Each round gets its own week
    const baseDate = new Date(roundStartDate);
    baseDate.setDate(baseDate.getDate() + roundWeekOffset);
    
    // Find the weekend for this round
    let weekendDate = new Date(baseDate);
    while (!weekendDays.includes(weekendDate.getDay())) {
      weekendDate.setDate(weekendDate.getDate() + 1);
    }
    
    // For both completed and scheduled matches, distribute across the 3 days of the weekend
    // Calculate balanced distribution: if 6 matches, then 2 per day
    const totalMatchesInRound = matchIndex + 1; // This is just for calculation, we need to know total matches in the round
    const baseMatchesPerDay = Math.floor(totalMatchesInRound / 3); // Base matches per day
    const extraMatches = totalMatchesInRound % 3; // Extra matches to distribute
    
    // Calculate which day of the weekend this match should be on
    let dayOfWeekend;
    if (matchIndex < baseMatchesPerDay * 3) {
      // Base distribution - evenly spread across all 3 days
      dayOfWeekend = Math.floor(matchIndex / baseMatchesPerDay);
    } else {
      // Extra matches - distribute them evenly starting from Friday
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
    
    if (isCompleted) {
      // For completed matches, just return the date without time offset
      return matchDate;
    } else {
      // For scheduled matches, add time spacing within the day
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

   // Function to find team logo by team name (case-insensitive search)
   private async findTeamLogo(teamName: string): Promise<string | null> {
     if (!teamName) return null;
     
     try {
       // Import the team entity and get repository
       const { Teams } = await import('../teams/team.entity.js');
       const teamRepository = AppDataSource.getRepository(Teams);
       
       // Search for team by name (case-insensitive) using ILIKE for PostgreSQL or LIKE for other databases
       const team = await teamRepository
         .createQueryBuilder('team')
         .where('LOWER(team.name) = LOWER(:teamName)', { teamName })
         .getOne();
       
       if (team && team.logoUrl) {
         console.log(`Found logo for team "${teamName}": ${team.logoUrl}`);
         return team.logoUrl;
       } else {
         console.log(`No logo found for team "${teamName}"`);
         return null;
       }
     } catch (error) {
       console.error(`Error finding logo for team "${teamName}":`, error);
       return null;
     }
   }

} 