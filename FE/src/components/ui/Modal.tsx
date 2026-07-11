import React from "react";
import "./ui.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
  if (!isOpen) return null;

  return (
    <div className="ui-modal-overlay" onClick={onClose}>
      <div
        className={className ? `ui-modal ${className}` : "ui-modal"}
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
