import React, { useState } from 'react';
import { useSeasons } from '../hooks/allFetch';
import { authFetch } from '../hooks/authFetch';
import { useAuth } from '../context/authContext';
import type { ImportChallongeInput, ChallongeImportResult } from '../types/interfaces';
import '../styles/ChallongeImport.css';

interface ChallongeImportProps {
  onImportSuccess: (result: ChallongeImportResult) => void;
  onCancel: () => void;
}

const ChallongeImport: React.FC<ChallongeImportProps> = ({ onImportSuccess, onCancel }) => {
  const { data: seasons } = useSeasons();
  const { token } = useAuth();
  const [formData, setFormData] = useState<Partial<ImportChallongeInput>>({
    challongeUrl: '',
    seasonId: 0,
    round: '',
    roundStartDate: '',
    roundEndDate: '',
    matchSpacingMinutes: 30,
    phase: 'qualifiers',
    region: 'na',
    tags: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{ participantName: string; reason: string }>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setValidationErrors([]);

    try {
      if (!formData.challongeUrl || !formData.seasonId || !formData.roundStartDate || !formData.roundEndDate) {
        throw new Error('Please fill in all required fields');
      }

      const startDate = new Date(formData.roundStartDate);
      const endDate = new Date(formData.roundEndDate);
      if (startDate >= endDate) {
        throw new Error('Round start date must be before round end date');
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await authFetch(`${backendUrl}/api/games/import-challonge`, {
        method: 'POST',
        body: JSON.stringify(formData),
      }, token);

      const result: ChallongeImportResult = await response.json();

      if (!response.ok || !result.success) {
        if (result.unmatchedTeams?.length) {
          setValidationErrors(result.unmatchedTeams.map(t => ({
            participantName: t.participantName,
            reason: t.reason,
          })));
        }
        throw new Error(result.error || 'Failed to import games from Challonge');
      }

      onImportSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ImportChallongeInput, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setFormData(prev => ({ ...prev, tags }));
  };

  return (
    <div className="challonge-import-overlay">
      <div className="challonge-import-modal">
        <div className="modal-header">
          <h2>Import Games from Challonge</h2>
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
              placeholder="https://challonge.com/ch2s2na"
              required
            />
          </div>

          <div className="form-row form-row-3">
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
              <label htmlFor="phase">Phase *</label>
              <select
                id="phase"
                value={formData.phase || 'qualifiers'}
                onChange={(e) => handleInputChange('phase', e.target.value)}
                required
              >
                <option value="pre_season">Pre-Season</option>
                <option value="qualifiers">Qualifiers</option>
                <option value="playoffs">Playoffs</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="region">Region *</label>
              <select
                id="region"
                value={formData.region || 'na'}
                onChange={(e) => handleInputChange('region', e.target.value)}
                required
              >
                <option value="na">North American</option>
                <option value="eu">European</option>
                <option value="as">Asian</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="round">Challonge Round Filter (Optional)</label>
              <input
                type="text"
                id="round"
                value={formData.round || ''}
                onChange={(e) => handleInputChange('round', e.target.value)}
                placeholder="e.g., 1 or Round 1"
              />
              <small>Leave empty to import all rounds</small>
            </div>

            <div className="form-group">
              <label htmlFor="matchSpacingMinutes">Minutes Between Games</label>
              <input
                type="number"
                id="matchSpacingMinutes"
                min="15"
                max="120"
                value={formData.matchSpacingMinutes || 30}
                onChange={(e) => handleInputChange('matchSpacingMinutes', parseInt(e.target.value))}
              />
            </div>
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
            <label htmlFor="tags">Tags (optional, comma-separated)</label>
            <input
              type="text"
              id="tags"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => handleTagsChange(e.target.value)}
              placeholder="e.g., RVL, Invitational"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          {validationErrors.length > 0 && (
            <div className="error-message">
              <strong>Unmatched teams:</strong>
              <ul>
                {validationErrors.map((item, idx) => (
                  <li key={idx}>{item.participantName}: {item.reason}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
            <button type="submit" disabled={loading} className="import-button">
              {loading ? 'Importing...' : 'Import Games'}
            </button>
          </div>
        </form>

        <div className="import-info">
          <h3>How it works:</h3>
          <ul>
            <li><strong>Teams must exist</strong> in the selected season before import — none are created automatically</li>
            <li><strong>All-or-nothing:</strong> if any team cannot be matched, the entire import is aborted</li>
            <li><strong>Re-import:</strong> existing games update only when teams match; identical games are skipped</li>
            <li><strong>Stages:</strong> Swiss/qualifier rounds map to &quot;Round N&quot;; playoffs use clean labels like &quot;Round of 16&quot; with winners/losers on the bracket field</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChallongeImport;
