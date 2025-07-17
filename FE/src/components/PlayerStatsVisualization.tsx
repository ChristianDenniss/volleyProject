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

type StatType = 'total' | 'perGame' | 'perSet';

interface PlayerStatsVisualizationProps {
  player: Player;
  allPlayers: Player[];
  selectedSeason: number | null;
  statType: StatType;
}

const PlayerStatsVisualization: React.FC<PlayerStatsVisualizationProps> = ({
  player,
  allPlayers,
  selectedSeason,
  statType
}) => {
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
    const keys = ['spikeKills', 'apeKills', 'blocks', 'assists', 'aces', 'digs', 'PRF', 'plusMinus', 'gamesPlayed', 'totalSets', 'totalKills', 'totalSpikePct'] as const;
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

  const playerStats = getPlayerStats(player);
  const leagueAverages = getLeagueAverages();
  const teammateStats = getTeammateStats();

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
    'PRF',
    'Plus/Minus'
  ];
  const radarData = {
    labels: radarLabels,
    datasets: [
      {
        label: player.name,
        data: [
          statType === 'total' ? playerStats.spikeKills : statType === 'perGame' ? playerStats.spikeKills / playerStats.gamesPlayed : playerStats.spikeKills / playerStats.totalSets,
          statType === 'total' ? playerStats.apeKills : statType === 'perGame' ? playerStats.apeKills / playerStats.gamesPlayed : playerStats.apeKills / playerStats.totalSets,
          statType === 'total' ? playerStats.spikeAttempts : statType === 'perGame' ? playerStats.spikeAttempts / playerStats.gamesPlayed : playerStats.spikeAttempts / playerStats.totalSets,
          statType === 'total' ? playerStats.apeAttempts : statType === 'perGame' ? playerStats.apeAttempts / playerStats.gamesPlayed : playerStats.apeAttempts / playerStats.totalSets,
          statType === 'total' ? playerStats.blocks : statType === 'perGame' ? playerStats.blocks / playerStats.gamesPlayed : playerStats.blocks / playerStats.totalSets,
          statType === 'total' ? playerStats.assists : statType === 'perGame' ? playerStats.assists / playerStats.gamesPlayed : playerStats.assists / playerStats.totalSets,
          statType === 'total' ? playerStats.aces : statType === 'perGame' ? playerStats.aces / playerStats.gamesPlayed : playerStats.aces / playerStats.totalSets,
          statType === 'total' ? playerStats.digs : statType === 'perGame' ? playerStats.digs / playerStats.gamesPlayed : playerStats.digs / playerStats.totalSets,
          statType === 'total' ? playerStats.PRF : statType === 'perGame' ? playerStats.PRF / playerStats.gamesPlayed : playerStats.PRF / playerStats.totalSets,
          statType === 'total' ? playerStats.plusMinus : statType === 'perGame' ? playerStats.plusMinus / playerStats.gamesPlayed : playerStats.plusMinus / playerStats.totalSets,
        ],
        backgroundColor: 'rgba(45, 60, 80, 0.2)',
        borderColor: 'rgba(45, 60, 80, 1)',
        borderWidth: 2,
      },
      {
        label: 'League Average',
        data: [
          statType === 'total' ? leagueAverages.spikeKills : statType === 'perGame' ? leagueAverages.spikeKills / leagueAverages.gamesPlayed : leagueAverages.spikeKills / leagueAverages.totalSets,
          statType === 'total' ? leagueAverages.apeKills : statType === 'perGame' ? leagueAverages.apeKills / leagueAverages.gamesPlayed : leagueAverages.apeKills / leagueAverages.totalSets,
          statType === 'total' ? leagueAverages.spikeAttempts : statType === 'perGame' ? leagueAverages.spikeAttempts / leagueAverages.gamesPlayed : leagueAverages.spikeAttempts / leagueAverages.totalSets,
          statType === 'total' ? leagueAverages.apeAttempts : statType === 'perGame' ? leagueAverages.apeAttempts / leagueAverages.gamesPlayed : leagueAverages.apeAttempts / leagueAverages.totalSets,
          statType === 'total' ? leagueAverages.blocks : statType === 'perGame' ? leagueAverages.blocks / leagueAverages.gamesPlayed : leagueAverages.blocks / leagueAverages.totalSets,
          statType === 'total' ? leagueAverages.assists : statType === 'perGame' ? leagueAverages.assists / leagueAverages.gamesPlayed : leagueAverages.assists / leagueAverages.totalSets,
          statType === 'total' ? leagueAverages.aces : statType === 'perGame' ? leagueAverages.aces / leagueAverages.gamesPlayed : leagueAverages.aces / leagueAverages.totalSets,
          statType === 'total' ? leagueAverages.digs : statType === 'perGame' ? leagueAverages.digs / leagueAverages.gamesPlayed : leagueAverages.digs / leagueAverages.totalSets,
          statType === 'total' ? leagueAverages.PRF : statType === 'perGame' ? leagueAverages.PRF / leagueAverages.gamesPlayed : leagueAverages.PRF / leagueAverages.totalSets,
          statType === 'total' ? leagueAverages.plusMinus : statType === 'perGame' ? leagueAverages.plusMinus / leagueAverages.gamesPlayed : leagueAverages.plusMinus / leagueAverages.totalSets,
        ],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
      }
    ]
  };

  // Bar chart: player vs teammates (PRF)
  const teammateData = {
    labels: [player.name, ...teammateStats.map(t => t.player.name)],
    datasets: [
      {
        label: 'PRF',
        data: [
          statType === 'total' ? playerStats.PRF : statType === 'perGame' ? playerStats.PRF / playerStats.gamesPlayed : playerStats.PRF / playerStats.totalSets,
          ...teammateStats.map(t => {
            const s = t.stats!;
            return statType === 'total' ? s.PRF : statType === 'perGame' ? s.PRF / s.gamesPlayed : s.PRF / s.totalSets;
          })
        ],
        backgroundColor: 'rgba(45, 60, 80, 0.2)',
        borderColor: 'rgba(45, 60, 80, 1)',
        borderWidth: 1
      }
    ]
  };

  const radarOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: {
        display: true,
        text: `${player.name} vs League Average (${statType === 'perGame' ? 'Per Game' : statType === 'perSet' ? 'Per Set' : 'Total'})`
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    }
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: {
        display: true,
        text: `${player.name} vs Teammates - PRF (${statType === 'perGame' ? 'Per Game' : statType === 'perSet' ? 'Per Set' : 'Total'})`
      }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  return (
    <div className="player-visualization">
      <div className="visualization-grid">
        <div className="visualization-chart">
          <Radar data={radarData} options={radarOptions} />
        </div>
        <div className="visualization-chart">
          <Bar data={teammateData} options={barOptions} />
        </div>
      </div>
      <div className="visualization-stats">
        <div className="stats-summary">
          <h4>Season Summary</h4>
          <div className="stats-grid">
            <div className="stat-item"><span className="stat-label">Games Played:</span> <span className="stat-value">{playerStats.gamesPlayed}</span></div>
            <div className="stat-item"><span className="stat-label">Total Sets:</span> <span className="stat-value">{playerStats.totalSets}</span></div>
            <div className="stat-item"><span className="stat-label">Spike Attempts:</span> <span className="stat-value">{playerStats.spikeAttempts}</span></div>
            <div className="stat-item"><span className="stat-label">Ape Attempts:</span> <span className="stat-value">{playerStats.apeAttempts}</span></div>
            <div className="stat-item"><span className="stat-label">Spike Kills:</span> <span className="stat-value">{playerStats.spikeKills}</span></div>
            <div className="stat-item"><span className="stat-label">Ape Kills:</span> <span className="stat-value">{playerStats.apeKills}</span></div>
            <div className="stat-item"><span className="stat-label">Total Kills:</span> <span className="stat-value">{playerStats.totalKills}</span></div>
            <div className="stat-item"><span className="stat-label">Total Attempts:</span> <span className="stat-value">{playerStats.totalAttempts}</span></div>
            <div className="stat-item"><span className="stat-label">Kill %:</span> <span className="stat-value">{(playerStats.totalSpikePct * 100).toFixed(1)}%</span></div>
            <div className="stat-item"><span className="stat-label">PRF:</span> <span className="stat-value">{playerStats.PRF}</span></div>
            <div className="stat-item"><span className="stat-label">Plus/Minus:</span> <span className="stat-value">{playerStats.plusMinus}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatsVisualization; 