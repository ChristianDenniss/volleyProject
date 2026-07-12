import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./ui.css";

export interface OverflowListCellProps {
  items: string[];
  separator?: string;
  /** How many items to show inline before the + button. */
  maxVisible?: number;
  emptyLabel?: React.ReactNode;
  className?: string;
  popoverTitle?: string;
}

const OverflowListCell: React.FC<OverflowListCellProps> = ({
  items,
  separator = ", ",
  maxVisible = 2,
  emptyLabel = "—",
  className,
  popoverTitle,
}) => {
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  const hiddenCount = Math.max(0, items.length - maxVisible);
  const visibleItems = hiddenCount > 0 ? items.slice(0, maxVisible) : items;
  const visibleText = visibleItems.join(separator);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    setPopoverStyle({
      left: rect.left + rect.width / 2,
      bottom: window.innerHeight - rect.top + 8,
    });
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const toggleOpen = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (hiddenCount === 0) return;

    if (!open) {
      updatePosition();
      setOpen(true);
      return;
    }

    close();
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      close();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    const handleReposition = () => updatePosition();

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, close, updatePosition]);

  if (items.length === 0) {
    return <span className={className}>{emptyLabel}</span>;
  }

  return (
    <span
      className={`ui-overflow-list${className ? ` ${className}` : ""}`}
      onClick={(event) => event.stopPropagation()}
    >
      <span className="ui-overflow-list-text">
        {visibleText}
        {hiddenCount > 0 && (
          <>
            {" "}
            <button
              ref={triggerRef}
              type="button"
              className="ui-overflow-list-trigger"
              onClick={toggleOpen}
              aria-expanded={open}
              aria-controls={popoverId}
              aria-label={`Show ${hiddenCount} more item${hiddenCount === 1 ? "" : "s"}`}
            >
              +{hiddenCount}
            </button>
          </>
        )}
      </span>
      {open &&
        createPortal(
          <div
            ref={popoverRef}
            id={popoverId}
            role="tooltip"
            className="ui-overflow-list-popover"
            style={popoverStyle}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {popoverTitle && (
              <div className="ui-overflow-list-popover-title">{popoverTitle}</div>
            )}
            <ul className="ui-overflow-list-popover-items">
              {items.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>,
          document.body
        )}
    </span>
  );
};

export default OverflowListCell;
