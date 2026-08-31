import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/* The four arrow buttons are identical apart from their label and handler, so
   their utilities live in one constant rather than being repeated four times.

   Two values are deliberately arbitrary rather than scale steps: the 0.8125rem
   font size sits between text-xs and text-sm, and the 0.375rem radius is not
   the 8px that `rounded-md` resolves to under our tokens. Both are written
   literally so the rendered result is unchanged. */
const pageButton =
  "inline-flex items-center justify-center min-w-8 w-8 h-8 p-0 " +
  "text-[0.8125rem] leading-none font-semibold " +
  "bg-brand-primary text-white border-none rounded-[0.375rem] " +
  "cursor-pointer transition-[background-color] duration-200 ease-[ease] shrink-0 " +
  "enabled:hover:bg-brand-primary-hover " +
  "disabled:bg-[#e5e7eb] disabled:text-[#9ca3af] disabled:cursor-not-allowed";

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div
      className="inline-flex items-center justify-center gap-1 m-0 shrink-0 flex-nowrap whitespace-nowrap"
      role="navigation"
      aria-label="Pagination"
    >
      <button
        type="button"
        className={pageButton}
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        aria-label="First page"
        title="First page"
      >
        {"<<"}
      </button>

      <button
        type="button"
        className={pageButton}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        title="Previous page"
      >
        {"<"}
      </button>

      <span
        className="text-[0.8125rem] font-medium text-[#4b5563] px-1.5 min-w-12 text-center shrink-0"
        aria-live="polite"
      >
        {currentPage} / {totalPages}
      </span>

      <button
        type="button"
        className={pageButton}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        title="Next page"
      >
        {">"}
      </button>

      <button
        type="button"
        className={pageButton}
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
