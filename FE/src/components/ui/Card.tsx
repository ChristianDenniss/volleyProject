import React from "react";
import "./ui.css";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  return <div className={`ui-card ${className}`.trim()}>{children}</div>;
};

export default Card;
