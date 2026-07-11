import React from "react";
import "./ui.css";

interface FilterBarProps {
  children: React.ReactNode;
  onReset?: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ children, onReset }) => (
  <div className="ui-filter-bar">
    <div className="ui-filter-bar-fields">{children}</div>
    {onReset && (
      <button type="button" className="ui-btn ui-btn-secondary" onClick={onReset}>
        Reset
      </button>
    )}
  </div>
);

export default FilterBar;
