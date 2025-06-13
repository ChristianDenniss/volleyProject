import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "../../styles/PortalLayout.css";   // create/style as you like

const PortalLayout: React.FC = () => (
  <div className="portal-wrapper">
    <aside className="portal-sidebar">
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
          <li><NavLink to="awards">Awards</NavLink></li>
        </ul>
      </nav>
    </aside>

    <main className="portal-main">
      <Outlet />
    </main>
  </div>
);

export default PortalLayout;
