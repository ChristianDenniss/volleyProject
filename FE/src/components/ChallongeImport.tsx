import React, { useState } from 'react';
import { useSeasons } from '../hooks/allFetch';
import type { ImportChallongeInput } from '../types/interfaces';
import '../styles/ChallongeImport.css';

interface ChallongeImportProps {
  onImportSuccess: () => void;
  onCancel: () => void;
}

const ChallongeImport: React.FC<ChallongeImportProps> = ({ onImportSuccess, onCancel }) => {
  const { data: seasons } = useSeasons();
  const [formData, setFormData] = useState<Partial<ImportChallongeInput>>({
    challongeUrl: '',
    seasonId: 0,
    round: '',
    roundStartDate: '',
    roundEndDate: '',
    matchSpacingMinutes: 30,
    tags: [] // Array of tags to apply to imported matches
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.challongeUrl || !formData.seasonId || !formData.roundStartDate || !formData.roundEndDate) {
        throw new Error('Please fill in all required fields');
      }

      // Validate date range
      const startDate = new Date(formData.roundStartDate);
      const endDate = new Date(formData.roundEndDate);
      
      if (startDate >= endDate) {
        throw new Error('Round start date must be before round end date');
      }

      const response = await fetch('/api/matches/import-challonge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import matches');
      }

      const result = await response.json();
      alert(`Successfully imported ${result.matches.length} matches from Challonge!`);
      onImportSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ImportChallongeInput, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  return (
    <div className="challonge-import-overlay">
      <div className="challonge-import-modal">
        <div className="modal-header">
          <h2>Import Matches from Challonge</h2>
          <button className="close-button" onClick={onCancel}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="import-form">
          <div className="form-group">
            <label htmlFor="challongeUrl">Challonge URL *</label>
            <input
              type="url"
              id="challongeUrl"
              value={formData.challongeUrl}
              onChange={(e) => handleInputChange('challongeUrl', e.target.value)}
              placeholder="https://challonge.com/tournament_name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="seasonId">Season *</label>
            <select
              id="seasonId"
              value={formData.seasonId || ''}
              onChange={(e) => handleInputChange('seasonId', parseInt(e.target.value))}
              required
            >
              <option value="">Select a season</option>
              {seasons?.map(season => (
                <option key={season.id} value={season.id}>
                  Season {season.seasonNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="round">Round (Optional)</label>
            <input
              type="text"
              id="round"
              value={formData.round || ''}
              onChange={(e) => handleInputChange('round', e.target.value)}
              placeholder="e.g., 1, 2, Semi-Finals"
            />
            <small>Leave empty to import all rounds</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="roundStartDate">Round Start Date/Time *</label>
              <input
                type="datetime-local"
                id="roundStartDate"
                value={formData.roundStartDate}
                onChange={(e) => handleInputChange('roundStartDate', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="roundEndDate">Round End Date/Time *</label>
              <input
                type="datetime-local"
                id="roundEndDate"
                value={formData.roundEndDate}
                onChange={(e) => handleInputChange('roundEndDate', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="matchSpacingMinutes">Minutes Between Matches</label>
            <input
              type="number"
              id="matchSpacingMinutes"
              min="15"
              max="120"
              value={formData.matchSpacingMinutes || 30}
              onChange={(e) => handleInputChange('matchSpacingMinutes', parseInt(e.target.value))}
            />
            <small>For scheduling future matches (15-120 minutes)</small>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (optional, comma-separated)</label>
            <input
              type="text"
              id="tags"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => handleTagsChange(e.target.value)}
              placeholder="e.g., RVL, Invitational, D-League"
            />
            <small>Tags to apply to all imported matches</small>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="import-button">
              {loading ? 'Importing...' : 'Import Matches'}
            </button>
          </div>
        </form>

        <div className="import-info">
          <h3>How it works:</h3>
          <ul>
            <li><strong>Completed matches:</strong> Will be scheduled at the round start time</li>
            <li><strong>Scheduled matches:</strong> Will be spaced out within the round time window</li>
            <li><strong>Set scores:</strong> Will be imported if available from Challonge</li>
            <li><strong>Teams:</strong> Will be created automatically if they don't exist</li>
            <li><strong>Tags:</strong> Will be applied to all imported matches</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChallongeImport; 