import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGames, useSeasons } from '../hooks/allFetch';
import type { Game } from '../types/interfaces';
import SearchBar from './Searchbar';
import CalendarModal from './CalendarModal';
import FilterBar from './ui/FilterBar';
import { formatGameStage } from '../utils/gameLabels';
import { isSafeExternalUrl } from '../utils/url';
import { useRegion } from '../context/regionContext';
import SEO from './SEO';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

const schedulesPage =
  "w-full mx-auto p-[6rem] [font-family:-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif] " +
  "overflow-x-hidden box-border [&_*]:box-border [&_*]:max-w-full " +
  "upto-md:pt-[15px] upto-md:px-[10px] upto-md:pb-0";

const vnlHeader =
  "bg-bg border border-border rounded-lg overflow-hidden mb-[20px] shadow-sm " +
  "[&_.ui-filter-bar]:p-[1rem_1.25rem_1.25rem] [&_.ui-filter-bar]:mb-0! [&_.ui-filter-bar]:gap-[0.75rem]!";

const colorBars = "flex h-[4px]";

const colorBar = "flex-1 h-full";

const dateNavigation =
  "flex items-center justify-center py-[16px] px-[20px] gap-[16px] border-b border-border";

const navArrow =
  "bg-transparent border-none text-[18px] text-text-muted-alt cursor-pointer p-[8px] rounded-sm " +
  "transition-all duration-200 hover:bg-bg-muted hover:text-text";

const dateRange = "font-semibold text-brand-primary text-[1.1rem]";

const calendarBtn =
  "bg-transparent border-none text-[16px] cursor-pointer p-[8px] rounded-sm " +
  "transition-all duration-200 text-brand-primary hover:bg-bg-muted";

const filterDropdown =
  "filter-dropdown text-[0.875rem] py-[8px] px-[16px] pr-[32px] border border-brand-primary " +
  "rounded-sm bg-brand-primary bg-[image:var(--chevron-down-white)] bg-no-repeat " +
  "bg-[right_8px_center] bg-[length:20px] text-text-on-brand cursor-pointer min-w-[100px] " +
  "appearance-none shadow-none " +
  "transition-[background-color,border-color] duration-200 ease-[ease] " +
  "hover:bg-brand-primary-hover hover:border-brand-primary-hover " +
  "focus:bg-brand-primary-hover focus:border-brand-primary-hover focus:outline-none " +
  "focus:shadow-[0_0_0_2px_var(--color-focus-ring)]";

const syncCalendar =
  "bg-brand-primary text-text-on-brand border border-brand-primary py-[8px] px-[16px] " +
  "rounded-sm text-[0.875rem] font-medium cursor-pointer ml-auto inline-flex items-center gap-[0.5rem] " +
  "transition-[background-color,border-color] duration-200 " +
  "hover:bg-brand-primary-hover hover:border-brand-primary-hover";

const schedulesFilters = "pt-0 px-0 pb-[0.75rem] mb-[0.75rem]";

const searchRow =
  "flex justify-between items-center gap-[0.75rem] upto-md:flex-col upto-md:items-stretch";

const schedulesSearchBar = "flex-1 max-w-[400px] upto-md:max-w-none";

const localTimeToggle =
  "flex items-center gap-[8px] cursor-pointer text-[0.875rem] text-[#374151]";

const toggleSlider =
  "relative w-[40px] h-[20px] bg-[#d1d5db] rounded-[10px] " +
  "transition-[background-color] duration-200 " +
  "before:content-[''] before:absolute before:top-[2px] before:left-[2px] " +
  "before:w-[16px] before:h-[16px] before:bg-white before:rounded-full " +
  "before:transition-transform before:duration-200 " +
  "peer-checked:bg-brand-primary peer-checked:before:[transform:translateX(20px)]";

const schedulesLoading = "text-center py-[60px] px-[20px]";

const loadingSpinner =
  "w-[40px] h-[40px] border-4 border-[#f3f3f3] border-t-brand-primary rounded-full " +
  "animate-spin mx-auto mb-[20px]";

const schedulesLoadingP = "text-[#666] text-[1.1rem]";

const schedulesError = "text-center py-[40px] px-[20px] text-[#dc3545] text-[1.1rem]";

const schedulesContent = "flex flex-col gap-[30px] pb-[60px]";

const noMatches = "text-center py-[60px] px-[20px] text-[#666] text-[1.1rem]";

const dateSection = "bg-white rounded-[12px] overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.1)]";

const dateHeader =
  "bg-brand-primary text-white py-[15px] px-[20px] text-center cursor-pointer " +
  "flex justify-between items-center transition-[background-color] duration-200 " +
  "hover:bg-brand-primary-hover " +
  "[&_h2]:m-0 [&_h2]:text-[1.3rem] [&_h2]:font-semibold";

const collapseArrow =
  "text-[1rem] transition-transform duration-300 ease-[ease]";

const collapseArrowCollapsed = `${collapseArrow} [transform:rotate(-90deg)]`;

const matchesContainer =
  "p-[10px] flex flex-col gap-[8px] transition-[max-height,opacity] duration-300 ease-[ease] overflow-hidden";

const matchesContainerCollapsed =
  "py-0 px-[20px] flex flex-col gap-[8px] transition-[max-height,opacity] duration-300 ease-[ease] " +
  "overflow-hidden max-h-0 opacity-0";

/* Second .match-card / .match-header / .match-details / .action-button win.
   Mobile flex-direction on header/details is not overridden by the later
   desktop rules (those do not set flex-direction). */
const matchCard =
  "bg-white border border-[#e5e7eb] rounded-[8px] mb-[16px] overflow-hidden " +
  "shadow-[0_1px_3px_rgba(0,0,0,0.1)]";

const matchCardClickable =
  "cursor-pointer transition-[box-shadow,transform] duration-200 ease-[ease] " +
  "hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:[transform:translateY(-1px)] " +
  "focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2";

const matchHeader =
  "flex items-start py-[16px] px-[16px] bg-[#f9fafb] border-b border-[#e5e7eb] gap-[12px] " +
  "upto-md:flex-col";

const matchTags =
  "grid grid-rows-[auto_auto] grid-flow-col gap-[6px] max-w-[45%] content-start";

const genderTag =
  "text-white py-[4px] px-[8px] rounded-[4px] text-[0.75rem] font-semibold uppercase " +
  "max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap";

const TAG_BG: Record<string, string> = {
  default: "bg-[#1f2937]",
  blue: "bg-brand-primary",
  purple: "bg-[#8b5cf6]",
  green: "bg-[#059669]",
  red: "bg-[#dc2626]",
  orange: "bg-[#d97706]",
};

const matchInfo = "flex-1 flex flex-col gap-[4px] self-center";

const matchType = "font-semibold text-[#1f2937] text-[0.875rem]";

const venue = "text-[0.75rem] text-[#6b7280]";

const statusBadge =
  "py-[4px] px-[12px] rounded-[20px] text-[0.8rem] font-semibold uppercase";

const statusScheduled = `${statusBadge} bg-[#fff3cd] text-[#856404]`;

const statusCompleted = `${statusBadge} bg-[#d4edda] text-[#155724]`;

const matchTeams = "flex flex-col gap-[4px] mb-[6px]";

const teamRow =
  "flex justify-between items-center py-[2px] px-[1.5rem] border-b border-[#e5e7eb] " +
  "transition-all duration-200 ease-[ease] last:border-b-0";

const teamRowWinning =
  `${teamRow} bg-[linear-gradient(135deg,#f0fdf4_0%,#dcfce7_100%)] ` +
  "border-l-4 border-l-[#a1d5b4] shadow-[0_2px_8px_rgba(34,197,94,0.15)]";

const teamInfo = "flex items-center gap-[6px] flex-1";

const teamLogo =
  "w-[32px] h-[32px] rounded-full object-cover border-2 border-[#e5e7eb]";

const teamLogoWinning =
  "w-[32px] h-[32px] rounded-full object-cover border-2 border-[#f59e0b] " +
  "shadow-[0_0_8px_rgba(245,158,11,0.3)]";

const teamLogoContainer = "flex items-center gap-[8px]";

const teamNameLink =
  "font-semibold text-[1rem] no-underline hover:text-brand-primary hover:underline";

const teamNameLinkWinning =
  "font-bold text-[1rem] text-[#166534] no-underline hover:text-[#15803d] hover:underline";

const schedulesTeamName = "font-semibold text-[#1f2937] text-[1rem]";

const schedulesTeamNameWinning = "font-bold text-[#166534] text-[1rem]";

const teamScore = "flex flex-col items-end gap-[2px] min-h-[auto]";

const scoreContainer = "flex flex-col items-end gap-[4px]";

/* First .winning-score colour is !important (#166534); second adds text-shadow. */
const overallScore = "text-[1.3rem] font-bold text-[#374151] pr-[1.5rem]";

const winningScore =
  `${overallScore} text-[#166534]! font-bold [text-shadow:0_1px_2px_rgba(146,64,14,0.2)]`;

const winningSet =
  "text-[0.9rem] mr-[3px] py-[1px] px-[3px] rounded-[2px] text-[#166534] font-semibold bg-[#dcfce7]";

const losingSet =
  "text-[0.9rem] mr-[3px] py-[1px] px-[3px] rounded-[2px] text-[#dc2626] font-semibold bg-[#fef2f2]";

const matchDetails =
  "flex justify-between items-center p-[16px] border-t border-[#e5e7eb] " +
  "upto-md:flex-col upto-md:gap-[10px] upto-md:items-start";

const matchTime = "flex flex-col gap-[4px]";

const timeLabel = "text-[0.75rem] text-[#6b7280] uppercase font-medium";

const timeValue = "font-semibold text-[#1f2937] text-[1rem]";

const matchActions =
  "flex flex-col gap-[4px] upto-md:w-full upto-md:justify-between";

const actionWatch =
  "border-none py-[6px] px-[12px] rounded-[4px] text-[0.75rem] font-semibold " +
  "cursor-pointer transition-[background-color] duration-200 uppercase " +
  "bg-[#dc2626] text-white hover:bg-[#b91c1c]";

const actionShop =
  "border-none py-[6px] px-[12px] rounded-[4px] text-[0.75rem] font-semibold " +
  "cursor-pointer transition-[background-color] duration-200 uppercase " +
  "bg-[#6c757d] text-white hover:bg-[#545b62]";

const stayUpdatedSection =
  "m-0 pt-[2.5rem] pr-[3.75rem] pb-0 pl-0 " +
  "bg-[linear-gradient(135deg,#f7f7f7_0%,#ffffff_75%,var(--color-bg-muted)_100%)] " +
  "relative overflow-hidden [clip-path:polygon(0_0,100%_0,85%_100%,0_100%)] " +
  "w-fit max-w-[1200px] " +
  "before:content-[''] before:absolute before:inset-0 " +
  "before:bg-[image:var(--background-image-stay-updated-hatch)] before:bg-[length:60px_60px] " +
  "before:pointer-events-none " +
  "upto-md:p-[24px_40px_24px_60px] upto-md:[clip-path:polygon(0_0,100%_0,90%_100%,0_100%)]";

const stayUpdatedContent =
  "relative z-[1] max-w-[800px] ml-[60px] mr-[40px] mb-[20px] upto-md:ml-[10px] " +
  "[&_h2]:text-[1.75rem] [&_h2]:font-bold [&_h2]:text-brand-primary [&_h2]:m-0 [&_h2]:mb-[16px] [&_h2]:leading-[1.3] " +
  "upto-md:[&_h2]:text-[1.5rem] " +
  "[&_p]:text-[1rem] [&_p]:leading-[1.6] [&_p]:text-text [&_p]:m-0 [&_p]:mb-[24px] [&_p]:max-w-[600px] " +
  "upto-md:[&_p]:text-[0.95rem]";

const STATUS_BADGE: Record<string, string> = {
  scheduled: statusScheduled,
  completed: statusCompleted,
};

const Schedules: React.FC = () => {
  const navigate = useNavigate();
  const { regionQuery } = useRegion();
  const { data: seasons, loading: seasonsLoading } = useSeasons(regionQuery);
  const [selectedSeason, setSelectedSeason] = useState<number | undefined>();
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [currentDateRange, setCurrentDateRange] = useState<Date>(new Date());
  const [showLocalTime, setShowLocalTime] = useState<boolean>(false);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  // Don't auto-select any season - let user choose or show all
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');

  const { data: games, error, loading } = useGames({
    page: 1,
    limit: 500,
    seasonId: selectedSeason,
    search: debouncedSearch || undefined,
    stage: selectedStage || undefined,
    status: 'scheduled',
    phase: selectedPhase || undefined,
    ...regionQuery,
  });

  // Get unique rounds from matches
  const uniqueStages = useMemo(() => {
    if (!games) return [];
    return Array.from(new Set(games.map(game => game.stage).filter(Boolean) as string[]))
      .sort((a, b) => {
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
      const matchesStage = !selectedStage || game.stage === selectedStage;
      const team1Name = game.teams?.[0]?.name ?? '';
      const team2Name = game.teams?.[1]?.name ?? '';
      const label = game.name ?? `${team1Name} vs ${team2Name}`;
      const matchesSearch = label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          team1Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          team2Name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTag || (game.tags ?? []).some(t => t.toLowerCase().includes(selectedTag.toLowerCase()));
       
      return matchesStage && matchesSearch && matchesTag;
    });
  }, [games, selectedStage, searchQuery, selectedTag]);

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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleGameClick = (gameId: number) => {
    navigate(`/games/${gameId}`);
  };

  const handleGameKeyDown = (event: React.KeyboardEvent, gameId: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleGameClick(gameId);
    }
  };

  const stopCardNavigation = (event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation();
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

  const getTagColor = (tag: string) => {
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('rvl')) return 'blue';
    if (tagLower.includes('playoff') || tagLower.includes('winner')) return 'purple';
    if (tagLower.includes('d-league') || tagLower.includes('dleague')) return 'green';
    if (tagLower.includes('qualifier')) return 'green';
    if (tagLower.includes('loser')) return 'red';
    if (tagLower.includes('exhibition') || tagLower.includes('pre-season')) return 'orange';
    return 'default'; // Default dark gray
  };

  if (error) {
    return <div className={schedulesError}>Error: {error}</div>;
  }

  return (
    <>
      <SEO
        title="Schedules"
        description="Upcoming Roblox Volleyball League match schedules, dates, and stages."
        url="https://volleyball4-2.com/schedules"
      />
      <div className={schedulesPage}>
        {/* VNL-Style Header */}
        <div className={vnlHeader}>
        <div className={colorBars}>
          <div className={`${colorBar} bg-success`}></div>
          <div className={`${colorBar} bg-warning`}></div>
          <div className={`${colorBar} bg-[#8b5cf6]`}></div>
          <div className={`${colorBar} bg-brand-primary`}></div>
        </div>
        
        <div className={dateNavigation}>
          <button className={navArrow} onClick={() => {
            const newDate = new Date(currentDateRange);
            newDate.setDate(newDate.getDate() - 14); // Move back 2 weeks
            setCurrentDateRange(newDate);
          }}>
            ‹
          </button>
                  <span className={dateRange}>
          {`${startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`}
        </span>
          <button className={navArrow} onClick={() => {
            const newDate = new Date(currentDateRange);
            newDate.setDate(newDate.getDate() + 14); // Move forward 2 weeks
            setCurrentDateRange(newDate);
          }}>
            ›
          </button>
                     <button className={calendarBtn} onClick={() => setIsCalendarOpen(true)}>
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
           </button>
        </div>

        <FilterBar>
          <select
            className={filterDropdown}
            value={selectedSeason || ''}
            onChange={(e) => {
              setSelectedSeason(e.target.value ? parseInt(e.target.value) : undefined);
            }}
          >
            <option value="">{seasonsLoading ? "Loading seasons..." : "All Seasons"}</option>
            {seasons?.map(season => (
              <option key={season.id} value={season.id}>
                Season {season.seasonNumber}
              </option>
            ))}
          </select>
          <select
            className={filterDropdown}
            value={selectedStage}
            onChange={(e) => {
              setSelectedStage(e.target.value);
            }}
          >
            <option value="">All Stages</option>
            {uniqueStages.map(stage => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
          <select className={filterDropdown} value={selectedPhase} onChange={(e) => setSelectedPhase(e.target.value)}>
            <option value="">All Phases</option>
            <option value="pre_season">Pre-Season</option>
            <option value="qualifiers">Qualifiers</option>
            <option value="playoffs">Playoffs</option>
          </select>
          <select className={filterDropdown} value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)}>
            <option value="">All Divisions</option>
            <option value="Invitational">Invitational</option>
            <option value="RVL">RVL</option>
            <option value="D-League">D-League</option>
          </select>
          <button className={syncCalendar}>
            SYNC TO CALENDAR
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </FilterBar>
      </div>



      {/* Filters */}
      <div className={schedulesFilters}>
        <div className={searchRow}>
          <SearchBar 
            onSearch={handleSearch} 
            placeholder="Search upcoming games..." 
            className={schedulesSearchBar}
          />
          <label className={localTimeToggle}>
            <span>Show local match time</span>
            <input
              className="peer hidden"
              type="checkbox"
              checked={showLocalTime}
              onChange={(e) => setShowLocalTime(e.target.checked)}
            />
            <span className={toggleSlider}></span>
          </label>
        </div>
      </div>

      {/* Matches List */}
      {loading ? (
        <div className={schedulesLoading}>
          <div className={loadingSpinner}></div>
          <p className={schedulesLoadingP}>Loading upcoming games...</p>
        </div>
      ) : (
        <div className={schedulesContent}>
          {paginatedDates.length === 0 ? (
            <div className={noMatches}>
              <p>No upcoming games found for the selected criteria.</p>
            </div>
          ) : (
            paginatedDates.map(dateKey => {
              const dayGames = gamesByDate[dateKey];
               
              return (
                 <div key={dateKey} className={dateSection}>
                   <div className={dateHeader} onClick={() => toggleDateSection(dateKey)}>
                     <h2>{formatDate(dateKey)}</h2>
                     <span className={collapsedDates.has(dateKey) ? collapseArrowCollapsed : collapseArrow}>
                       ▼
                     </span>
                   </div>
                    
                   <div className={collapsedDates.has(dateKey) ? matchesContainerCollapsed : matchesContainer}>
                    {dayGames.map(game => {
                      const winningTeam = getWinningTeam(game);
                      const team1 = game.teams?.[0];
                      const team2 = game.teams?.[1];
                       
                      return (
                        <div
                          key={game.id}
                          className={`${matchCard} ${matchCardClickable}`}
                          role="link"
                          tabIndex={0}
                          onClick={() => handleGameClick(game.id)}
                          onKeyDown={(event) => handleGameKeyDown(event, game.id)}
                          aria-label={`View game: ${game.name ?? `${team1?.name ?? 'TBD'} vs ${team2?.name ?? 'TBD'}`}`}
                        >
                          <div className={matchHeader}>
                            {game.tags && game.tags.length > 0 && (
                              <div className={matchTags} aria-label="Game tags">
                                {game.tags.map((tag) => (
                                  <span key={tag} className={`${genderTag} ${TAG_BG[getTagColor(tag)] ?? TAG_BG.default}`}>
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className={matchInfo}>
                              <span className={matchType}>
                                Upcoming {formatGameStage(game)} · {game.name ?? `${team1?.name ?? 'TBD'} vs ${team2?.name ?? 'TBD'}`}
                              </span>
                              <span className={venue}>TBD Venue</span>
                            </div>
                            <div>
                              <span className={STATUS_BADGE[game.status] ?? statusBadge}>
                                {game.status}
                              </span>
                            </div>
                          </div>
                           
                          <div className={matchTeams}>
                            <div className={winningTeam === 0 ? teamRowWinning : teamRow}>
                              <div className={teamInfo}>
                                {team1?.logoUrl && (
                                  <div className={teamLogoContainer}>
                                    <img 
                                      src={team1.logoUrl} 
                                      alt={`${team1.name} logo`}
                                      className={winningTeam === 0 ? teamLogoWinning : teamLogo}
                                    />
                                  </div>
                                )}
                                {team1?.name ? (
                                  <Link
                                    to={`/teams/${encodeURIComponent(team1.name)}`}
                                    className={winningTeam === 0 ? teamNameLinkWinning : teamNameLink}
                                    onClick={stopCardNavigation}
                                  >
                                    {team1.name}
                                  </Link>
                                ) : (
                                  <span className={winningTeam === 0 ? schedulesTeamNameWinning : schedulesTeamName}>TBD</span>
                                )}
                              </div>
                              <div className={teamScore}>
                                {game.status === 'completed' && game.team1Score != null && (
                                  <div className={scoreContainer}>
                                    <span className={winningTeam === 0 ? winningScore : overallScore}>
                                      {game.team1Score}
                                    </span>
                                    {(game.set1Score || game.set2Score || game.set3Score || game.set4Score || game.set5Score) && (
                                      <div>
                                        {[game.set1Score, game.set2Score, game.set3Score, game.set4Score, game.set5Score]
                                          .filter(score => score !== null && score !== undefined)
                                          .map((setScore, setIndex) => {
                                            if (!setScore) return null;
                                            const [s1, s2] = setScore.split('-').map(Number);
                                            const isWinningSet = s1 > s2;
                                            return (
                                              <span key={setIndex} className={isWinningSet ? winningSet : losingSet}>
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
                            
                            <div className={winningTeam === 1 ? teamRowWinning : teamRow}>
                              <div className={teamInfo}>
                                {team2?.logoUrl && (
                                  <div className={teamLogoContainer}>
                                    <img 
                                      src={team2.logoUrl} 
                                      alt={`${team2.name} logo`}
                                      className={winningTeam === 1 ? teamLogoWinning : teamLogo}
                                    />
                                  </div>
                                )}
                                {team2?.name ? (
                                  <Link
                                    to={`/teams/${encodeURIComponent(team2.name)}`}
                                    className={winningTeam === 1 ? teamNameLinkWinning : teamNameLink}
                                    onClick={stopCardNavigation}
                                  >
                                    {team2.name}
                                  </Link>
                                ) : (
                                  <span className={winningTeam === 1 ? schedulesTeamNameWinning : schedulesTeamName}>TBD</span>
                                )}
                              </div>
                              <div className={teamScore}>
                                {game.status === 'completed' && game.team2Score != null && (
                                  <div className={scoreContainer}>
                                    <span className={winningTeam === 1 ? winningScore : overallScore}>
                                      {game.team2Score}
                                    </span>
                                    {(game.set1Score || game.set2Score || game.set3Score || game.set4Score || game.set5Score) && (
                                      <div>
                                        {[game.set1Score, game.set2Score, game.set3Score, game.set4Score, game.set5Score]
                                          .filter(score => score !== null && score !== undefined)
                                          .map((setScore, setIndex) => {
                                            if (!setScore) return null;
                                            const [s1, s2] = setScore.split('-').map(Number);
                                            const isWinningSet = s2 > s1;
                                            return (
                                              <span key={setIndex} className={isWinningSet ? winningSet : losingSet}>
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
                           
                          <div className={matchDetails}>
                            <div className={matchTime}>
                              <span className={timeLabel}>Start Time</span>
                              <span className={timeValue}>
                                {game.date ? formatTime(game.date.toString()) : 'TBD'}
                              </span>
                            </div>
                            <div className={matchActions} onClick={stopCardNavigation}>
                              {isSafeExternalUrl(game.videoUrl) ? (
                                <a href={game.videoUrl} className={actionWatch} target="_blank" rel="noreferrer">WATCH</a>
                              ) : (
                                <button type="button" className={actionWatch} disabled>WATCH</button>
                              )}
                              {game.status === 'completed' && (
                                <Link to={`/games/${game.id}`} className={actionShop}>STATS</Link>
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
      <div className={stayUpdatedSection}>
        <div className={stayUpdatedContent}>
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