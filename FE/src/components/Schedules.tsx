import React, { useState, useMemo } from 'react';
import { useMatches, useSeasons } from '../hooks/allFetch';
import SearchBar from './Searchbar';
import CalendarModal from './CalendarModal';
import '../styles/Schedules.css';

const Schedules: React.FC = () => {
  const { data: seasons } = useSeasons();
  const [selectedSeason, setSelectedSeason] = useState<number | undefined>();
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentDateRange, setCurrentDateRange] = useState<Date>(new Date());
  const [showLocalTime, setShowLocalTime] = useState<boolean>(false);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  // Don't auto-select any season - let user choose or show all
  // useEffect(() => {
  //   if (seasons && seasons.length > 0 && !selectedSeason) {
  //     const mostRecentSeason = seasons.reduce((prev, current) => 
  //       (current.seasonNumber > prev.seasonNumber) ? current : prev
  //     );
  //     setSelectedSeason(mostRecentSeason.id);
  //   }
  // }, [seasons, selectedSeason]);

  const { data: matches, error, loading } = useMatches(selectedSeason);

  // Get unique rounds from matches
  const uniqueRounds = useMemo(() => {
    if (!matches) return [];
    return Array.from(new Set(matches.map(match => match.round)))
      .sort((a, b) => {
        // Sort rounds numerically if possible
        const aNum = parseInt(a.replace(/\D/g, ''));
        const bNum = parseInt(b.replace(/\D/g, ''));
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return a.localeCompare(b);
      });
  }, [matches]);

  // Filter matches by round and search
  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    
         return matches.filter(match => {
       const matchesRound = !selectedRound || match.round === selectedRound;
       const matchesSearch = match.matchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (match.team1Name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                           (match.team2Name?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
       
       return matchesRound && matchesSearch;
     });
  }, [matches, selectedRound, searchQuery]);

  // Group matches by date
  const matchesByDate = useMemo(() => {
    const grouped: { [key: string]: typeof filteredMatches } = {};
    
    filteredMatches.forEach(match => {
      const dateKey = new Date(match.date).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(match);
    });
    
    return grouped;
  }, [filteredMatches]);

  // Date-based navigation (2-week spans)
  const getDateRange = () => {
    const startDate = new Date(currentDateRange);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week (Sunday)
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 13); // 2 weeks (14 days)
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();
  
  // Filter dates within the 2-week range
  const paginatedDates = Object.keys(matchesByDate).filter(dateKey => {
    const date = new Date(dateKey);
    return date >= startDate && date < endDate;
  }).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRound('');
    setCurrentDateRange(new Date());
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const toggleDateSection = (dateKey: string) => {
    setCollapsedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    return `${time} • ${dateStr}`;
  };

  const getWinningTeam = (match: any) => {
    if (match.status !== 'completed') {
      return null;
    }
    
    // Handle cases where one team has a valid score and the other is null (e.g., 2-0)
    if (match.team1Score !== null && match.team1Score !== undefined && (match.team2Score === null || match.team2Score === undefined)) {
      return 0; // Team 1 wins
    }
    if (match.team2Score !== null && match.team2Score !== undefined && (match.team1Score === null || match.team1Score === undefined)) {
      return 1; // Team 2 wins
    }
    
    // Both scores exist, compare them
    if (match.team1Score !== null && match.team1Score !== undefined && match.team2Score !== null && match.team2Score !== undefined) {
      return match.team1Score > match.team2Score ? 0 : 1;
    }
    
    return null;
  };

  const getPrimaryTag = (match: any) => {
    if (!match.tags || match.tags.length === 0) {
      return 'RVL'; // Default tag
    }
    return match.tags[0]; // Return the first tag as primary
  };

  const getTagColor = (tag: string) => {
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('rvl')) return 'blue';
    if (tagLower.includes('invitational')) return 'purple';
    if (tagLower.includes('d-league') || tagLower.includes('dleague')) return 'green';
    return 'default'; // Default dark gray
  };

  if (error) {
    return <div className="schedules-error">Error: {error}</div>;
  }

  return (
    <>
      <div className="schedules-page">
        {/* VNL-Style Header */}
        <div className="vnl-header">
        <div className="color-bars">
          <div className="bar green"></div>
          <div className="bar yellow"></div>
          <div className="bar purple"></div>
          <div className="bar blue"></div>
        </div>
        
        <div className="date-navigation">
          <button className="nav-arrow" onClick={() => {
            const newDate = new Date(currentDateRange);
            newDate.setDate(newDate.getDate() - 14); // Move back 2 weeks
            setCurrentDateRange(newDate);
          }}>
            ‹
          </button>
                  <span className="date-range">
          {`${startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`}
        </span>
          <button className="nav-arrow" onClick={() => {
            const newDate = new Date(currentDateRange);
            newDate.setDate(newDate.getDate() + 14); // Move forward 2 weeks
            setCurrentDateRange(newDate);
          }}>
            ›
          </button>
                     <button className="calendar-btn" onClick={() => setIsCalendarOpen(true)}>
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
           </button>
        </div>

        <div className="filter-row">
          <select 
            className="filter-dropdown"
            value={selectedSeason || ''}
            onChange={(e) => {
              setSelectedSeason(e.target.value ? parseInt(e.target.value) : undefined);
            }}
          >
            <option value="">All Seasons</option>
            {seasons?.map(season => (
              <option key={season.id} value={season.id}>
                Season {season.seasonNumber}
              </option>
            ))}
          </select>
          <select 
            className="filter-dropdown"
            value={selectedRound}
            onChange={(e) => {
              setSelectedRound(e.target.value);
            }}
          >
            <option value="">All Rounds</option>
            {uniqueRounds.map(round => (
              <option key={round} value={round}>
                {round}
              </option>
            ))}
          </select>
          <select className="filter-dropdown">
            <option value="" disabled>PHASE</option>
            <option selected>All</option>
            <option>Qualifiers</option>
            <option>Playoffs</option>
          </select>
          <select className="filter-dropdown">
            <option value="" disabled>REGION</option>
            <option selected>All</option>
            <option>NA</option>
            <option>EU</option>
            <option>AS</option>
            <option>SA</option>
          </select>
          <select className="filter-dropdown">
            <option value="" disabled>DIVISION</option>
            <option selected>All</option>
            <option>Invitational</option>
            <option>RVL</option>
            <option>D-League</option>
          </select>
          <button className="sync-calendar">
            SYNC TO CALENDAR
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>



             {/* Header */}
       <div className="schedules-header">
         <h1>Schedules & Results</h1>
       </div>

      {/* Filters */}
      <div className="schedules-filters">
        <div className="filters-row">
          {(searchQuery || selectedRound || selectedSeason) && (
            <button className="clear-filters-button" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>

        <div className="search-row">
          <SearchBar 
            onSearch={handleSearch} 
            placeholder="Search matches..." 
            className="schedules-search-bar"
          />
          <label className="local-time-toggle">
            <span>Show local match time</span>
            <input
              type="checkbox"
              checked={showLocalTime}
              onChange={(e) => setShowLocalTime(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* Matches List */}
      {loading ? (
        <div className="schedules-loading">
          <div className="loading-spinner"></div>
          <p>Loading matches...</p>
        </div>
      ) : (
        <div className="schedules-content">
          {paginatedDates.length === 0 ? (
            <div className="no-matches">
              <p>No matches found for the selected criteria.</p>
            </div>
          ) : (
            paginatedDates.map(dateKey => {
              const matches = matchesByDate[dateKey];
               
                             return (
                 <div key={dateKey} className="date-section">
                   <div className="date-header" onClick={() => toggleDateSection(dateKey)}>
                     <h2>{formatDate(dateKey)}</h2>
                     <span className={`collapse-arrow ${collapsedDates.has(dateKey) ? 'collapsed' : ''}`}>
                       ▼
                     </span>
                   </div>
                    
                   <div className={`matches-container ${collapsedDates.has(dateKey) ? 'collapsed' : ''}`}>
                    {matches.map(match => {
                      const winningTeam = getWinningTeam(match);
                       
                      return (
                        <div key={match.id} className="match-card">
                          <div className="match-header">
                            <div className={`gender-tag tag-${getTagColor(getPrimaryTag(match))}`}>
                              {getPrimaryTag(match)}
                            </div>
                                                         <div className="match-info">
                               <span className="match-type">
                                 {match.status === 'completed' ? 'Scheduled' : 'Scheduled'} {match.round} Match #{match.id}
                               </span>
                               <span className="venue">TBD Venue</span>
                             </div>
                            <div className="match-status">
                              <span className={`status-badge ${match.status}`}>
                                {match.status}
                              </span>
                            </div>
                          </div>
                           
                          <div className="match-teams">
                            {/* Team 1 */}
                            <div className={`team-row ${winningTeam === 0 ? 'winning-team' : ''}`}>
                                                            <div className="team-info">
                                <span className="team-name">{match.team1Name || 'TBD'}</span>
                              </div>
                              <div className="team-score">
                                {match.status === 'completed' && (
                                  <div className="score-container">
                                    <span className={`overall-score ${winningTeam === 0 ? 'winning-score' : ''}`}>
                                      {match.team1Score}
                                    </span>
                                    {(match.set1Score || match.set2Score || match.set3Score || match.set4Score || match.set5Score) && (
                                      <div className="set-scores">
                                        {[match.set1Score, match.set2Score, match.set3Score, match.set4Score, match.set5Score]
                                          .filter(score => score !== null && score !== undefined)
                                          .map((setScore: string | null | undefined, setIndex: number) => {
                                            if (!setScore) return null;
                                            const [team1Score, team2Score] = setScore.split('-').map(Number);
                                            const isWinningSet = team1Score > team2Score;
                                            return (
                                              <span 
                                                key={setIndex} 
                                                className={`set-score ${isWinningSet ? 'winning-set' : 'losing-set'}`}
                                              >
                                                {team1Score}
                                              </span>
                                            );
                                          })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Team 2 */}
                            <div className={`team-row ${winningTeam === 1 ? 'winning-team' : ''}`}>
                              <div className="team-info">
                                <span className="team-name">{match.team2Name || 'TBD'}</span>
                              </div>
                              <div className="team-score">
                                {match.status === 'completed' && (
                                  <div className="score-container">
                                    <span className={`overall-score ${winningTeam === 1 ? 'winning-score' : ''}`}>
                                      {match.team2Score}
                                    </span>
                                    {(match.set1Score || match.set2Score || match.set3Score || match.set4Score || match.set5Score) && (
                                      <div className="set-scores">
                                        {[match.set1Score, match.set2Score, match.set3Score, match.set4Score, match.set5Score]
                                          .filter(score => score !== null && score !== undefined)
                                          .map((setScore: string | null | undefined, setIndex: number) => {
                                            if (!setScore) return null;
                                            const [team1Score, team2Score] = setScore.split('-').map(Number);
                                            const isWinningSet = team2Score > team1Score;
                                            return (
                                              <span 
                                                key={setIndex} 
                                                className={`set-score ${isWinningSet ? 'winning-set' : 'losing-set'}`}
                                              >
                                                {team2Score}
                                              </span>
                                            );
                                          })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                           
                          <div className="match-details">
                            <div className="match-time">
                              <span className="time-label">Start Time</span>
                              <span className="time-value">
                                {match.date ? formatTime(match.date.toString()) : 'TBD'}
                              </span>
                            </div>
                                                         <div className="match-actions">
                               <button className="action-button watch">WATCH</button>
                               <button className="action-button shop">SHOP</button>
                             </div>
                          </div>

                                                     <div className="ranking-section">
                             <div className="ranking-header">
                               <span>LEGO VOLLEYBALL RANKING POINTS (LVR)</span>
                               <span className="dropdown-arrow">▼</span>
                             </div>
                           </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      </div>

      {/* Stay Updated Section */}
      <div className="stay-updated-section">
        <div className="stay-updated-content">
          <h2>Stay Updated with 4.2 Schedules</h2>
                     <p>
             The Roblox Volleyball League (RVL) 4.2 season brings together the most competitive teams 
             from around the world in many different exciting tournament formats. Staying updated with the upcoming 
             volleyball game schedules is essential to ensure you never miss a moment of the elite action. 
             Our platform here provides the most accurate and up-to-date information on match schedules, 
             results, and comprehensive statistics for the RVL/4.2 volleyball seasons.
           </p>
        </div>
      </div>

      {/* Calendar Modal */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        currentDateRange={currentDateRange}
        onDateRangeChange={setCurrentDateRange}
      />
    </>
  );
};

export default Schedules; 