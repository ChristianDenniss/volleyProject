import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "../ui/ui.css";
import "../../styles/PortalLayout.css";

const PortalLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className={`portal-wrapper${isSidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <aside className="portal-sidebar" aria-hidden={isSidebarCollapsed}>
        <div className="portal-sidebar-content">
          <h2>Admin Portal</h2>
          <nav>
            <ul>
              <li><NavLink end to="">Dashboard</NavLink></li>
              <li><NavLink to="users">Users</NavLink></li>
              <li><NavLink to="seasons">Seasons</NavLink></li>
              <li><NavLink to="teams">Teams</NavLink></li>
              <li><NavLink to="players">Players</NavLink></li>
              <li><NavLink to="games">Games</NavLink></li>
              <li><NavLink to="stats">Stats</NavLink></li>
              <li><NavLink to="articles">Articles</NavLink></li>
              <li><NavLink to="applications">Applications</NavLink></li>
              <li><NavLink to="awards">Awards</NavLink></li>
            </ul>
          </nav>
        </div>

        <button
          type="button"
          className="portal-sidebar-toggle"
          onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
          aria-label={isSidebarCollapsed ? "Show admin sidebar" : "Hide admin sidebar"}
          aria-expanded={!isSidebarCollapsed}
          title={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
        >
          {isSidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </aside>

      <main className="portal-main">
        <Outlet />
      </main>
    </div>
  );
};

export default PortalLayout;
