import React from 'react';
import Select from 'react-select';

interface SeasonSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (seasonNumber: number) => void;
  seasons: number[];
  loading: boolean;
}

const SeasonSelectModal: React.FC<SeasonSelectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  seasons,
  loading
}) => {
  const [selectedSeason, setSelectedSeason] = React.useState<number>(0);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Select Season for Player Card</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <p>Choose which season's stats to include in your player card:</p>
          
          <div style={{ marginTop: '1rem' }}>
            <label htmlFor="season-select" style={{ color: "#ccc", marginBottom: "0.5rem", display: "block" }}>
              Season:
            </label>
            <Select
              id="season-select"
              value={{ value: selectedSeason, label: selectedSeason === 0 ? "Career" : `Season ${selectedSeason}` }}
              onChange={(option) => setSelectedSeason(option?.value || 0)}
              options={[
                { value: 0, label: "Career (All Seasons)" },
                ...seasons.map(season => ({ value: season, label: `Season ${season}` }))
              ]}
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: "#1a1a1a",
                  borderColor: "#333",
                  color: "#fff",
                  boxShadow: "none"
                }),
                singleValue: (base) => ({
                  ...base,
                  color: "#fff"
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: "#1a1a1a",
                  color: "#fff"
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? "#2c5a7d" : "#1a1a1a",
                  color: "#fff",
                  cursor: "pointer"
                }),
              }}
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="modal-button secondary" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="modal-button primary" 
            onClick={() => onConfirm(selectedSeason)}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Card'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeasonSelectModal; 