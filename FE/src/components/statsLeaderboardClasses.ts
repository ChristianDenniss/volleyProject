/**
 * Named class strings for the public stats leaderboard.
 *
 * StatsLeaderboard.css also styled PlayerStatsVisualization (visualization-*)
 * and overrode SeasonFilterBar's select with !important. Those winners live
 * on those files; search-bar flex/max-width lives here so it beats Searchbar
 * the same way `.stats-search-controls .search-bar` used to.
 */

const chevronSelect =
  "text-[15px] py-[8px] px-[16px] pr-[32px] border border-brand-primary rounded-[4px] " +
  "bg-brand-primary bg-[image:var(--chevron-down-white)] bg-no-repeat bg-[right_8px_center] " +
  "bg-[length:20px] text-white cursor-pointer appearance-none shadow-none " +
  "transition-[background-color] duration-200 ease-[ease] " +
  "hover:bg-brand-primary-hover hover:border-brand-primary-hover " +
  "focus:bg-brand-primary-hover focus:border-brand-primary-hover focus:outline-none " +
  "focus:shadow-[0_0_0_2px_var(--color-focus-ring)]";

export const statsPage =
  "py-[20px] px-[clamp(1rem,2.5vw,2.5rem)] w-[min(100%,1600px)] max-w-[1600px] mx-auto " +
  "min-h-screen box-border [contain:layout_style_paint] flex flex-col " +
  "[&>*]:shrink-0 upto-xs:p-[12px]";

export const statsRecordsNav = "flex justify-end m-0 pb-[12px]";

export const statsRecordsButton =
  "text-[15px] py-[8px] px-[16px] border border-brand-primary rounded-[4px] " +
  "bg-brand-primary text-white cursor-pointer flex items-center gap-[5px] " +
  "transition-[background-color] duration-200 ease-[ease] " +
  "hover:bg-brand-primary-hover hover:border-brand-primary-hover " +
  "focus:bg-brand-primary-hover focus:border-brand-primary-hover";

export const statsControlsWrapper = "m-0 mb-[0.75rem]";

export const statsControlsContainer = "flex flex-col gap-0";

export const statsFiltersRow =
  "flex flex-row gap-[0.75rem] items-center flex-wrap w-full justify-start " +
  "upto-md:flex-col upto-md:items-stretch upto-md:gap-[10px] upto-md:ml-0 " +
  "upto-xs:gap-[8px]";

export const statsFilterWrap = "m-0 whitespace-nowrap";

export const statsStageSelect = `${chevronSelect} w-[90px]`;

export const statsSelect = chevronSelect;

export const statsFilterMenu = "relative inline-block whitespace-nowrap";

export const filterMenuButton =
  "text-[15px] py-[8px] px-[16px] pr-[32px] border border-brand-primary rounded-[4px] " +
  "bg-brand-primary bg-[image:var(--chevron-down-white)] bg-no-repeat bg-[right_8px_center] " +
  "bg-[length:20px] text-white cursor-pointer flex items-center gap-[5px] " +
  "appearance-none shadow-none " +
  "transition-[background-color] duration-200 ease-[ease] " +
  "hover:bg-brand-primary-hover hover:border-brand-primary-hover " +
  "focus:bg-brand-primary-hover focus:border-brand-primary-hover";

export const advancedFilterWrap = "relative inline-block whitespace-nowrap";

export const advancedFilterButton =
  "text-[15px] py-[8px] px-[16px] border border-brand-primary rounded-[4px] " +
  "bg-white text-brand-primary cursor-pointer transition-all duration-200 ease-[ease] " +
  "flex items-center gap-[5px] hover:bg-brand-primary hover:text-white " +
  "focus:bg-brand-primary focus:text-white";

/* Active is later than :hover at the same spec, so an open button stays
   navy on hover. Not composed with the idle string. */
export const advancedFilterButtonActive =
  "text-[15px] py-[8px] px-[16px] border border-brand-primary rounded-[4px] " +
  "bg-brand-primary text-white cursor-pointer transition-all duration-200 ease-[ease] " +
  "flex items-center gap-[5px] hover:bg-brand-primary hover:text-white " +
  "focus:bg-brand-primary focus:text-white";

export const statsSearchControls =
  "flex items-center gap-[0.75rem] flex-[1_1_16rem] ml-auto max-w-full min-w-0 " +
  "[&_.search-bar]:flex-[1_1_12rem] [&_.search-bar]:min-w-0 " +
  "[&_.search-bar_input]:w-full [&_.search-bar_input]:max-w-none " +
  "upto-md:flex-col upto-md:items-stretch upto-md:gap-[10px] upto-md:ml-0 " +
  "upto-md:[&_.search-bar]:w-full upto-md:[&_.search-bar]:m-0 " +
  "upto-md:[&_.search-bar_input]:w-full upto-md:[&_.search-bar_input]:max-w-none " +
  "upto-xs:gap-[8px]";

export const statsPaginationWrapper = "whitespace-nowrap upto-md:w-full upto-md:m-0";

export const filterMenuDropdown =
  "bg-white border border-brand-primary rounded-[4px] " +
  "shadow-[0_2px_8px_var(--color-focus-ring)] z-[1000] min-w-[400px] mt-[5px] p-[10px]";

export const filterMenuHeader =
  "p-[10px] border-b border-[#e2e8f0] font-semibold mb-[10px] text-brand-primary";

export const filterMenuItems =
  "grid grid-cols-[1fr_1fr_1fr] gap-[8px]";

export const filterMenuItem =
  "flex items-center py-[6px] px-[8px] cursor-pointer rounded-[4px] text-text " +
  "transition-[background-color] duration-200 ease-[ease] hover:bg-[#f7fafc] " +
  "[&_input]:mr-[8px] [&_input]:accent-brand-primary";

export const advancedFilterPanel =
  "bg-white border border-brand-primary rounded-[4px] " +
  "shadow-[0_2px_8px_var(--color-focus-ring)] mt-[10px] mb-[12px] p-[20px] max-w-[800px] " +
  "animate-filter-slide-down upto-md:my-[10px] upto-md:p-[15px]";

export const advancedFilter = "flex flex-col gap-[15px]";

export const advancedFilterHeader =
  "flex justify-between items-center border-b border-[#e2e8f0] pb-[10px] " +
  "[&_h3]:m-0 [&_h3]:text-brand-primary [&_h3]:text-[1.1rem] " +
  "upto-md:flex-col upto-md:gap-[10px] upto-md:items-stretch";

export const addFilterButton =
  "text-[14px] py-[6px] px-[12px] border border-brand-primary rounded-[4px] " +
  "bg-brand-primary text-white cursor-pointer " +
  "transition-[background-color] duration-200 ease-[ease] " +
  "hover:bg-brand-primary-hover upto-md:self-start";

export const noFiltersMessage =
  "text-center text-[#666] italic p-[20px] bg-[#f8f9fa] rounded-[4px]";

export const filterCondition = "flex flex-col gap-[8px]";

export const filterStatSelect =
  "text-[14px] py-[6px] px-[10px] border border-[#d1d5db] rounded-[4px] bg-white min-w-[150px] " +
  "upto-md:w-full upto-md:min-w-[auto]";

export const filterOperatorSelect =
  "text-[14px] py-[6px] px-[10px] border border-[#d1d5db] rounded-[4px] bg-white min-w-[60px] " +
  "upto-md:w-full upto-md:min-w-[auto]";

export const filterValueInput =
  "text-[14px] py-[6px] px-[10px] border border-[#d1d5db] rounded-[4px] bg-white w-[80px] text-center " +
  "focus:outline-none focus:border-brand-primary focus:shadow-[0_0_0_2px_rgba(26,54,93,0.1)] " +
  "upto-md:w-full upto-md:min-w-[auto]";

export const filterPercentageSymbol =
  "absolute right-[8px] text-[#6b7280] text-[14px] font-medium pointer-events-none";

export const removeFilterButton =
  "text-[16px] py-[6px] px-[10px] border border-[#dc2626] rounded-[4px] bg-white text-[#dc2626] " +
  "cursor-pointer transition-all duration-200 ease-[ease] flex items-center justify-center " +
  "min-w-[32px] h-[32px] hover:bg-[#dc2626] hover:text-white upto-md:self-end upto-md:w-auto";

export const statsTableWrapper =
  "w-full overflow-x-auto rounded-t-[4px] shadow-[0_2px_8px_rgba(26,54,93,0.08)] " +
  "mt-0 mb-0 pb-0 [content-visibility:auto] [contain-intrinsic-size:600px] " +
  "upto-md:min-h-[500px] upto-md:overflow-x-auto " +
  "empty:before:content-[''] empty:before:block empty:before:h-[600px] empty:before:w-full";

export const statsTableWrapperLoading = `${statsTableWrapper} min-h-[600px]`;

export const statsTable =
  "w-full min-w-[800px] border-collapse border-b-0 bg-transparent m-0 mb-0 p-0 pb-0 " +
  "[&_th]:py-[12px] [&_th]:px-[12px] [&_th]:text-center [&_th]:border-b [&_th]:border-[#e2e8f0] " +
  "[&_td]:py-[12px] [&_td]:px-[12px] [&_td]:text-center [&_td]:border-b [&_td]:border-[#e2e8f0] " +
  "[&_th]:bg-brand-primary [&_th]:text-white [&_th]:font-semibold " +
  "[&_tbody_tr:hover]:bg-[#f7fafc] " +
  "[&_tbody_tr:last-child_td]:border-b-0 " +
  "upto-md:min-h-[400px] upto-md:text-[11px] " +
  "upto-md:[&_th]:py-[8px] upto-md:[&_th]:px-[3px] upto-md:[&_th]:text-[11px] " +
  "upto-md:[&_td]:py-[6px] upto-md:[&_td]:px-[3px] upto-md:[&_td]:text-[11px] " +
  "upto-xs:[&_th]:py-[4px] upto-xs:[&_th]:px-[2px] upto-xs:[&_th]:text-[10px] " +
  "upto-xs:[&_td]:py-[4px] upto-xs:[&_td]:px-[2px] upto-xs:[&_td]:text-[10px]";

export const statsSkeletonTable =
  `${statsTable} stats-skeleton-table ` +
  "[&_tbody_tr.stats-skeleton-row:hover]:bg-transparent " +
  "[&_.stats-skeleton-row_td]:h-[48px]";

export const statsTableSortable = "sortable cursor-pointer select-none hover:bg-brand-primary-hover";

export const sortArrow = "ml-[5px] text-[0.8em]";

export const statsPillLink =
  "inline-block min-w-[100px] text-center py-[4px] px-[12px] rounded-[999px] " +
  "bg-[#f4f7fa] text-brand-primary! no-underline font-medium text-[1em] " +
  "border border-brand-primary shadow-none cursor-pointer " +
  "transition-[background,color,border] duration-200 " +
  "hover:bg-brand-primary hover:text-white! hover:border-brand-primary-hover hover:no-underline " +
  "focus:bg-brand-primary focus:text-white! focus:border-brand-primary-hover focus:no-underline";

export const statsSkeletonRow = "stats-skeleton-row";

export const statsSkeletonBar =
  "inline-block w-[44px] h-[14px] rounded-sm bg-[image:var(--skeleton-shimmer)] " +
  "bg-[length:200%_100%] animate-stats-shimmer [animation-delay:var(--row-delay,0s)] align-middle " +
  "motion-reduce:animate-none motion-reduce:opacity-70";

export const statsPlayerRow = "player-row cursor-pointer";

export const playerVisualizationRow =
  "[&_td]:bg-[#f5f8fa] [&_td]:border-b-2 [&_td]:border-[#e2e8f0] [&_td]:py-[24px] [&_td]:px-[32px]";

export const playerVisualization =
  "w-full p-0 upto-md:overflow-hidden";

export const visualizationGrid =
  "flex flex-wrap gap-[32px] mb-[24px] w-full " +
  "upto-lg:flex-col upto-lg:gap-[20px] upto-md:gap-[16px] upto-md:w-full upto-xs:gap-[12px]";

export const visualizationChart =
  "flex-[1_1_320px] min-w-[280px] max-w-[480px] bg-white rounded-[12px] " +
  "shadow-[0_2px_8px_rgba(45,60,80,0.07)] pt-[16px] px-[8px] pb-[8px] " +
  "flex items-center justify-center " +
  "upto-lg:min-w-0 upto-lg:max-w-full " +
  "upto-md:min-w-0 upto-md:max-w-full upto-md:pt-[12px] upto-md:px-[6px] upto-md:pb-[6px] " +
  "upto-md:rounded-[8px] upto-md:w-full upto-md:box-border " +
  "upto-xs:pt-[8px] upto-xs:px-[4px] upto-xs:pb-[4px] upto-xs:rounded-[6px]";
