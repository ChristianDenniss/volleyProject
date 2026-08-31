import React, { useEffect } from "react";
import "./ui.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ui-modal-overlay" onClick={onClose}>
      <div
        className={className ? `ui-modal ${className}` : "ui-modal"}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ui-modal-header">
          <h2>{title}</h2>
          <button
            type="button"
            className="ui-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="ui-modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
