import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';
import { Player, Stats } from '../types/interfaces';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface PlayerStatsVisualizationProps {
  player: Player;
  allPlayers: Player[];
  selectedSeason: number | null;
}

const PlayerStatsVisualization: React.FC<PlayerStatsVisualizationProps> = ({
  player,
  allPlayers,
  selectedSeason
}) => {
  // Helper function to normalize stats within their categories
  const normalizeStats = (playerData: any) => {
    // Group 1: Kills (0-10 range typical)
    const spikeKillsNorm = Math.min(playerData.spikeKills / playerData.totalSets / 5, 1) * 100;
    const apeKillsNorm = Math.min(playerData.apeKills / playerData.totalSets / 3, 1) * 100;
    
    // Group 2: Attempts (0-20 range typical)
    const spikeAttemptsNorm = Math.min(playerData.spikeAttempts / playerData.totalSets / 15, 1) * 100;
    const apeAttemptsNorm = Math.min(playerData.apeAttempts / playerData.totalSets / 8, 1) * 100;
    
    // Group 3: Defensive stats (0-5 range typical)
    const blocksNorm = Math.min(playerData.blocks / playerData.totalSets / 3, 1) * 100;
    const digsNorm = Math.min(playerData.digs / playerData.totalSets / 4, 1) * 100;
    const blockFollowsNorm = Math.min(playerData.blockFollows / playerData.totalSets / 2, 1) * 100;
    
    // Group 4: Offensive support (0-3 range typical)
    const assistsNorm = Math.min(playerData.assists / playerData.totalSets / 2, 1) * 100;
    const acesNorm = Math.min(playerData.aces / playerData.totalSets / 1.5, 1) * 100;
    
    // Group 5: Errors (0-4 range typical)
    const totalErrorsNorm = Math.min((playerData.miscErrors + playerData.spikingErrors + playerData.settingErrors + playerData.servingErrors) / playerData.totalSets / 3, 1) * 100;
    
    return {
      spikeKills: spikeKillsNorm,
      apeKills: apeKillsNorm,
      spikeAttempts: spikeAttemptsNorm,
      apeAttempts: apeAttemptsNorm,
      blocks: blocksNorm,
      assists: assistsNorm,
      aces: acesNorm,
      digs: digsNorm,
      blockFollows: blockFollowsNorm,
      totalErrors: totalErrorsNorm
    };
  };

  // Helper to aggregate stats
  const getPlayerStats = (player: Player) => {
    if (!player.stats || player.stats.length === 0) return null;
    const relevantStats = selectedSeason === null
      ? player.stats
      : player.stats.filter(statRecord => statRecord.game?.season?.seasonNumber === selectedSeason);
    if (relevantStats.length === 0) return null;
    const sum = (key: keyof Stats) => relevantStats.reduce((total, statRecord) => {
      const value = statRecord[key];
      return total + (typeof value === 'number' ? value : 0);
    }, 0);
    const spikeAttempts = sum('spikeAttempts');
    const apeAttempts = sum('apeAttempts');
    const spikeKills = sum('spikeKills');
    const apeKills = sum('apeKills');
    const totalAttempts = spikeAttempts + apeAttempts;
    const totalKills = spikeKills + apeKills;
    return {
      spikeKills,
      spikeAttempts,
      apeKills,
      apeAttempts,
      blocks: sum('blocks'),
      assists: sum('assists'),
      aces: sum('aces'),
      digs: sum('digs'),
      blockFollows: sum('blockFollows'),
      miscErrors: sum('miscErrors'),
      spikingErrors: sum('spikingErrors'),
      settingErrors: sum('settingErrors'),
      servingErrors: sum('servingErrors'),
      PRF: apeKills + spikeKills + sum('aces') + sum('assists'),
      plusMinus: (apeKills + spikeKills + sum('aces') + sum('assists')) -
        (sum('miscErrors') + sum('spikingErrors') + sum('settingErrors') + sum('servingErrors')),
      gamesPlayed: new Set(relevantStats.map(statRecord => statRecord.game?.id)).size,
      totalSets: relevantStats.reduce((total, statRecord) => {
        const game = statRecord.game;
        if (game && typeof game.team1Score === 'number' && typeof game.team2Score === 'number') {
          return total + game.team1Score + game.team2Score;
        }
        return total;
      }, 0),
      totalKills,
      totalAttempts,
      totalSpikePct: totalAttempts > 0 ? totalKills / totalAttempts : 0,
    };
  };

  // League averages
  const getLeagueAverages = () => {
    const playersWithStats = allPlayers.filter(p => {
      if (!p.stats || p.stats.length === 0) return false;
      const relevantStats = selectedSeason === null
        ? p.stats
        : p.stats.filter(statRecord => statRecord.game?.season?.seasonNumber === selectedSeason);
      return relevantStats.length > 0;
    });
    if (playersWithStats.length === 0) return null;
    const allStats = playersWithStats.map(p => getPlayerStats(p)).filter(Boolean) as ReturnType<typeof getPlayerStats>[];
    const keys = ['spikeKills', 'apeKills', 'blocks', 'assists', 'aces', 'digs', 'blockFollows', 'miscErrors', 'spikingErrors', 'settingErrors', 'servingErrors', 'PRF', 'plusMinus', 'gamesPlayed', 'totalSets', 'totalKills', 'totalSpikePct'] as const;
    const averages: any = {};
    keys.forEach(key => {
      averages[key] = allStats.reduce((sum, s) => sum + (s ? s[key] : 0), 0) / allStats.length;
    });
    return averages;
  };

  // Teammate stats
  const getTeammateStats = () => {
    if (!player.teams) return [];
    const currentTeam = player.teams.find(team =>
      selectedSeason === null || team.season?.seasonNumber === selectedSeason
    );
    if (!currentTeam) return [];
    return allPlayers
      .filter(p => p.id !== player.id && p.teams?.some(team =>
        team.name === currentTeam.name &&
        (selectedSeason === null || team.season?.seasonNumber === selectedSeason)
      ))
      .map(p => ({
        player: p,
        stats: getPlayerStats(p)
      }))
      .filter(item => item.stats !== null);
  };

  // Get player's historical seasons data
  const getPlayerHistoricalSeasons = () => {
    if (!player.stats || player.stats.length === 0) return [];
    
    // Group stats by season
    const seasonStats = new Map<number, any[]>();
    player.stats.forEach(statRecord => {
      const seasonNumber = statRecord.game?.season?.seasonNumber;
      if (seasonNumber) {
        if (!seasonStats.has(seasonNumber)) {
          seasonStats.set(seasonNumber, []);
        }
        seasonStats.get(seasonNumber)!.push(statRecord);
      }
    });
    
    // Calculate per-set stats for each season
    const historicalSeasons = Array.from(seasonStats.entries()).map(([seasonNumber, stats]) => {
      const sum = (key: keyof Stats) => stats.reduce((total, statRecord) => {
        const value = statRecord[key];
        return total + (typeof value === 'number' ? value : 0);
      }, 0);
      
      const spikeKills = sum('spikeKills');
      const apeKills = sum('apeKills');
      const spikeAttempts = sum('spikeAttempts');
      const apeAttempts = sum('apeAttempts');
      const totalSets = stats.reduce((total, statRecord) => {
        const game = statRecord.game;
        if (game && typeof game.team1Score === 'number' && typeof game.team2Score === 'number') {
          return total + game.team1Score + game.team2Score;
        }
        return total;
      }, 0);
      
      const seasonData = {
        spikeKills: totalSets > 0 ? spikeKills / totalSets : 0,
        apeKills: totalSets > 0 ? apeKills / totalSets : 0,
        spikeAttempts: totalSets > 0 ? spikeAttempts / totalSets : 0,
        apeAttempts: totalSets > 0 ? apeAttempts / totalSets : 0,
        blocks: totalSets > 0 ? sum('blocks') / totalSets : 0,
        assists: totalSets > 0 ? sum('assists') / totalSets : 0,
        aces: totalSets > 0 ? sum('aces') / totalSets : 0,
        digs: totalSets > 0 ? sum('digs') / totalSets : 0,
        blockFollows: totalSets > 0 ? sum('blockFollows') / totalSets : 0,
        totalErrors: totalSets > 0 ? (sum('miscErrors') + sum('spikingErrors') + sum('settingErrors') + sum('servingErrors')) / totalSets : 0,
        PRF: totalSets > 0 ? (apeKills + spikeKills + sum('aces') + sum('assists')) / totalSets : 0,
        plusMinus: totalSets > 0 ? ((apeKills + spikeKills + sum('aces') + sum('assists')) - 
          (sum('miscErrors') + sum('spikingErrors') + sum('settingErrors') + sum('servingErrors'))) / totalSets : 0,
      };
      
      const normalized = normalizeStats(seasonData);
      
      return {
        seasonNumber,
        ...normalized,
        PRF: seasonData.PRF,
        plusMinus: seasonData.plusMinus,
        // Store original per-set values for tooltips
        originalSpikeKills: seasonData.spikeKills,
        originalApeKills: seasonData.apeKills,
        originalSpikeAttempts: seasonData.spikeAttempts,
        originalApeAttempts: seasonData.apeAttempts,
        originalBlocks: seasonData.blocks,
        originalAssists: seasonData.assists,
        originalAces: seasonData.aces,
        originalDigs: seasonData.digs,
        originalBlockFollows: seasonData.blockFollows,
        originalTotalErrors: seasonData.totalErrors,
      };
    });
    
    return historicalSeasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
  };

  const playerStats = getPlayerStats(player);
  const leagueAverages = getLeagueAverages();
  const teammateStats = getTeammateStats();
  const historicalSeasons = getPlayerHistoricalSeasons();

  if (!playerStats || !leagueAverages) {
    return (
      <div className="player-visualization">
        <p>No stats available for this player in the selected season.</p>
      </div>
    );
  }

  // Radar chart: player vs league
  const radarLabels = [
    'Spike Kills',
    'Ape Kills',
    'Spike Attempts',
    'Ape Attempts',
    'Blocks',
    'Assists',
    'Aces',
    'Digs',
    'Block Follows',
    'Total Errors'
  ];

  const playerNormalized = normalizeStats(playerStats);
  const leagueNormalized = normalizeStats(leagueAverages);
  
  const radarData = {
    labels: radarLabels,
    datasets: [
      {
        label: player.name,
        data: [
          playerNormalized.spikeKills,
          playerNormalized.apeKills,
          playerNormalized.spikeAttempts,
          playerNormalized.apeAttempts,
          playerNormalized.blocks,
          playerNormalized.assists,
          playerNormalized.aces,
          playerNormalized.digs,
          playerNormalized.blockFollows,
          playerNormalized.totalErrors,
        ],
        backgroundColor: 'rgba(45, 60, 80, 0.2)',
        borderColor: 'rgba(45, 60, 80, 1)',
        borderWidth: 2,
      },
      {
        label: 'League Average',
        data: [
          leagueNormalized.spikeKills,
          leagueNormalized.apeKills,
          leagueNormalized.spikeAttempts,
          leagueNormalized.apeAttempts,
          leagueNormalized.blocks,
          leagueNormalized.assists,
          leagueNormalized.aces,
          leagueNormalized.digs,
          leagueNormalized.blockFollows,
          leagueNormalized.totalErrors,
        ],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
      }
    ]
  };

  // Right chart: either teammate comparison or historical seasons
  let rightChartData: any;
  let rightChartOptions: any;
  let rightChartComponent: any;

  if (selectedSeason === null) {
    // All seasons view: Show historical seasons radar chart
    const historicalData = {
      labels: radarLabels,
      datasets: [
        {
          label: 'Current (All Seasons)',
          data: [
            playerNormalized.spikeKills,
            playerNormalized.apeKills,
            playerNormalized.spikeAttempts,
            playerNormalized.apeAttempts,
            playerNormalized.blocks,
            playerNormalized.assists,
            playerNormalized.aces,
            playerNormalized.digs,
            playerNormalized.blockFollows,
            playerNormalized.totalErrors,
          ],
          backgroundColor: 'rgba(45, 60, 80, 0.2)',
          borderColor: 'rgba(45, 60, 80, 1)',
          borderWidth: 2,
        },
        ...historicalSeasons.map((season, index) => ({
          label: `Season ${season.seasonNumber}`,
          data: [
            season.spikeKills,
            season.apeKills,
            season.spikeAttempts,
            season.apeAttempts,
            season.blocks,
            season.assists,
            season.aces,
            season.digs,
            season.blockFollows,
            season.totalErrors,
          ],
          backgroundColor: `hsla(${200 + index * 30}, 70%, 60%, 0.2)`,
          borderColor: `hsla(${200 + index * 30}, 70%, 60%, 1)`,
          borderWidth: 2,
        }))
      ]
    };
    
    rightChartData = historicalData;
        rightChartOptions = {
      responsive: true,
      plugins: {
        legend: { 
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        title: {
          display: true,
          text: `${player.name} - Historical Seasons Comparison (Per Set)`
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const label = context.label || '';
              const datasetIndex = context.datasetIndex;
              const dataIndex = context.dataIndex;
              
              // Get the actual per-set values for the current dataset
              let actualValue = 0;
              if (datasetIndex === 0) {
                // Current (All Seasons) data
                const actualValues = [
                  playerStats.spikeKills / playerStats.totalSets,
                  playerStats.apeKills / playerStats.totalSets,
                  playerStats.spikeAttempts / playerStats.totalSets,
                  playerStats.apeAttempts / playerStats.totalSets,
                  playerStats.blocks / playerStats.totalSets,
                  playerStats.assists / playerStats.totalSets,
                  playerStats.aces / playerStats.totalSets,
                  playerStats.digs / playerStats.totalSets,
                  playerStats.blockFollows / playerStats.totalSets,
                  (playerStats.miscErrors + playerStats.spikingErrors + playerStats.settingErrors + playerStats.servingErrors) / playerStats.totalSets,
                ];
                actualValue = actualValues[dataIndex];
              } else {
                // Historical season data
                const seasonIndex = datasetIndex - 1;
                const season = historicalSeasons[seasonIndex];
                if (season) {
                  const actualValues = [
                    season.originalSpikeKills,
                    season.originalApeKills,
                    season.originalSpikeAttempts,
                    season.originalApeAttempts,
                    season.originalBlocks,
                    season.originalAssists,
                    season.originalAces,
                    season.originalDigs,
                    season.originalBlockFollows,
                    season.originalTotalErrors,
                  ];
                  actualValue = actualValues[dataIndex];
                }
              }
              
              return `${context.dataset.label}: ${label} (${actualValue.toFixed(2)} per set)`;
            }
          }
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 20 }
        }
      }
    };
    rightChartComponent = Radar;
  } else {
    // Specific season view: Show teammate comparison bar chart
    const teammateData = {
      labels: [player.name, ...teammateStats.map(t => t.player.name)],
      datasets: [
        {
          label: 'PRF',
          data: [
            playerStats.PRF,
            ...teammateStats.map(t => {
              const s = t.stats!;
              return s.PRF;
            })
          ],
          backgroundColor: 'rgba(45, 60, 80, 0.2)',
          borderColor: 'rgba(45, 60, 80, 1)',
          borderWidth: 1
        }
      ]
    };
    
    rightChartData = teammateData;
    rightChartOptions = {
      responsive: true,
      plugins: {
        legend: { position: 'top' as const },
        title: {
          display: true,
          text: `${player.name} vs Teammates - PRF (Total)`
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    };
    rightChartComponent = Bar;
  }

    const radarOptions = {
    responsive: true,
    plugins: {
      legend: { 
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: `${player.name} vs League Average (Per Set)`
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const datasetIndex = context.datasetIndex;
            const dataIndex = context.dataIndex;
            
            // Get the actual per-set values
            let actualValue = 0;
            if (datasetIndex === 0) {
              // Player data
              const actualValues = [
                playerStats.spikeKills / playerStats.totalSets,
                playerStats.apeKills / playerStats.totalSets,
                playerStats.spikeAttempts / playerStats.totalSets,
                playerStats.apeAttempts / playerStats.totalSets,
                playerStats.blocks / playerStats.totalSets,
                playerStats.assists / playerStats.totalSets,
                playerStats.aces / playerStats.totalSets,
                playerStats.digs / playerStats.totalSets,
                playerStats.blockFollows / playerStats.totalSets,
                (playerStats.miscErrors + playerStats.spikingErrors + playerStats.settingErrors + playerStats.servingErrors) / playerStats.totalSets,
              ];
              actualValue = actualValues[dataIndex];
            } else {
              // League average data
              const actualValues = [
                leagueAverages.spikeKills / leagueAverages.totalSets,
                leagueAverages.apeKills / leagueAverages.totalSets,
                leagueAverages.spikeAttempts / leagueAverages.totalSets,
                leagueAverages.apeAttempts / leagueAverages.totalSets,
                leagueAverages.blocks / leagueAverages.totalSets,
                leagueAverages.assists / leagueAverages.totalSets,
                leagueAverages.aces / leagueAverages.totalSets,
                leagueAverages.digs / leagueAverages.totalSets,
                leagueAverages.blockFollows / leagueAverages.totalSets,
                (leagueAverages.miscErrors + leagueAverages.spikingErrors + leagueAverages.settingErrors + leagueAverages.servingErrors) / leagueAverages.totalSets,
              ];
              actualValue = actualValues[dataIndex];
            }
            
            return `${context.dataset.label}: ${label} (${actualValue.toFixed(2)} per set)`;
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { stepSize: 20 }
      }
    }
  };

  return (
    <div className="player-visualization">
      <div className="visualization-grid">
        <div className="visualization-chart">
          <Radar data={radarData} options={radarOptions} />
        </div>
        <div className="visualization-chart">
          {React.createElement(rightChartComponent, { data: rightChartData, options: rightChartOptions })}
        </div>
      </div>
    </div>
  );
};

export default PlayerStatsVisualization; 