import React, { useState } from 'react';
import { parseCSV } from '../../utils/csvParser';
import { useAddStatsToExistingGame } from '../../hooks/allCreate';
import type { Game } from '../../types/interfaces';
import Modal from '../ui/Modal';

interface GameStatUploadModalProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const GameStatUploadModal: React.FC<GameStatUploadModalProps> = ({ game, isOpen, onClose, onSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const { addStatsToGame, loading } = useAddStatsToExistingGame((err: { message?: string }) => setError(err.message ?? 'Upload failed'));

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !game) return;

    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = parseCSV(content, 'add');

        if (!parsed.statsData.length) {
          throw new Error('No player stats found in CSV');
        }

        const result = await addStatsToGame(game.id, parsed.statsData);
        if (result) {
          onSuccess();
          onClose();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen || !game) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Upload Stats — ${game.name || `Game #${game.id}`}`}>
      <p style={{ marginBottom: '1rem' }}>
        Upload a stat sheet CSV for this game. Stats will be attached to game #{game.id}.
      </p>
      <input type="file" accept=".csv" onChange={handleFileChange} disabled={loading} />
      {loading && <p style={{ marginTop: '0.75rem' }}>Uploading stats…</p>}
      {error && <p style={{ color: 'red', marginTop: '0.75rem' }}>{error}</p>}
    </Modal>
  );
};

export default GameStatUploadModal;
