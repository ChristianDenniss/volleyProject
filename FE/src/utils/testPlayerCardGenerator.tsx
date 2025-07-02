import React, { useEffect, useState } from 'react';
import { generatePlayerCard } from './playerCardGenerator';
import luvlate2 from '../images/luvlate2.png';

const mockPlayer = {
  name: 'LuvLate',
  position: 'Setter',
  teams: [
    { name: 'Blue Whales', season: { seasonNumber: 13 } },
    { name: 'Red Foxes', season: { seasonNumber: 14 } },
  ],
};

const mockStats = [
  { spikeKills: 120, spikeAttempts: 200, apeKills: 30, apeAttempts: 50, spikingErrors: 10, digs: 80, blocks: 25, assists: 200, aces: 8, settingErrors: 5, blockFollows: 12, servingErrors: 3, miscErrors: 2, game: { season: { seasonNumber: 14 } } },
  { spikeKills: 100, spikeAttempts: 180, apeKills: 25, apeAttempts: 40, spikingErrors: 8, digs: 70, blocks: 20, assists: 180, aces: 6, settingErrors: 4, blockFollows: 10, servingErrors: 2, miscErrors: 1, game: { season: { seasonNumber: 14 } } },
];

const mockAwards = [
  { id: 1, type: 'MVP', season: { seasonNumber: 14 } },
  { id: 2, type: 'Best Setter', season: { seasonNumber: 14 } },
];

const seasonTotals = mockStats.reduce((acc, stat) => ({
  spikeKills: acc.spikeKills + stat.spikeKills,
  spikeAttempts: acc.spikeAttempts + stat.spikeAttempts,
  apeKills: acc.apeKills + stat.apeKills,
  apeAttempts: acc.apeAttempts + stat.apeAttempts,
  spikingErrors: acc.spikingErrors + stat.spikingErrors,
  digs: acc.digs + stat.digs,
  blocks: acc.blocks + stat.blocks,
  assists: acc.assists + stat.assists,
  aces: acc.aces + stat.aces,
  settingErrors: acc.settingErrors + stat.settingErrors,
  blockFollows: acc.blockFollows + stat.blockFollows,
  servingErrors: acc.servingErrors + stat.servingErrors,
  miscErrors: acc.miscErrors + stat.miscErrors,
  gamesPlayed: acc.gamesPlayed + 1
}), {
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
  gamesPlayed: 0
});

const seasonAverages = {
  spikeKills: seasonTotals.gamesPlayed ? (seasonTotals.spikeKills / seasonTotals.gamesPlayed).toFixed(1) : "0",
  spikeAttempts: seasonTotals.gamesPlayed ? (seasonTotals.spikeAttempts / seasonTotals.gamesPlayed).toFixed(1) : "0",
  apeKills: seasonTotals.gamesPlayed ? (seasonTotals.apeKills / seasonTotals.gamesPlayed).toFixed(1) : "0",
  apeAttempts: seasonTotals.gamesPlayed ? (seasonTotals.apeAttempts / seasonTotals.gamesPlayed).toFixed(1) : "0",
  spikingErrors: seasonTotals.gamesPlayed ? (seasonTotals.spikingErrors / seasonTotals.gamesPlayed).toFixed(1) : "0",
  digs: seasonTotals.gamesPlayed ? (seasonTotals.digs / seasonTotals.gamesPlayed).toFixed(1) : "0",
  blocks: seasonTotals.gamesPlayed ? (seasonTotals.blocks / seasonTotals.gamesPlayed).toFixed(1) : "0",
  assists: seasonTotals.gamesPlayed ? (seasonTotals.assists / seasonTotals.gamesPlayed).toFixed(1) : "0",
  aces: seasonTotals.gamesPlayed ? (seasonTotals.aces / seasonTotals.gamesPlayed).toFixed(1) : "0",
  settingErrors: seasonTotals.gamesPlayed ? (seasonTotals.settingErrors / seasonTotals.gamesPlayed).toFixed(1) : "0",
  blockFollows: seasonTotals.gamesPlayed ? (seasonTotals.blockFollows / seasonTotals.gamesPlayed).toFixed(1) : "0",
  servingErrors: seasonTotals.gamesPlayed ? (seasonTotals.servingErrors / seasonTotals.gamesPlayed).toFixed(1) : "0",
  miscErrorsPerGame: seasonTotals.gamesPlayed ? (seasonTotals.miscErrors / seasonTotals.gamesPlayed).toFixed(1) : "0"
};

const avatarUrl = luvlate2;

const TestPlayerCardGenerator: React.FC = () => {
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    generatePlayerCard({
      player: mockPlayer,
      seasonStats: seasonTotals,
      seasonAverages,
      awards: mockAwards,
      avatarUrl,
      seasonNumber: 14,
    }).then(url => {
      setCardUrl(url);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ background: '#222', minHeight: '100vh', padding: 40 }}>
      <h2 style={{ color: '#fff' }}>Test Player Card Generator</h2>
      {loading && <p style={{ color: '#fff' }}>Generating...</p>}
      {cardUrl && (
        <img
          src={cardUrl}
          alt="Generated Player Card"
          style={{ width: 1100, height: 700, border: '2px solid #4a90e2', borderRadius: 12, marginTop: 20 }}
        />
      )}
    </div>
  );
};

export default TestPlayerCardGenerator; 