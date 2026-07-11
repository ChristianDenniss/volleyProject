import React from "react";
import "./ui.css";

interface PageHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, actions }) => (
  <div className="ui-page-header">
    <h1 className="ui-page-title">{title}</h1>
    {actions && <div className="ui-page-actions">{actions}</div>}
  </div>
);

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, className = "" }) => (
  <div className={`ui-page-container ${className}`.trim()}>{children}</div>
);

export default PageContainer;
