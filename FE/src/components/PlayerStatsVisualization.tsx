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
          playerStats.spikeKills / playerStats.totalSets,
          playerStats.apeKills / playerStats.totalSets,
          playerStats.spikeAttempts / playerStats.totalSets,
          playerStats.apeAttempts / playerStats.totalSets,
          playerStats.blocks / playerStats.totalSets,
          playerStats.assists / playerStats.totalSets,
          playerStats.aces / playerStats.totalSets,
          playerStats.digs / playerStats.totalSets,
          playerStats.PRF / playerStats.totalSets,
          playerStats.plusMinus / playerStats.totalSets,
        ],
        backgroundColor: 'rgba(45, 60, 80, 0.2)',
        borderColor: 'rgba(45, 60, 80, 1)',
        borderWidth: 2,
      },
      {
        label: 'League Average',
        data: [
          leagueAverages.spikeKills / leagueAverages.totalSets,
          leagueAverages.apeKills / leagueAverages.totalSets,
          leagueAverages.spikeAttempts / leagueAverages.totalSets,
          leagueAverages.apeAttempts / leagueAverages.totalSets,
          leagueAverages.blocks / leagueAverages.totalSets,
          leagueAverages.assists / leagueAverages.totalSets,
          leagueAverages.aces / leagueAverages.totalSets,
          leagueAverages.digs / leagueAverages.totalSets,
          leagueAverages.PRF / leagueAverages.totalSets,
          leagueAverages.plusMinus / leagueAverages.totalSets,
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

  const radarOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: {
        display: true,
        text: `${player.name} vs League Average (Per Set)`
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
        text: `${player.name} vs Teammates - PRF (Total)`
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
    </div>
  );
};

export default PlayerStatsVisualization; 