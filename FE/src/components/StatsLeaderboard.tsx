import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { usePlayers } from "../hooks/allFetch";
import { Player, Stats } from "../types/interfaces";
import "../styles/StatsLeaderboard.css";
import SearchBar from "./Searchbar";
import Pagination from "./Pagination";
import SeasonFilter from "./SeasonFilterBar";
import { Link } from 'react-router-dom';
import PlayerStatsVisualization from "./PlayerStatsVisualization";

type StatCategory = 
  | 'spikeKills' 
  | 'spikeAttempts'
  | 'apeKills'
  | 'apeAttempts'
  | 'spikingErrors'
  | 'digs'
  | 'blocks'
  | 'assists'
  | 'aces'
  | 'settingErrors'
  | 'blockFollows'
  | 'servingErrors'
  | 'miscErrors'
  // Calculated columns:
  | 'totalAttempts'
  | 'totalKills'
  | 'totalSpike%'
  | 'Spike%'
  | 'Ape%'
  | 'totalReceives'
  | 'PRF'
  | 'totalErrors'
  | 'plusMinus';

type StatType = 'total' | 'perGame' | 'perSet';
type ViewType = 'player' | 'team';
type ComparisonOperator = '==' | '!=' | '>' | '>=' | '<' | '<=';

// Stage filter types
type StageRound = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'all';

interface FilterCondition {
  id: string;
  stat: StatCategory;
  operator: ComparisonOperator;
  value: number;
}

interface TeamStatsData {
  id: string;
  name: string;
  season: number | null;
  players: Player[];
  stats: any[];
  totalStats: Record<StatCategory, number>;
  gamesPlayed: number;
  totalSets: number;
}

type DisplayData = Player | TeamStatsData;

// Stage mapping configuration
const STAGE_ROUNDS: Record<StageRound, string[]> = {
  'R1': ['Winners Bracket; Round of 16'],
  'R2': ['Winners Bracket; Quarterfinals', 'Losers Bracket; Round 1'],
  'R3': ['Winners Bracket; Semifinals', 'Losers Bracket; Round 2'],
  'R4': ['Winners Bracket; Finals', 'Losers Bracket; Round 3', 'Losers Bracket; Quarterfinals'],
  'R5': ['Losers Bracket; Semifinals', 'Losers Bracket; Finals'],
  'R6': ['Grand Finals', 'Grand Finals; Bracket Reset'],
  'all': []
};

// Helper function to get round from stage
const getStageRound = (stage: string): StageRound => {
  for (const [round, stages] of Object.entries(STAGE_ROUNDS)) {
    if (round === 'all') continue;
    if (stages.includes(stage)) {
      return round as StageRound;
    }
  }
  return 'all'; // Default to all if stage doesn't match any round
};

// Advanced Filter Component
const AdvancedFilter: React.FC<{
  conditions: FilterCondition[];
  onConditionsChange: (conditions: FilterCondition[]) => void;
  statCategories: StatCategory[];
}> = ({ conditions, onConditionsChange, statCategories }) => {
  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: Date.now().toString(),
      stat: 'totalKills',
      operator: '>',
      value: 0
    };
    onConditionsChange([...conditions, newCondition]);
  };

  const removeCondition = (id: string) => {
    onConditionsChange(conditions.filter(c => c.id !== id));
  };

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    onConditionsChange(conditions.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  const formatStatName = (stat: string): string => {
    return stat
      .replace(/([A-Z])/g, ' $1')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="advanced-filter">
      <div className="advanced-filter-header">
        <h3>Advanced Filters</h3>
        <button 
          className="add-filter-button"
          onClick={addCondition}
          type="button"
        >
          + Add Filter
        </button>
      </div>
      
      {conditions.length === 0 && (
        <div className="no-filters-message">
          No filters applied. Click "Add Filter" to start filtering.
        </div>
      )}
      
      {conditions.map((condition, index) => (
        <div key={condition.id} className="filter-condition">
          {index > 0 && <div className="filter-connector">AND</div>}
          
          <div className="filter-condition-content">
            <select
              value={condition.stat}
              onChange={(e) => updateCondition(condition.id, { stat: e.target.value as StatCategory })}
              className="filter-stat-select"
            >
              {statCategories.map(stat => (
                <option key={stat} value={stat}>
                  {formatStatName(stat)}
                </option>
              ))}
            </select>
            
            <select
              value={condition.operator}
              onChange={(e) => updateCondition(condition.id, { operator: e.target.value as ComparisonOperator })}
              className="filter-operator-select"
            >
              <option value="==">=</option>
              <option value="!=">≠</option>
              <option value=">">&gt;</option>
              <option value=">=">≥</option>
              <option value="<">&lt;</option>
              <option value="<=">≤</option>
            </select>
            
            <div className="filter-value-container">
              <input
                type="number"
                value={condition.stat.includes('%') ? (condition.value * 100).toFixed(0) : condition.value}
                onChange={(e) => {
                  const inputValue = parseFloat(e.target.value) || 0;
                  const actualValue = condition.stat.includes('%') ? inputValue / 100 : inputValue;
                  updateCondition(condition.id, { value: actualValue });
                }}
                className="filter-value-input"
                step={condition.stat.includes('%') ? "1" : "1"}
                min="0"
                max={condition.stat.includes('%') ? "100" : undefined}
              />
              {condition.stat.includes('%') && <span className="filter-percentage-symbol">%</span>}
            </div>
            
            <button
              onClick={() => removeCondition(condition.id)}
              className="remove-filter-button"
              type="button"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const StatsLeaderboard: React.FC = () => {
  const { data: players, error } = usePlayers();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sortColumn, setSortColumn] = useState<StatCategory | 'name'>('totalKills');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [statType, setStatType] = useState<StatType>('total');
  const [viewType, setViewType] = useState<ViewType>('player');
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([]);
  const [selectedStageRound, setSelectedStageRound] = useState<StageRound>('all');
  const [visibleStats, setVisibleStats] = useState<Record<StatCategory, boolean>>({
    spikeKills: false,
    spikeAttempts: false,
    apeKills: false,
    apeAttempts: false,
    spikingErrors: false,
    digs: false,
    blocks: true,
    assists: true,
    aces: true,
    settingErrors: false,
    blockFollows: false,
    servingErrors: false,
    miscErrors: false,
    // Calculated columns
    totalAttempts: true,
    totalKills: true,
    'totalSpike%': true,
    'Spike%': false,
    'Ape%': false,
    totalReceives: true,
    PRF: false,
    totalErrors: true,
    plusMinus: false,
  });
  const playersPerPage = 25;
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (showFilterMenu && filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "absolute",
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        minWidth: 400,
        zIndex: 1000,
      });
    }
  }, [showFilterMenu]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleSeasonChange = (season: number | null) => {
    setSelectedSeason(season);
    setCurrentPage(1);
  };

  const handleFilterConditionsChange = (conditions: FilterCondition[]) => {
    setFilterConditions(conditions);
    setCurrentPage(1);
  };

  const handleStageRoundChange = (stageRound: StageRound) => {
    setSelectedStageRound(stageRound);
    setCurrentPage(1);
  };

  // Function to check if a player/team passes all filter conditions
  const passesFilterConditions = (item: DisplayData): boolean => {
    if (filterConditions.length === 0) return true;
    
    return filterConditions.every(condition => {
      const statValue = viewType === 'team' 
        ? getTeamStat(item as TeamStatsData, condition.stat)
        : getPlayerStat(item as Player, condition.stat);
      
      switch (condition.operator) {
        case '==':
          return Math.abs(statValue - condition.value) < 0.001; // Handle floating point precision
        case '!=':
          return Math.abs(statValue - condition.value) >= 0.001;
        case '>':
          return statValue > condition.value;
        case '>=':
          return statValue >= condition.value;
        case '<':
          return statValue < condition.value;
        case '<=':
          return statValue <= condition.value;
        default:
          return true;
      }
    });
  };

  const handleSort = (stat: StatCategory | 'name') => {
    if (sortColumn === stat) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(stat);
      setSortDirection('desc');
    }
  };

  const toggleStatVisibility = (stat: StatCategory) => {
    setVisibleStats(prev => ({
      ...prev,
      [stat]: !prev[stat]
    }));
  };

  const toggleAllStats = () => {
    const allVisible = Object.values(visibleStats).every(v => v);
    setVisibleStats(prev => 
      Object.keys(prev).reduce((acc, key) => ({
        ...acc,
        [key]: !allVisible
      }), {} as Record<StatCategory, boolean>)
    );
  };

  const getPlayerStat = (player: Player, stat: StatCategory): number => {
    if (!player.stats || player.stats.length === 0) return 0;
    let relevantStats = selectedSeason === null
      ? player.stats
      : player.stats.filter(statRecord => statRecord.game?.season?.seasonNumber === selectedSeason);
    
    // Filter by stage round if not 'all'
    if (selectedStageRound !== 'all') {
      relevantStats = relevantStats.filter(statRecord => {
        const gameStage = statRecord.game?.stage;
        if (!gameStage) return false;
        const stageRound = getStageRound(gameStage);
        return stageRound === selectedStageRound;
      });
    }
    
    if (relevantStats.length === 0) return 0;
    const sum = (key: keyof Stats) => relevantStats.reduce((total, statRecord) => {
      const value = statRecord[key];
      return total + (typeof value === 'number' ? value : 0);
    }, 0);
    
    let totalStat = 0;
    switch (stat) {
      case 'totalAttempts':
        totalStat = sum('apeAttempts') + sum('spikeAttempts');
        break;
      case 'totalKills':
        totalStat = sum('apeKills') + sum('spikeKills');
        break;
      case 'totalSpike%': {
        const attempts = sum('apeAttempts') + sum('spikeAttempts');
        const kills = sum('apeKills') + sum('spikeKills');
        totalStat = attempts > 0 ? kills / attempts : 0;
        break;
      }
      case 'totalReceives':
        totalStat = sum('digs') + sum('blockFollows');
        break;
      case 'PRF':
        totalStat = sum('apeKills') + sum('spikeKills') + sum('aces') + sum('assists');
        break;
      case 'totalErrors':
        totalStat = sum('miscErrors') + sum('spikingErrors') + sum('settingErrors') + sum('servingErrors');
        break;
      case 'plusMinus': {
        const prf = sum('apeKills') + sum('spikeKills') + sum('aces') + sum('assists');
        const lrf = sum('miscErrors') + sum('spikingErrors') + sum('settingErrors') + sum('servingErrors');
        totalStat = prf - lrf;
        break;
      }
      case 'Spike%': {
        const attempts = sum('spikeAttempts');
        const kills = sum('spikeKills');
        totalStat = attempts > 0 ? kills / attempts : 0;
        break;
      }
      case 'Ape%': {
        const attempts = sum('apeAttempts');
        const kills = sum('apeKills');
        totalStat = attempts > 0 ? kills / attempts : 0;
        break;
      }
      default:
        totalStat = (stat in relevantStats[0]) ? sum(stat as keyof Stats) : 0;
    }

    // For percentage stats, always return the percentage regardless of stat type
    if (stat === 'totalSpike%' || stat === 'Spike%' || stat === 'Ape%') {
      return totalStat;
    }

    if (statType === 'total') {
      return totalStat;
    }

    if (statType === 'perGame') {
      // Get unique games to count games played
      const uniqueGames = new Set(relevantStats.map(statRecord => statRecord.game?.id));
      const gamesPlayed = uniqueGames.size;
      return gamesPlayed > 0 ? totalStat / gamesPlayed : 0;
    }

    if (statType === 'perSet') {
      // Calculate total sets played from game scores
      const totalSets = relevantStats.reduce((total, statRecord) => {
        const game = statRecord.game;
        if (game && typeof game.team1Score === 'number' && typeof game.team2Score === 'number') {
          return total + game.team1Score + game.team2Score;
        }
        return total;
      }, 0);
      
      return totalSets > 0 ? totalStat / totalSets : 0;
    }

    return totalStat;
  };

  // Function to aggregate stats by team
  const getTeamStats = () => {
    if (!players) return [];
    
    const teamStatsMap = new Map<string, {
      id: string;
      name: string;
      season: number | null;
      players: Player[];
      stats: any[];
      totalStats: Record<StatCategory, number>;
      gamesPlayed: Set<number>;
      totalSets: number;
    }>();
    
    players.forEach(player => {
      if (!player.teams) return;
      
      player.teams.forEach(team => {
        // Skip if season filter is applied and team doesn't match
        if (selectedSeason !== null && team.season?.seasonNumber !== selectedSeason) return;
        
        const teamKey = `${team.name}-${team.season?.seasonNumber || 'all'}`;
        
        if (!teamStatsMap.has(teamKey)) {
          teamStatsMap.set(teamKey, {
            id: teamKey,
            name: team.name,
            season: team.season?.seasonNumber || null,
            players: [],
            stats: [],
            totalStats: {
              spikeKills: 0,
              spikeAttempts: 0,
              apeKills: 0,
              apeAttempts: 0,
              spikingErrors: 0,
              digs: 0,
              blocks: 0,
              assists: 0,
              aces: 0,
              settingErrors: 0,
              blockFollows: 0,
              servingErrors: 0,
              miscErrors: 0,
              totalAttempts: 0,
              totalKills: 0,
              'totalSpike%': 0,
              'Spike%': 0,
              'Ape%': 0,
              totalReceives: 0,
              PRF: 0,
              totalErrors: 0,
              plusMinus: 0,
            },
            gamesPlayed: new Set(),
            totalSets: 0
          });
        }
        
        const teamData = teamStatsMap.get(teamKey)!;
        teamData.players.push(player);
        
        // Add player stats to team totals
        if (player.stats) {
          let relevantStats = selectedSeason === null 
            ? player.stats 
            : player.stats.filter(statRecord => statRecord.game?.season?.seasonNumber === selectedSeason);
          
          // Filter by stage round if not 'all'
          if (selectedStageRound !== 'all') {
            relevantStats = relevantStats.filter(statRecord => {
              const gameStage = statRecord.game?.stage;
              if (!gameStage) return false;
              const stageRound = getStageRound(gameStage);
              return stageRound === selectedStageRound;
            });
          }
          
          console.log(`Player ${player.name} has ${relevantStats.length} relevant stats for team ${team.name}`);
          
          relevantStats.forEach(statRecord => {
            const game = statRecord.game;
            if (!game) return;
            
            // Check if the team is one of the teams in this game
            let teamInGame = false;
            if (game.teams && game.teams.length > 0) {
              teamInGame = game.teams.some(gameTeam => 
                gameTeam.name === team.name && 
                gameTeam.season?.seasonNumber === team.season?.seasonNumber
              );
            }
            
            // If game.teams is not available or empty, assume the player's stats belong to their current team
            // This is a fallback for when the game-team relationship data isn't fully populated
            if (!game.teams || game.teams.length === 0) {
              teamInGame = true;
            }
            
            console.log(`Game ${game.id}: Team ${team.name} in game? ${teamInGame}, Game teams:`, game.teams?.map(t => t.name) || 'none');
            
            // Add stats if team was in game OR if we don't have game teams data (fallback)
            if (teamInGame) {
              teamData.gamesPlayed.add(game.id || 0);
              // Add to total sets
              if (typeof game.team1Score === 'number' && typeof game.team2Score === 'number') {
                teamData.totalSets += game.team1Score + game.team2Score;
              }
              // Add to stat totals - only add actual Stats properties, not calculated fields
              if (statRecord.spikeKills !== undefined) teamData.totalStats.spikeKills += statRecord.spikeKills;
              if (statRecord.spikeAttempts !== undefined) teamData.totalStats.spikeAttempts += statRecord.spikeAttempts;
              if (statRecord.apeKills !== undefined) teamData.totalStats.apeKills += statRecord.apeKills;
              if (statRecord.apeAttempts !== undefined) teamData.totalStats.apeAttempts += statRecord.apeAttempts;
              if (statRecord.spikingErrors !== undefined) teamData.totalStats.spikingErrors += statRecord.spikingErrors;
              if (statRecord.digs !== undefined) teamData.totalStats.digs += statRecord.digs;
              if (statRecord.blocks !== undefined) teamData.totalStats.blocks += statRecord.blocks;
              if (statRecord.assists !== undefined) teamData.totalStats.assists += statRecord.assists;
              if (statRecord.aces !== undefined) teamData.totalStats.aces += statRecord.aces;
              if (statRecord.settingErrors !== undefined) teamData.totalStats.settingErrors += statRecord.settingErrors;
              if (statRecord.blockFollows !== undefined) teamData.totalStats.blockFollows += statRecord.blockFollows;
              if (statRecord.servingErrors !== undefined) teamData.totalStats.servingErrors += statRecord.servingErrors;
              if (statRecord.miscErrors !== undefined) teamData.totalStats.miscErrors += statRecord.miscErrors;
            }
          });
        }
      });
    });
    
    const result = Array.from(teamStatsMap.values()).map(teamData => ({
      ...teamData,
      totalSets: teamData.totalSets / teamData.players.length, // Average sets per player to avoid double counting
      gamesPlayed: teamData.gamesPlayed.size
    }));
    
    console.log('Team stats result:', result.map(team => ({
      name: team.name,
      players: team.players.length,
      gamesPlayed: team.gamesPlayed,
      totalStats: team.totalStats
    })));
    
    return result;
  };

  const getTeamStat = (teamData: any, stat: StatCategory): number => {
    const sum = (key: StatCategory) => teamData.totalStats[key] || 0;
    
    let totalStat = 0;
    switch (stat) {
      case 'totalAttempts':
        totalStat = sum('apeAttempts') + sum('spikeAttempts');
        break;
      case 'totalKills':
        totalStat = sum('apeKills') + sum('spikeKills');
        break;
      case 'totalSpike%': {
        const attempts = sum('apeAttempts') + sum('spikeAttempts');
        const kills = sum('apeKills') + sum('spikeKills');
        totalStat = attempts > 0 ? kills / attempts : 0;
        break;
      }
      case 'totalReceives':
        totalStat = sum('digs') + sum('blockFollows');
        break;
      case 'PRF':
        totalStat = sum('apeKills') + sum('spikeKills') + sum('aces') + sum('assists');
        break;
      case 'totalErrors':
        totalStat = sum('miscErrors') + sum('spikingErrors') + sum('settingErrors') + sum('servingErrors');
        break;
      case 'plusMinus': {
        const prf = sum('apeKills') + sum('spikeKills') + sum('aces') + sum('assists');
        const lrf = sum('miscErrors') + sum('spikingErrors') + sum('settingErrors') + sum('servingErrors');
        totalStat = prf - lrf;
        break;
      }
      case 'Spike%': {
        const attempts = sum('spikeAttempts');
        const kills = sum('spikeKills');
        totalStat = attempts > 0 ? kills / attempts : 0;
        break;
      }
      case 'Ape%': {
        const attempts = sum('apeAttempts');
        const kills = sum('apeKills');
        totalStat = attempts > 0 ? kills / attempts : 0;
        break;
      }
      default:
        totalStat = sum(stat);
    }

    // For percentage stats, always return the percentage regardless of stat type
    if (stat === 'totalSpike%' || stat === 'Spike%' || stat === 'Ape%') {
      return totalStat;
    }

    if (statType === 'total') {
      return totalStat;
    }

    if (statType === 'perGame') {
      return teamData.gamesPlayed > 0 ? totalStat / teamData.gamesPlayed : 0;
    }

    if (statType === 'perSet') {
      return teamData.totalSets > 0 ? totalStat / teamData.totalSets : 0;
    }

    return totalStat;
  };

  const hasAnyStats = (player: Player): boolean => {
    if (!player.stats || player.stats.length === 0) return false;
    
    // Filter stats by selected season if one is selected
    let relevantStats = selectedSeason === null 
      ? player.stats 
      : player.stats.filter(statRecord => statRecord.game?.season?.seasonNumber === selectedSeason);
    
    // Filter by stage round if not 'all'
    if (selectedStageRound !== 'all') {
      relevantStats = relevantStats.filter(statRecord => {
        const gameStage = statRecord.game?.stage;
        if (!gameStage) return false;
        const stageRound = getStageRound(gameStage);
        return stageRound === selectedStageRound;
      });
    }
    
    return relevantStats.some(stat => 
      stat.spikeKills > 0 || 
      stat.spikeAttempts > 0 ||
      stat.apeKills > 0 ||
      stat.apeAttempts > 0 ||
      stat.spikingErrors > 0 ||
      stat.digs > 0 || 
      stat.blocks > 0 || 
      stat.assists > 0 || 
      stat.aces > 0 ||
      stat.settingErrors > 0 ||
      stat.blockFollows > 0 ||
      stat.servingErrors > 0 ||
      stat.miscErrors > 0
    );
  };

  // Get data based on view type
  const getDisplayData = (): DisplayData[] => {
    let data: DisplayData[] = [];
    
    if (viewType === 'team') {
      data = getTeamStats();
    } else {
      // Player view - filter players
      data = players?.filter((player) => {
        const matchesSearchQuery = player.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSeason = selectedSeason === null || player.teams?.some(
          (team) => team?.season?.seasonNumber === selectedSeason
        );
        const hasStats = hasAnyStats(player);
        return matchesSearchQuery && matchesSeason && hasStats;
      }) || [];
    }
    
    // Apply advanced filter conditions
    return data.filter(item => passesFilterConditions(item));
  };

  const displayData = getDisplayData();

  const sortedData = [...displayData].sort((a, b) => {
    if (sortColumn === 'name') {
      const nameA = a.name;
      const nameB = b.name;
      return sortDirection === 'desc' 
        ? nameB.localeCompare(nameA)
        : nameA.localeCompare(nameB);
    }
    
    const statA = viewType === 'team' 
      ? getTeamStat(a as TeamStatsData, sortColumn as StatCategory || 'totalKills')
      : getPlayerStat(a as Player, sortColumn as StatCategory || 'totalKills');
    const statB = viewType === 'team' 
      ? getTeamStat(b as TeamStatsData, sortColumn as StatCategory || 'totalKills')
      : getPlayerStat(b as Player, sortColumn as StatCategory || 'totalKills');
    
    return sortDirection === 'desc' ? statB - statA : statA - statB;
  });

  const totalPages = Math.ceil(sortedData.length / playersPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * playersPerPage,
    currentPage * playersPerPage
  );

  const statCategories: StatCategory[] = [
    'spikeKills',
    'spikeAttempts',
    'Spike%',
    'apeKills',
    'apeAttempts',
    'Ape%',
    'totalKills',
    'totalAttempts',
    'totalSpike%',
    'spikingErrors',
    'blocks',
    'assists',
    'settingErrors',
    'digs',
    'blockFollows',
    'totalReceives',
    'aces',
    'servingErrors',
    'PRF',
    'plusMinus',
    'totalErrors',
    'miscErrors'
  ];
  const visibleStatCategories = statCategories.filter(stat => visibleStats[stat]);

  const formatStatName = (stat: string): string => {
    return stat
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatStatValue = (stat: StatCategory, value: number, statType: StatType): string => {
    if (stat === 'totalSpike%' || stat === 'Spike%' || stat === 'Ape%') {
      // Format as percentage with exactly 2 decimal places
      return `${(value * 100).toFixed(2)}%`;
    }
    
    // For other stats, use existing logic
    return statType === 'total' 
      ? value.toString()
      : value.toFixed(1);
  };

  // Toggle accordion for player rows
  const handleRowClick = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={`stats-leaderboard-page ${!players ? 'loading' : ''}`}>
      <h1>Statistics Leaderboard</h1>

      {/* Records Navigation */}
      <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
        <button 
          className="create-button" 
          onClick={() => window.location.href = '/records'}
          style={{ background: '#28a745' }}
        >
          View Stat Records
        </button>
      </div>

      <div className="stats-controls-wrapper">
        <div className="stats-controls-container">
          <div className="stats-filters-row">
            <div className="stats-season-filter">
              <SeasonFilter selectedSeason={selectedSeason} onSeasonChange={handleSeasonChange} />
            </div>
            <div className="stats-stage-filter">
              <label htmlFor="stage-round">Round:</label>
              <select
                id="stage-round"
                value={selectedStageRound}
                onChange={(e) => handleStageRoundChange(e.target.value as StageRound)}
              >
                <option value="all">All</option>
                <option value="R1">R1 - Winners Round of 16</option>
                <option value="R2">R2 - Winners QF + Losers R1</option>
                <option value="R3">R3 - Winners SF + Losers R2</option>
                <option value="R4">R4 - Winners Finals + Losers R3/QF</option>
                <option value="R5">R5 - Losers SF + Losers Finals</option>
                <option value="R6">R6 - Grand Finals</option>
              </select>
            </div>
            <div className="stats-type-filter">
              <label htmlFor="stat-type">Stat-Type:</label>
              <select
                id="stat-type"
                value={statType}
                onChange={(e) => setStatType(e.target.value as StatType)}
              >
                <option value="total">Total</option>
                <option value="perGame">Per Game</option>
                <option value="perSet">Per Set</option>
              </select>
            </div>
            <div className="stats-view-filter">
              <label htmlFor="view-type">View:</label>
              <select
                id="view-type"
                value={viewType}
                onChange={(e) => setViewType(e.target.value as ViewType)}
              >
                <option value="player">Players</option>
                <option value="team">Teams</option>
              </select>
            </div>
            <div className="stats-filter-menu">
              <button
                className="filter-menu-button"
                ref={filterButtonRef}
                onClick={() => setShowFilterMenu(!showFilterMenu)}
              >
                Filter Stats
              </button>
            </div>
            <div className="stats-advanced-filter">
              <button
                className={`advanced-filter-button ${showAdvancedFilter ? 'active' : ''}`}
                onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
              >
                Advanced Filters {filterConditions.length > 0 && `(${filterConditions.length})`}
              </button>
            </div>
          </div>
          <div className="stats-search-row">
            <SearchBar onSearch={handleSearch} placeholder={viewType === 'team' ? "Search Teams..." : "Search Players..."} />
            <div className="stats-pagination-wrapper">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>
      </div>

      {showFilterMenu && ReactDOM.createPortal(
        <div className="filter-menu-dropdown" style={dropdownStyle}>
          <div className="filter-menu-header">
            <label>
              <input
                type="checkbox"
                checked={Object.values(visibleStats).every(v => v)}
                onChange={toggleAllStats}
              />
              All Stats
            </label>
          </div>
          <div className="filter-menu-items">
            {statCategories.map((stat) => (
              <label key={stat} className="filter-menu-item">
                <input
                  type="checkbox"
                  checked={visibleStats[stat]}
                  onChange={() => toggleStatVisibility(stat)}
                />
                {stat.replace(/([A-Z])/g, ' $1').trim()}
              </label>
            ))}
          </div>
        </div>,
        document.body
      )}

      {showAdvancedFilter && (
        <div className="advanced-filter-panel">
          <AdvancedFilter
            conditions={filterConditions}
            onConditionsChange={handleFilterConditionsChange}
            statCategories={statCategories}
          />
        </div>
      )}

      {error ? (
        <div>Error: {error}</div>
      ) : !players ? (
        <div className="stats-table-wrapper">
          <div className="stats-skeleton-table">
            {/* Skeleton loaders for table */}
            {Array.from({ length: 15 }).map((_, index) => (
              <div key={index} className="stats-skeleton-row">
                <div className="stats-skeleton-cell rank"></div>
                <div className="stats-skeleton-cell name"></div>
                {selectedSeason !== null && viewType === 'player' && (
                  <div className="stats-skeleton-cell team"></div>
                )}
                {Array.from({ length: Math.min(visibleStatCategories.length, 8) }).map((_, cellIndex) => (
                  <div 
                    key={cellIndex} 
                    className={`stats-skeleton-cell ${
                      visibleStatCategories[cellIndex]?.includes('%') ? 'percentage' : 'stat'
                    }`}
                  ></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="stats-table-wrapper">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th 
                  onClick={() => handleSort('name')}
                  className="sortable"
                >
                  {viewType === 'team' ? 'Team Name' : 'Player Name'}
                  {sortColumn === 'name' && (
                    <span className={`sort-arrow ${sortDirection}`}>
                      {sortDirection === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </th>
                {selectedSeason !== null && viewType === 'player' && (
                  <th>Team</th>
                )}
                {visibleStatCategories.map((stat) => (
                  <th 
                    key={stat}
                    onClick={() => handleSort(stat)}
                    className="sortable"
                  >
                    {formatStatName(stat)} {statType === 'perGame' ? '(Per Game)' : statType === 'perSet' ? '(Per Set)' : ''}
                    {sortColumn === stat && (
                      <span className={`sort-arrow ${sortDirection}`}>
                        {sortDirection === 'desc' ? '↓' : '↑'}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, index) => {
                const isPlayer = 'position' in item;
                const isTeam = 'totalStats' in item;
                const rowId = String(item.id);
                return (
                  <React.Fragment key={rowId}>
                    <tr
                      className={isPlayer ? 'player-row' : ''}
                      onClick={isPlayer ? () => handleRowClick(rowId) : undefined}
                      style={isPlayer ? { cursor: 'pointer' } : {}}
                    >
                      <td>{(currentPage - 1) * playersPerPage + index + 1}</td>
                      <td>{
                        isPlayer
                          ? <Link className="stats-pill-link" to={`/players/${item.id}`}>{item.name}</Link>
                          : <Link className="stats-pill-link" to={`/teams/${encodeURIComponent(item.name)}`}>{item.name}</Link>
                      }</td>
                      {selectedSeason !== null && isPlayer && viewType === 'player' && (
                        <td>
                          {(() => {
                            const team = (item as Player).teams?.find(team => team?.season?.seasonNumber === selectedSeason);
                            return team ? (
                              <Link className="stats-pill-link" to={`/teams/${encodeURIComponent(team.name)}`}>{team.name}</Link>
                            ) : 'N/A';
                          })()}
                        </td>
                      )}
                      {visibleStatCategories.map((stat) => (
                        <td key={stat}>
                          {(() => {
                            const statValue = isTeam 
                              ? getTeamStat(item as TeamStatsData, stat)
                              : getPlayerStat(item as Player, stat);
                            return formatStatValue(stat, statValue, statType);
                          })()}
                        </td>
                      ))}
                    </tr>
                    {/* Accordion row for player visualization */}
                    {isPlayer && expandedRows[rowId] && (
                      <tr className="player-visualization-row">
                        <td colSpan={2 + (selectedSeason !== null && viewType === 'player' ? 1 : 0) + visibleStatCategories.length}>
                          <PlayerStatsVisualization
                            player={item as Player}
                            allPlayers={players || []}
                            selectedSeason={selectedSeason}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StatsLeaderboard; 