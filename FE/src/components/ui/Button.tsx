import React from "react";
import "./ui.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  className = "",
  ...rest
}) => {
  return (
    <button className={`ui-btn ui-btn-${variant} ${className}`.trim()} {...rest} />
  );
};

export default Button;
