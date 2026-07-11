import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGames, useSeasons } from '../hooks/allFetch';
import type { Game } from '../types/interfaces';
import SearchBar from './Searchbar';
import CalendarModal from './CalendarModal';
import FilterBar from './ui/FilterBar';
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

  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');

  const { data: games, error, loading } = useGames({
    page: 1,
    limit: 500,
    seasonId: selectedSeason,
    search: searchQuery || undefined,
    round: selectedRound || undefined,
    status: 'scheduled',
    phase: selectedPhase || undefined,
    region: selectedRegion || undefined,
  });

  // Get unique rounds from matches
  const uniqueRounds = useMemo(() => {
    if (!games) return [];
    return Array.from(new Set(games.map(game => game.round).filter(Boolean) as string[]))
      .sort((a, b) => {
        // Sort rounds numerically if possible
        const aNum = parseInt(a.replace(/\D/g, ''));
        const bNum = parseInt(b.replace(/\D/g, ''));
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return a.localeCompare(b);
      });
  }, [games]);

  const filteredGames = useMemo(() => {
    if (!games) return [];
    
    return games.filter(game => {
      const matchesRound = !selectedRound || game.round === selectedRound;
      const team1Name = game.teams?.[0]?.name ?? '';
      const team2Name = game.teams?.[1]?.name ?? '';
      const label = game.matchNumber ?? game.name ?? '';
      const matchesSearch = label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          team1Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          team2Name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTag || (game.tags ?? []).some(t => t.toLowerCase().includes(selectedTag.toLowerCase()));
       
      return matchesRound && matchesSearch && matchesTag;
    });
  }, [games, selectedRound, searchQuery, selectedTag]);

  const gamesByDate = useMemo(() => {
    const grouped: { [key: string]: Game[] } = {};
    
    filteredGames.forEach(game => {
      const dateKey = new Date(game.date).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(game);
    });
    
    return grouped;
  }, [filteredGames]);

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
  const paginatedDates = Object.keys(gamesByDate).filter(dateKey => {
    const date = new Date(dateKey);
    return date >= startDate && date < endDate;
  }).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRound('');
    setSelectedPhase('');
    setSelectedRegion('');
    setSelectedTag('');
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

  const getWinningTeam = (game: Game) => {
    if (game.status !== 'completed') return null;
    
    // Handle cases where one team has a valid score and the other is null (e.g., 2-0)
    if (game.team1Score !== null && game.team1Score !== undefined && (game.team2Score === null || game.team2Score === undefined)) {
      return 0;
    }
    if (game.team2Score !== null && game.team2Score !== undefined && (game.team1Score === null || game.team1Score === undefined)) {
      return 1;
    }
    
    if (game.team1Score !== null && game.team1Score !== undefined && game.team2Score !== null && game.team2Score !== undefined) {
      return game.team1Score > game.team2Score ? 0 : 1;
    }
    
    return null;
  };

  const getPrimaryTag = (game: Game) => {
    if (!game.tags || game.tags.length === 0) {
      return null;
    }
    return game.tags[0];
  };

  const getTagColor = (tag: string | null) => {
    if (!tag) return 'default';
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

        <FilterBar onReset={clearFilters}>
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
          <select className="filter-dropdown" value={selectedPhase} onChange={(e) => setSelectedPhase(e.target.value)}>
            <option value="">All Phases</option>
            <option value="qualifiers">Qualifiers</option>
            <option value="playoffs">Playoffs</option>
          </select>
          <select className="filter-dropdown" value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
            <option value="">All Regions</option>
            <option value="na">NA</option>
            <option value="eu">EU</option>
            <option value="as">AS</option>
            <option value="sa">SA</option>
          </select>
          <select className="filter-dropdown" value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)}>
            <option value="">All Divisions</option>
            <option value="Invitational">Invitational</option>
            <option value="RVL">RVL</option>
            <option value="D-League">D-League</option>
          </select>
          <button className="sync-calendar">
            SYNC TO CALENDAR
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </FilterBar>
      </div>



      {/* Filters */}
      <div className="schedules-filters">
        <div className="search-row">
          <SearchBar 
            onSearch={handleSearch} 
            placeholder="Search upcoming games..." 
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
          <p>Loading upcoming games...</p>
        </div>
      ) : (
        <div className="schedules-content">
          {paginatedDates.length === 0 ? (
            <div className="no-matches">
              <p>No upcoming games found for the selected criteria.</p>
            </div>
          ) : (
            paginatedDates.map(dateKey => {
              const dayGames = gamesByDate[dateKey];
               
              return (
                 <div key={dateKey} className="date-section">
                   <div className="date-header" onClick={() => toggleDateSection(dateKey)}>
                     <h2>{formatDate(dateKey)}</h2>
                     <span className={`collapse-arrow ${collapsedDates.has(dateKey) ? 'collapsed' : ''}`}>
                       ▼
                     </span>
                   </div>
                    
                   <div className={`matches-container ${collapsedDates.has(dateKey) ? 'collapsed' : ''}`}>
                    {dayGames.map(game => {
                      const winningTeam = getWinningTeam(game);
                      const team1 = game.teams?.[0];
                      const team2 = game.teams?.[1];
                       
                      return (
                        <div key={game.id} className="match-card">
                          <div className="match-header">
                            {getPrimaryTag(game) && (
                              <div className={`gender-tag tag-${getTagColor(getPrimaryTag(game))}`}>
                                {getPrimaryTag(game)}
                              </div>
                            )}
                            <div className="match-info">
                              <span className="match-type">
                                Upcoming {game.round ?? game.stage} · {game.matchNumber ?? game.name}
                              </span>
                              <span className="venue">TBD Venue</span>
                            </div>
                            <div className="match-status">
                              <span className={`status-badge ${game.status}`}>
                                {game.status}
                              </span>
                            </div>
                          </div>
                           
                          <div className="match-teams">
                            <div className={`team-row ${winningTeam === 0 ? 'winning-team' : ''}`}>
                              <div className="team-info">
                                {team1?.logoUrl && (
                                  <div className="team-logo-container">
                                    <img 
                                      src={team1.logoUrl} 
                                      alt={`${team1.name} logo`}
                                      className="team-logo"
                                    />
                                  </div>
                                )}
                                <span className="team-name">{team1?.name || 'TBD'}</span>
                              </div>
                              <div className="team-score">
                                {game.status === 'completed' && game.team1Score != null && (
                                  <div className="score-container">
                                    <span className={`overall-score ${winningTeam === 0 ? 'winning-score' : ''}`}>
                                      {game.team1Score}
                                    </span>
                                    {(game.set1Score || game.set2Score || game.set3Score || game.set4Score || game.set5Score) && (
                                      <div className="set-scores">
                                        {[game.set1Score, game.set2Score, game.set3Score, game.set4Score, game.set5Score]
                                          .filter(score => score !== null && score !== undefined)
                                          .map((setScore, setIndex) => {
                                            if (!setScore) return null;
                                            const [s1, s2] = setScore.split('-').map(Number);
                                            const isWinningSet = s1 > s2;
                                            return (
                                              <span key={setIndex} className={`set-score ${isWinningSet ? 'winning-set' : 'losing-set'}`}>
                                                {s1}
                                              </span>
                                            );
                                          })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className={`team-row ${winningTeam === 1 ? 'winning-team' : ''}`}>
                              <div className="team-info">
                                {team2?.logoUrl && (
                                  <div className="team-logo-container">
                                    <img 
                                      src={team2.logoUrl} 
                                      alt={`${team2.name} logo`}
                                      className="team-logo"
                                    />
                                  </div>
                                )}
                                <span className="team-name">{team2?.name || 'TBD'}</span>
                              </div>
                              <div className="team-score">
                                {game.status === 'completed' && game.team2Score != null && (
                                  <div className="score-container">
                                    <span className={`overall-score ${winningTeam === 1 ? 'winning-score' : ''}`}>
                                      {game.team2Score}
                                    </span>
                                    {(game.set1Score || game.set2Score || game.set3Score || game.set4Score || game.set5Score) && (
                                      <div className="set-scores">
                                        {[game.set1Score, game.set2Score, game.set3Score, game.set4Score, game.set5Score]
                                          .filter(score => score !== null && score !== undefined)
                                          .map((setScore, setIndex) => {
                                            if (!setScore) return null;
                                            const [s1, s2] = setScore.split('-').map(Number);
                                            const isWinningSet = s2 > s1;
                                            return (
                                              <span key={setIndex} className={`set-score ${isWinningSet ? 'winning-set' : 'losing-set'}`}>
                                                {s2}
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
                                {game.date ? formatTime(game.date.toString()) : 'TBD'}
                              </span>
                            </div>
                            <div className="match-actions">
                              {game.videoUrl ? (
                                <a href={game.videoUrl} className="action-button watch" target="_blank" rel="noreferrer">WATCH</a>
                              ) : (
                                <button className="action-button watch" disabled>WATCH</button>
                              )}
                              {game.status === 'completed' && (
                                <Link to={`/games/${game.id}`} className="action-button shop">STATS</Link>
                              )}
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