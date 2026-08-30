import React, { Suspense, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "../ui/ui.css";
import "../../styles/PortalLayout.css";

/** Prefetch portal page chunks on hover/focus so nav feels instant. */
const PORTAL_PREFETCH: Record<string, () => Promise<unknown>> = {
  "": () => import("./Dashboard"),
  users: () => import("./UsersPage"),
  seasons: () => import("./SeasonsPage"),
  teams: () => import("./TeamsPage"),
  players: () => import("./PlayersPage"),
  games: () => import("./GamesPage"),
  stats: () => import("./StatsPage"),
  articles: () => import("./ArticlesPage"),
  registrations: () => import("./RegistrationsHubPage"),
  applications: () => import("./ApplicationsPage"),
  awards: () => import("./AwardsPage"),
};

/** Warm the chunk for a section before the click lands. */
const prefetch = (to: string) => () => {
  void PORTAL_PREFETCH[to]?.();
};

const PortalLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className={`portal-wrapper${isSidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <aside className="portal-sidebar" aria-hidden={isSidebarCollapsed}>
        <div className="portal-sidebar-content">
          <h2>Admin Portal</h2>
          <nav>
            <ul>
              <li><NavLink end to="" onMouseEnter={prefetch("")} onFocus={prefetch("")}>Dashboard</NavLink></li>
              <li><NavLink to="users" onMouseEnter={prefetch("users")} onFocus={prefetch("users")}>Users</NavLink></li>
              <li><NavLink to="seasons" onMouseEnter={prefetch("seasons")} onFocus={prefetch("seasons")}>Seasons</NavLink></li>
              <li><NavLink to="teams" onMouseEnter={prefetch("teams")} onFocus={prefetch("teams")}>Teams</NavLink></li>
              <li><NavLink to="players" onMouseEnter={prefetch("players")} onFocus={prefetch("players")}>Players</NavLink></li>
              <li><NavLink to="games" onMouseEnter={prefetch("games")} onFocus={prefetch("games")}>Games</NavLink></li>
              <li><NavLink to="stats" onMouseEnter={prefetch("stats")} onFocus={prefetch("stats")}>Stats</NavLink></li>
              <li><NavLink to="articles" onMouseEnter={prefetch("articles")} onFocus={prefetch("articles")}>Articles</NavLink></li>
              <li><NavLink to="registrations" onMouseEnter={prefetch("registrations")} onFocus={prefetch("registrations")}>Registrations</NavLink></li>
              <li><NavLink to="applications" onMouseEnter={prefetch("applications")} onFocus={prefetch("applications")}>Applications</NavLink></li>
              <li><NavLink to="awards" onMouseEnter={prefetch("awards")} onFocus={prefetch("awards")}>Awards</NavLink></li>
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

      {/* Nested Suspense keeps the sidebar mounted while a lazy page chunk loads,
          so navigating inside the portal doesn't unmount and remount the shell. */}
      <main className="portal-main">
        <Suspense fallback={<div className="page-loading" role="status">Loading…</div>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

export default PortalLayout;
