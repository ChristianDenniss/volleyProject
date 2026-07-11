import React from "react";
import "../styles/Pagination.css";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="pagination" role="navigation" aria-label="Pagination">
      <button
        type="button"
        className="pagination-btn"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        aria-label="First page"
        title="First page"
      >
        {"<<"}
      </button>

      <button
        type="button"
        className="pagination-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        title="Previous page"
      >
        {"<"}
      </button>

      <span className="pagination-current-page" aria-live="polite">
        {currentPage} / {totalPages}
      </span>

      <button
        type="button"
        className="pagination-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        title="Next page"
      >
        {">"}
      </button>

      <button
        type="button"
        className="pagination-btn"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        aria-label="Last page"
        title="Last page"
      >
        {">>"}
      </button>
    </div>
  );
};

export default Pagination;
