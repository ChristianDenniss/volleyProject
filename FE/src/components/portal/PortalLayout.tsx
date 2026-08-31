import React, { Suspense, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "../ui/ui.css";

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

/* The collapse used to work through a .sidebar-collapsed class on the wrapper
   that descendant rules read. The collapsed state is React state, so the
   affected elements now switch their own classes instead of being reached from
   an ancestor - the same three elements change, just driven directly. */

/* `[&+*]:mt-0!` reproduces `.portal-wrapper + * { margin-top: 0 !important }`,
   which flattens the gap to whatever follows the portal (the footer). It is a
   sibling rule, so it has to be expressed from the wrapper rather than on the
   element it targets. The important is kept because the rule had one. */
const wrapperBase =
  "grid min-h-screen pb-0! transition-[grid-template-columns] duration-[0.25s] ease-[ease] [&+*]:mt-0!";

const sidebarBase =
  "bg-[#1f2937] text-[#f9fafb] py-[1.5rem] px-[1rem] flex flex-col relative " +
  "min-w-[120px] max-w-[220px] w-full box-border z-[2] " +
  "transition-[padding,min-width] duration-[0.25s] ease-[ease] " +
  "upto-md:flex-row upto-md:items-center upto-md:justify-between upto-md:max-w-none";

/* Written as one arbitrary transition because the three properties have
   different timings, and the collapsed variant additionally delays visibility by
   0.25s so the panel stays hittable until it has finished sliding out. A
   duration-* utility applies one value to every property, so it cannot say
   this. */
const sidebarContentBase =
  "min-w-[148px] [transition:opacity_0.15s_ease,transform_0.25s_ease,visibility_0s_linear]";

const sidebarToggle =
  "absolute top-[1.35rem] right-[-0.9rem] w-[1.8rem] h-[1.8rem] p-0 " +
  "border border-[#475569] rounded-full bg-[#1f2937] text-[#f9fafb] " +
  "grid place-items-center cursor-pointer shadow-[0_2px_5px_rgb(15_23_42_/_25%)] " +
  "transition-[background,color] duration-150 ease-[ease] z-[3] " +
  "hover:bg-[#334155] hover:text-accent " +
  "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2";

const navList = "list-none p-0 m-0 [&_li+li]:mt-[2.5rem] upto-md:flex upto-md:gap-[1rem]";

const navLink = "no-underline font-medium transition-[color] duration-150 ease-[ease] hover:text-white";

const PortalLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const wrapper = `${wrapperBase} ${
    isSidebarCollapsed
      ? "grid-cols-[0_1fr]"
      : "grid-cols-[180px_1fr] upto-md:grid-cols-[1fr]"
  }`;

  const sidebar = `${sidebarBase} ${
    isSidebarCollapsed ? "min-w-0 pl-0 pr-0" : ""
  }`;

  const sidebarContent = `${sidebarContentBase} ${
    isSidebarCollapsed
      ? "opacity-0 [transform:translateX(-100%)] invisible " +
        "[transition:opacity_0.15s_ease,transform_0.25s_ease,visibility_0s_linear_0.25s]"
      : "opacity-100 [transform:translateX(0)] visible"
  }`;

  return (
    <div className={wrapper}>
      <aside className={sidebar} aria-hidden={isSidebarCollapsed}>
        <div className={sidebarContent}>
          <h2 className="text-[1.25rem] mb-[1.25rem]">Admin Portal</h2>
          <nav>
            <ul className={navList}>
              {[
                { to: "", label: "Dashboard", end: true },
                { to: "users", label: "Users" },
                { to: "seasons", label: "Seasons" },
                { to: "teams", label: "Teams" },
                { to: "players", label: "Players" },
                { to: "games", label: "Games" },
                { to: "stats", label: "Stats" },
                { to: "articles", label: "Articles" },
                { to: "registrations", label: "Registrations" },
                { to: "applications", label: "Applications" },
                { to: "awards", label: "Awards" },
              ].map(({ to, label, end }) => (
                <li key={to || "dashboard"}>
                  <NavLink
                    end={end}
                    to={to}
                    onMouseEnter={prefetch(to)}
                    onFocus={prefetch(to)}
                    /* NavLink used to add .active for the CSS to pick up; the
                       colour is now chosen from the same flag directly. */
                    className={({ isActive }) =>
                      `${navLink} ${isActive ? "text-accent" : "text-[#cbd5e1]"}`
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <button
          type="button"
          className={sidebarToggle}
          onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
          aria-label={isSidebarCollapsed ? "Show admin sidebar" : "Hide admin sidebar"}
          aria-expanded={!isSidebarCollapsed}
          title={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
        >
          {isSidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </aside>

      {/* Nested Suspense keeps the sidebar mounted while a lazy page chunk loads,
          so navigating inside the portal doesn't unmount and remount the shell.

          `portal-main` stays as a class: PortalPlayersPage.css reaches into this
          element with `.portal-main .ui-filter-bar`. */}
      <main className="portal-main py-[2rem] px-[2.5rem] bg-[#f8fafc] overflow-y-auto min-w-0 upto-md:p-[1.5rem]">
        <Suspense fallback={<div className="page-loading" role="status">Loading…</div>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

export default PortalLayout;
