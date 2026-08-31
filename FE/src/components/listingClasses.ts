/**
 * Shared utility strings for public listing surfaces.
 *
 * ListingPage.css was imported by Awards, Games, Players, Teams, Seasons and
 * TeamRegistrations. These constants keep that sharing explicit now that the
 * stylesheet is a remnant (ui-filter-bar margin only).
 *
 * Overlapping rules are resolved here to the CSS winner, not composed from
 * losing declarations. Players.css restyles several listing hooks; those
 * winners live on Players.tsx rather than here.
 *
 * `listing-controls-toolbar` stays in the string because ListingPage.css
 * still reaches `.listing-controls-toolbar .ui-filter-bar`. `listing-search-row`
 * stays because Players.css restyles buttons inside it. `search-bar` stays on
 * Searchbar.tsx (PortalPlayersPage.css still styles `.search-bar input`).
 */

import "../styles/ListingPage.css";

/* Toolbar. flex / min-width on the nested filter bar were not a fight with
   ui.css and are utilities; margin-bottom: 0 stays in the remnant. */
export const listingControlsToolbar =
  "listing-controls-toolbar flex flex-wrap items-center gap-[0.75rem] mb-section " +
  "[&_.ui-filter-bar]:flex-[1_1_auto] [&_.ui-filter-bar]:min-w-0 " +
  "upto-md:flex-col upto-md:items-stretch upto-md:ml-0";

/* ListingPage `.listing-search-row .search-bar` (0,2,0) beat Searchbar.css
   (0,1,0) for flex. `.listing-search-row .search-bar input` (0,3,1) beat
   Searchbar.css input for max-width. Those winners sit on this ancestor. */
export const listingSearchRow =
  "listing-search-row flex items-center gap-[0.75rem] flex-[1_1_16rem] max-w-full ml-auto " +
  "[&_.search-bar]:flex-[1_1_12rem] [&_.search-bar]:min-w-0 " +
  "[&_.search-bar_input]:w-full [&_.search-bar_input]:max-w-none " +
  "upto-md:flex-col upto-md:items-stretch upto-md:ml-0 " +
  "upto-md:[&_.search-bar]:max-w-none upto-md:[&_.search-bar]:w-full " +
  "upto-md:[&_.search-bar_input]:max-w-none upto-md:[&_.search-bar_input]:w-full";

export const listingContentWrapper = "py-[10px] px-0 min-h-[500px]";

export const listingTableWrapper =
  "w-full overflow-x-auto border border-border rounded-md";

export const listingTable =
  "w-full min-w-full table-auto border-collapse text-[0.9375rem] " +
  "[&_thead_th]:bg-bg-muted [&_thead_th]:text-brand-primary [&_thead_th]:font-bold " +
  "[&_thead_th]:uppercase [&_thead_th]:tracking-[0.04em] [&_thead_th]:text-[0.75rem] " +
  "[&_thead_th]:py-[0.75rem] [&_thead_th]:px-[1.1rem] [&_thead_th]:text-left " +
  "[&_thead_th]:whitespace-nowrap [&_thead_th]:border-b-2 [&_thead_th]:border-b-brand-primary " +
  "[&_tbody_tr]:border-b [&_tbody_tr]:border-border " +
  "[&_tbody_tr]:transition-[background-color] [&_tbody_tr]:duration-150 [&_tbody_tr]:ease-[ease] " +
  "[&_td]:py-[0.85rem] [&_td]:px-[1.1rem] [&_td]:text-text [&_td]:align-middle " +
  "[&_td_a]:text-brand-primary [&_td_a]:font-semibold [&_td_a]:no-underline " +
  "[&_td_a:hover]:text-brand-primary-hover [&_td_a:hover]:underline " +
  "upto-md:[&_thead_th]:py-[0.625rem] upto-md:[&_thead_th]:px-[0.75rem] " +
  "upto-md:[&_thead_th]:text-[0.875rem] " +
  "upto-md:[&_td]:py-[0.625rem] upto-md:[&_td]:px-[0.75rem] upto-md:[&_td]:text-[0.875rem]";

export const listingRowClickable =
  "listing-row-clickable cursor-pointer hover:bg-row-hover";

export const listingRowExpanded =
  "listing-row-clickable listing-row-expanded cursor-pointer bg-accent-border " +
  "hover:bg-accent-border border-b-0";

export const listingTableDetailRow =
  "listing-table-detail-row cursor-default " +
  "[&_td]:bg-accent-border [&_td]:pt-0 [&_td]:px-[1.25rem] [&_td]:pb-[1.25rem] " +
  "hover:[&_td]:bg-accent-border";

export const listingTableDetail =
  "flex flex-col items-start gap-[0.9rem]";

export const listingTableDetailStats =
  "grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-[0.75rem_1.25rem] w-full m-0";

export const listingTableDetailStat =
  "flex flex-col gap-[0.2rem] " +
  "[&_dt]:m-0 [&_dt]:text-[0.6875rem] [&_dt]:font-bold [&_dt]:uppercase " +
  "[&_dt]:tracking-[0.04em] [&_dt]:text-text-muted " +
  "[&_dd]:m-0 [&_dd]:text-[0.9375rem] [&_dd]:font-semibold [&_dd]:text-text";

export const listingTableDetailStatWide = `${listingTableDetailStat} col-span-full`;

/* align-self / line-height are the only declarations that beat ui-btn (ui.css
   loads later and wins padding and font-size at equal specificity). */
export const listingTableDetailProfileBtn = "self-start leading-[1.2]";

export const listingTablePositionPill =
  "inline-block text-[0.6875rem] font-bold uppercase tracking-[0.03em] " +
  "text-brand-primary bg-accent-pale py-[0.2rem] px-[0.6rem] rounded-[999px]";

export const listingTableOverflowList =
  "inline-block max-w-[14rem] text-[0.8125rem]";

export const listingTableExpandToggle =
  "inline-block text-[0.6875rem] text-text-subtle " +
  "transition-[transform,color] duration-200 ease-[ease]";

export const listingTableExpandToggleOpen =
  `${listingTableExpandToggle} [transform:rotate(90deg)] text-brand-primary`;

export const listingTableEmpty =
  "listing-table-empty p-[2rem] text-center text-text-muted";

export const listingSkeletonTable = "flex flex-col gap-[0.5rem]";

export const listingSkeletonRow =
  "h-[48px] rounded-sm bg-[image:var(--skeleton-shimmer)] bg-[length:200%_100%] " +
  "animate-listing-shimmer";
