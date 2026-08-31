import React, { useEffect, useState } from 'react';
import { authFetch } from '../hooks/authFetch';
import { useAuth } from '../context/authContext';
import { BACKEND_URL } from '../constants/api';
import { useFormRegionSeason } from '../hooks/useFormRegionSeason';
import RegionSeasonFields from './ui/RegionSeasonFields';
import type { ImportChallongeInput, ChallongeImportResult } from '../types/interfaces';

const overlay =
  "fixed inset-0 bg-[rgba(0,0,0,0.5)] flex justify-center items-center z-[1000]";

const modal =
  "challonge-import-modal bg-white rounded-[12px] p-0 w-[min(1100px,94vw)] max-w-[1100px] " +
  "max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.3)] " +
  "upto-640:w-[95%] upto-640:m-[20px]";

const header =
  "flex justify-between items-center pt-[24px] px-[24px] pb-0 border-b border-solid " +
  "border-[#e5e7eb] mb-[24px]";

const headerTitle = "m-0 text-[#1f2937] text-[1.5rem] font-semibold";

const closeButton =
  "bg-transparent border-none text-[24px] cursor-pointer text-[#6b7280] p-[4px] " +
  "rounded-sm transition-colors duration-200 hover:text-[#1f2937]";

const importForm = "pt-0 px-[24px] pb-[24px]";

const formGroup = "form-group mb-[20px] min-w-0";

const formGroupInRow = "form-group mb-0 min-w-0";

const fieldLabel = "block mb-[6px] font-medium text-[#374151] text-[0.875rem]";

const fieldInput =
  "w-full max-w-full min-w-0 box-border py-[10px] px-[12px] border border-solid " +
  "border-[#d1d5db] rounded-[6px] text-[0.875rem] " +
  "transition-[border-color,box-shadow] duration-200 " +
  "focus:outline-none focus:border-brand-primary focus:shadow-[0_0_0_3px_rgba(45,60,80,0.1)]";

const tagsInput = `${fieldInput} max-w-[520px]`;

const fieldHint = "block mt-[4px] text-[#6b7280] text-[0.75rem]";

const formRow =
  "grid grid-cols-2 gap-[16px] mb-[20px] upto-640:grid-cols-1";

const formRow3 =
  "grid grid-cols-3 gap-[16px] mb-[20px] upto-lg:grid-cols-1";

const errorBox =
  "bg-[#fef2f2] border border-solid border-[#fecaca] text-[#dc2626] p-[12px] " +
  "rounded-[6px] mb-[20px] text-[0.875rem]";

const formActions =
  "flex gap-[12px] justify-end mt-[24px] pt-[20px] border-t border-solid border-[#e5e7eb] " +
  "upto-640:flex-col";

const cancelButton =
  "py-[10px] px-[20px] border border-solid border-[#d1d5db] bg-white text-[#374151] " +
  "rounded-[6px] cursor-pointer text-[0.875rem] font-medium transition-all duration-200 " +
  "hover:bg-[#f9fafb] hover:border-[#9ca3af] upto-640:w-full";

const importButton =
  "py-[10px] px-[20px] border-none bg-brand-primary text-white rounded-[6px] cursor-pointer " +
  "text-[0.875rem] font-medium transition-colors duration-200 " +
  "hover:enabled:bg-brand-primary-hover disabled:bg-[#9ca3af] disabled:cursor-not-allowed " +
  "upto-640:w-full";

const importInfo =
  "bg-[#f8fafc] py-[20px] px-[24px] border-t border-solid border-[#e5e7eb]";

const importInfoTitle = "mt-0 mx-0 mb-[12px] text-[#1f2937] text-[1rem] font-semibold";

const importInfoList =
  "m-0 pl-[20px] text-[#4b5563] text-[0.875rem] leading-[1.5]";

const importInfoItem = "mb-[6px]";

const importInfoStrong = "text-[#1f2937]";

interface ChallongeImportProps {
  onImportSuccess: (result: ChallongeImportResult) => void;
  onCancel: () => void;
}

const ChallongeImport: React.FC<ChallongeImportProps> = ({ onImportSuccess, onCancel }) => {
  const formRegionSeason = useFormRegionSeason('id');
  const { token } = useAuth();
  const [formData, setFormData] = useState<Partial<ImportChallongeInput>>({
    challongeUrl: '',
    round: '',
    roundStartDate: '',
    roundEndDate: '',
    matchSpacingMinutes: 30,
    phase: 'qualifiers',
    tags: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{ participantName: string; reason: string }>>([]);

  useEffect(() => {
    formRegionSeason.initFromActiveRegion();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setValidationErrors([]);

    try {
      if (
        !formData.challongeUrl ||
        !formRegionSeason.regionId ||
        formRegionSeason.seasonValue === "" ||
        !formData.roundStartDate ||
        !formData.roundEndDate
      ) {
        throw new Error('Please fill in all required fields');
      }

      const startDate = new Date(formData.roundStartDate);
      const endDate = new Date(formData.roundEndDate);
      if (startDate >= endDate) {
        throw new Error('Round start date must be before round end date');
      }

      const payload: ImportChallongeInput = {
        challongeUrl: formData.challongeUrl,
        seasonId: formRegionSeason.seasonValue as number,
        round: formData.round,
        roundStartDate: formData.roundStartDate,
        roundEndDate: formData.roundEndDate,
        matchSpacingMinutes: formData.matchSpacingMinutes ?? 30,
        phase: formData.phase ?? 'qualifiers',
        region: formRegionSeason.selectedRegion?.code ?? 'na',
        tags: formData.tags,
      };

      const backendUrl = BACKEND_URL;
      const response = await authFetch(`${backendUrl}/api/games/import-challonge`, {
        method: 'POST',
        body: JSON.stringify(payload),
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
    <div className={overlay}>
      <div className={modal}>
        <div className={header}>
          <h2 className={headerTitle}>Import Games from Challonge</h2>
          <button className={closeButton} onClick={onCancel}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className={importForm}>
          <div className={formGroup}>
            <label htmlFor="challongeUrl" className={fieldLabel}>Challonge URL *</label>
            <input
              type="url"
              id="challongeUrl"
              value={formData.challongeUrl}
              onChange={(e) => handleInputChange('challongeUrl', e.target.value)}
              placeholder="https://challonge.com/ch2s2na"
              required
              className={fieldInput}
            />
          </div>

          <RegionSeasonFields
            regions={formRegionSeason.regions}
            regionsLoading={formRegionSeason.regionsLoading}
            regionId={formRegionSeason.regionId}
            onRegionChange={formRegionSeason.setRegionId}
            seasons={formRegionSeason.seasons}
            seasonsLoading={formRegionSeason.seasonsLoading}
            seasonValue={formRegionSeason.seasonValue}
            onSeasonChange={formRegionSeason.setSeasonValue}
            seasonValueKey="id"
          />

          <div className={formRow3}>
            <div className={formGroupInRow}>
              <label htmlFor="phase" className={fieldLabel}>Phase *</label>
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
          </div>

          <div className={formRow}>
            <div className={formGroupInRow}>
              <label htmlFor="round" className={fieldLabel}>Challonge Round Filter (Optional)</label>
              <input
                type="text"
                id="round"
                value={formData.round || ''}
                onChange={(e) => handleInputChange('round', e.target.value)}
                placeholder="e.g., 1 or Round 1"
                className={fieldInput}
              />
              <small className={fieldHint}>Leave empty to import all rounds</small>
            </div>

            <div className={formGroupInRow}>
              <label htmlFor="matchSpacingMinutes" className={fieldLabel}>Minutes Between Games</label>
              <input
                type="number"
                id="matchSpacingMinutes"
                min="15"
                max="120"
                value={formData.matchSpacingMinutes || 30}
                onChange={(e) => handleInputChange('matchSpacingMinutes', parseInt(e.target.value))}
                className={fieldInput}
              />
            </div>
          </div>

          <div className={formRow}>
            <div className={formGroupInRow}>
              <label htmlFor="roundStartDate" className={fieldLabel}>Round Start Date/Time *</label>
              <input
                type="datetime-local"
                id="roundStartDate"
                value={formData.roundStartDate}
                onChange={(e) => handleInputChange('roundStartDate', e.target.value)}
                required
                className={fieldInput}
              />
            </div>

            <div className={formGroupInRow}>
              <label htmlFor="roundEndDate" className={fieldLabel}>Round End Date/Time *</label>
              <input
                type="datetime-local"
                id="roundEndDate"
                value={formData.roundEndDate}
                onChange={(e) => handleInputChange('roundEndDate', e.target.value)}
                required
                className={fieldInput}
              />
            </div>
          </div>

          <div className={formGroup}>
            <label htmlFor="tags" className={fieldLabel}>Tags (optional, comma-separated)</label>
            <input
              type="text"
              id="tags"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => handleTagsChange(e.target.value)}
              placeholder="e.g., RVL, Invitational"
              className={tagsInput}
            />
          </div>

          {error && <div className={errorBox}>{error}</div>}

          {validationErrors.length > 0 && (
            <div className={errorBox}>
              <strong>Unmatched teams:</strong>
              <ul>
                {validationErrors.map((item, idx) => (
                  <li key={idx}>{item.participantName}: {item.reason}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={formActions}>
            <button type="button" onClick={onCancel} className={cancelButton}>Cancel</button>
            <button type="submit" disabled={loading} className={importButton}>
              {loading ? 'Importing...' : 'Import Games'}
            </button>
          </div>
        </form>

        <div className={importInfo}>
          <h3 className={importInfoTitle}>How it works:</h3>
          <ul className={importInfoList}>
            <li className={importInfoItem}><strong className={importInfoStrong}>Teams must exist</strong> in the selected season before import — none are created automatically</li>
            <li className={importInfoItem}><strong className={importInfoStrong}>All-or-nothing:</strong> if any team cannot be matched, the entire import is aborted</li>
            <li className={importInfoItem}><strong className={importInfoStrong}>Re-import:</strong> existing games update only when teams match; identical games are skipped</li>
            <li className={importInfoItem}><strong className={importInfoStrong}>Stages:</strong> Swiss/qualifier rounds map to &quot;Round N&quot;; playoffs use clean labels like &quot;Round of 16&quot; with winners/losers on the bracket field</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChallongeImport;
