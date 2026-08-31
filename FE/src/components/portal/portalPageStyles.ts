/* Shared class strings for the portal list pages. These pages used to import
   the same handful of stylesheets (UsersPage, PlayersPage, PortalPlayersPage,
   GamesPage, AwardsPage, StatsPage, SeasonsPage), so the same class names
   meant the same thing across them. Constants live here so a conversion of
   that cluster stays coherent.

   `portal-main` and `filter-group` stay in the string because ui.css reaches
   into them (navy pill selects, filter-bar grouping). They are hooks, not
   leftovers. */

export const portalMain = "portal-main";

export const playersControls =
  "flex items-center justify-between gap-[0.75rem] mb-[0.75rem] p-0";

export const playersControlsLeft = "flex items-center gap-[0.75rem]";

export const playersControlsRight =
  "flex items-center gap-[1rem] shrink-0 ml-auto [&_.search-bar]:w-[200px]";

/* `filter-group` is required: ui.css styles `.ui-filter-bar .filter-group`.
   display/align-items are already on that rule, so they are not repeated.
   gap is the only extra UsersPage.css added. */
export const filterGroup = "filter-group gap-[0.5rem]";

export const resultsCounter = "ml-auto text-[0.875rem] text-[#6c757d]";

export const textMuted = "text-[#6b7280] italic";

/* UsersPage / AwardsPage / GamesPage / PlayersPage / TeamsPage share this
   treatment. StatsPage's disabled grey is different and stays on that page. */
export const createButton =
  "bg-brand-primary text-white py-[0.5rem] px-[1rem] border-none rounded-[0.25rem] " +
  "text-[1rem] cursor-pointer transition-[background-color] duration-200 ease-[ease] " +
  "hover:bg-brand-primary-hover active:bg-brand-primary " +
  "disabled:bg-[#63686f] disabled:cursor-not-allowed";
