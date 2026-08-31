/**
 * Shared utility strings for team-registration surfaces.
 *
 * TeamRegistrations.css was imported by the public list, register form, detail
 * page, portal hub, and SingleTeam (for TeamStaffEdit). These constants keep
 * that sharing explicit now that the stylesheet is gone.
 *
 * Overlapping rules are resolved here to the CSS winner, not composed from
 * losing declarations. Modifier CTAs do not extend the primary string because
 * background/color/border would then depend on Tailwind source order.
 */

/* Same box as .team-regs-page and .team-reg-form. */
export const teamRegsPage =
  "w-full max-w-[1100px] mx-auto p-[1.25rem_1.5rem_3rem] box-border " +
  "upto-md:p-[1rem_1rem_2.5rem]";

export const teamRegForm = teamRegsPage;

export const teamRegsNav =
  "flex flex-wrap items-center gap-[0.5rem_0.65rem] mb-[1.5rem] py-[0.75rem] px-[1rem] " +
  "bg-bg border border-border rounded-md text-[0.9rem] text-text-muted " +
  "[&_a]:text-brand-primary [&_a]:font-semibold [&_a]:no-underline " +
  "[&_a:hover]:text-brand-primary-hover [&_a:hover]:underline";

export const teamRegsNavActive = "font-bold text-brand-primary";

export const teamRegsHeader =
  "flex flex-wrap items-start justify-between gap-[1.5rem] mb-[1.5rem] upto-md:flex-col";

/* .team-regs-header-body p beats .team-regs-spots for color and margin
   (0,1,1 vs 0,1,0), so spots inside the header stay muted with margin 0. */
export const teamRegsHeaderBody =
  "[&_h1]:m-0 [&_h1]:mb-[0.5rem] [&_h1]:text-[2rem] [&_h1]:font-bold [&_h1]:text-brand-primary " +
  "[&_p]:m-0 [&_p]:max-w-[42rem] [&_p]:text-text-muted [&_p]:leading-[1.5]";

export const teamRegsSpots = "mt-[0.5rem] font-semibold text-brand-primary";

export const teamRegsHeaderActions =
  "flex flex-col items-end gap-[0.75rem] upto-md:items-stretch upto-md:w-full";

export const teamRegsCta =
  "inline-flex items-center justify-center py-[0.7rem] px-[1.25rem] rounded-sm " +
  "bg-brand-primary text-text-on-brand font-semibold text-[0.95rem] no-underline border-none " +
  "cursor-pointer transition-[background-color] duration-200 ease-[ease] " +
  "hover:bg-brand-primary-hover hover:text-text-on-brand hover:no-underline " +
  "disabled:opacity-[0.55] disabled:cursor-not-allowed";

export const teamRegsCtaSecondary =
  "inline-flex items-center justify-center py-[0.7rem] px-[1.25rem] rounded-sm " +
  "bg-bg text-brand-primary font-semibold text-[0.95rem] no-underline " +
  "border border-brand-primary cursor-pointer transition-[background-color] duration-200 ease-[ease] " +
  "hover:bg-accent-hover-bg hover:text-brand-primary hover:no-underline " +
  "disabled:opacity-[0.55] disabled:cursor-not-allowed";

export const teamRegsCtaDanger =
  "inline-flex items-center justify-center py-[0.7rem] px-[1.25rem] rounded-sm " +
  "bg-error text-text-on-brand font-semibold text-[0.95rem] no-underline border-none " +
  "cursor-pointer transition-[background-color] duration-200 ease-[ease] " +
  "hover:bg-[#b91c1c] hover:text-text-on-brand hover:no-underline " +
  "disabled:opacity-[0.55] disabled:cursor-not-allowed";

export const teamRegsLegend = "flex flex-wrap gap-[0.65rem_1rem] items-center";

export const teamRegsLegendItem =
  "inline-flex items-center gap-[0.35rem] text-[0.8rem] text-text-muted";

export const teamRegsRegionTabs = "flex flex-wrap gap-[0.5rem] m-0 mb-[1.25rem]";

export const teamRegsRegionTab =
  "border border-brand-primary bg-brand-primary text-text-on-brand py-[0.5rem] px-[1rem] " +
  "cursor-pointer rounded-sm font-semibold text-[0.9rem] " +
  "transition-[background-color,opacity] duration-200 ease-[ease] opacity-[0.55] " +
  "hover:bg-brand-primary-hover hover:border-brand-primary-hover hover:opacity-[0.85]";

/* .active is later than :hover at the same specificity, so an active tab
   keeps opacity 1 on hover while still taking the hover colours. */
export const teamRegsRegionTabActive =
  "border border-brand-primary bg-brand-primary text-text-on-brand py-[0.5rem] px-[1rem] " +
  "cursor-pointer rounded-sm font-semibold text-[0.9rem] " +
  "transition-[background-color,opacity] duration-200 ease-[ease] opacity-100 " +
  "shadow-[0_0_0_2px_var(--color-focus-ring)] " +
  "hover:bg-brand-primary-hover hover:border-brand-primary-hover hover:opacity-100";

export const teamRegsError =
  "bg-error-bg text-[#721c24] border border-error-border py-[0.75rem] px-[1rem] " +
  "rounded-sm mb-[1rem]";

export const teamRegsSuccess =
  "bg-[#d4edda] text-[#155724] border border-[#c3e6cb] py-[0.75rem] px-[1rem] " +
  "rounded-sm mb-[1rem]";

export const teamRegsMuted = "text-text-muted text-[0.9rem]";

/* Direct child of the card used to add margin; applied on that element. */
export const teamRegsMutedLead = `${teamRegsMuted} m-0 mb-[1.5rem]`;

export const teamRegsTableWrap =
  "w-full overflow-x-auto border border-border rounded-md bg-bg";

/* Row background/cursor/hover live on the <tr> so they can beat this
   descendant padding/color without a source-order fight. .team-name-cell is
   kept so its colour beats [&_td]:text-text (0,2,0 vs 0,1,1).

   listing-table-detail-row / listing-table-empty stay as class names: the
   public list and this table used to share ListingPage.css hooks. Background
   on the detail cells is the listing winner; padding/colour stay this table's
   (it was 0,2,1 over ListingPage's 0,1,1). */
export const teamRegsTable =
  "w-full border-collapse text-[0.9375rem] " +
  "[&_thead_th]:bg-bg-muted [&_thead_th]:text-brand-primary [&_thead_th]:font-bold " +
  "[&_thead_th]:uppercase [&_thead_th]:tracking-[0.04em] [&_thead_th]:text-[0.75rem] " +
  "[&_thead_th]:py-[0.75rem] [&_thead_th]:px-[1.1rem] [&_thead_th]:text-left " +
  "[&_thead_th]:whitespace-nowrap [&_thead_th]:border-b-2 [&_thead_th]:border-b-brand-primary " +
  "[&_td]:py-[0.85rem] [&_td]:px-[1.1rem] [&_td]:text-text [&_td]:align-middle " +
  "[&_.team-name-cell]:font-semibold [&_.team-name-cell]:text-brand-primary " +
  "upto-md:[&_thead_th]:py-[0.625rem] upto-md:[&_thead_th]:px-[0.75rem] " +
  "upto-md:[&_thead_th]:text-[0.875rem] " +
  "upto-md:[&_td]:py-[0.625rem] upto-md:[&_td]:px-[0.75rem] upto-md:[&_td]:text-[0.875rem]";

export const teamRegsTableRow =
  "border-b border-b-border transition-[background-color] duration-150 ease-[ease] bg-bg";

export const teamRegsTableRowClickable =
  `${teamRegsTableRow} listing-row-clickable cursor-pointer hover:bg-row-hover`;

/* Hover on a selected row still uses row-hover: that rule's specificity beat
   .selected / .listing-row-expanded. listing-* class names stay as hooks. */
export const teamRegsTableRowSelected =
  "listing-row-clickable selected listing-row-expanded border-b border-b-border " +
  "transition-[background-color] duration-150 ease-[ease] bg-accent-border " +
  "cursor-pointer hover:bg-row-hover";

/* ListingPage painted cursor and the accent cell background. Padding on those
   cells lost to .team-regs-table td, so it is not repeated here. */
export const teamRegsDetailRow =
  `listing-table-detail-row ${teamRegsTableRow} cursor-default ` +
  "[&_td]:bg-accent-border hover:[&_td]:bg-accent-border";

export const teamRegsEmptyCell = "listing-table-empty text-center";

export const teamRegsColorSwatch =
  "inline-block w-[0.85rem] h-[0.85rem] rounded-[999px] border border-border " +
  "align-middle mr-[0.4rem]";

export const teamRegsDetail = "flex flex-col gap-[0.9rem] pt-[0.25rem] pb-[0.5rem] px-0";

export const teamRegsDetailStats =
  "grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-[0.75rem_1.25rem] m-0";

/* Inline `margin: 1.25rem 0` on the detail page beat the rule's `margin: 0`. */
export const teamRegsDetailStatsSpaced =
  "grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-[0.75rem_1.25rem] my-[1.25rem]";

export const teamRegsDetailStat =
  "flex flex-col gap-[0.2rem] " +
  "[&_dt]:m-0 [&_dt]:text-[0.6875rem] [&_dt]:font-bold [&_dt]:uppercase " +
  "[&_dt]:tracking-[0.04em] [&_dt]:text-text-muted";

export const teamRegsDetailStatWide = `${teamRegsDetailStat} col-span-full`;

export const teamRegsRoster =
  "list-none m-0 p-0 grid gap-[0.4rem] " +
  "[&_li]:flex [&_li]:flex-wrap [&_li]:gap-[0.35rem_0.75rem] [&_li]:py-[0.55rem] [&_li]:px-[0.75rem] " +
  "[&_li]:bg-bg [&_li]:border [&_li]:border-border [&_li]:rounded-sm [&_li]:text-[0.9rem]";

export const teamRegsRosterLabel =
  "text-[0.7rem] font-bold uppercase tracking-[0.04em] text-text-muted min-w-[4.5rem]";

/* Gate padding wins on wide screens; the 768px card padding wins at upto-md
   (same specificity, later source). h1 styles sit on the heading, not here,
   so the detail title-row margin:0 can win without a source-order fight. */
export const teamRegCard =
  "bg-bg p-[2rem_2.25rem] rounded-md shadow-sm border border-border " +
  "upto-md:p-[1.35rem_1.15rem]";

export const teamRegCardH1 =
  "m-0 mb-[0.5rem] text-[1.75rem] font-bold text-brand-primary";

export const teamRegGate =
  "bg-bg text-center p-[2.5rem_2rem] rounded-md shadow-sm border border-border " +
  "upto-md:p-[1.35rem_1.15rem] " +
  "[&_p]:text-text-muted [&_p]:leading-[1.5]";

/* .team-reg-card > .team-regs-muted (0,2,0) beats .team-reg-gate p (0,1,1)
   for margin, so a muted loading line inside the gate is 1.5rem not 1.25rem. */
export const teamRegGateMuted = `${teamRegsMuted} m-0 mb-[1.5rem]`;

export const teamRegGateP = "m-0 mb-[1.25rem] text-text-muted leading-[1.5]";

export const teamRegGateLinks = "flex flex-wrap gap-[0.75rem] justify-center";

export const teamRegSection =
  "m-0 mb-[1.75rem] p-0 pb-[1.5rem] border-b border-b-border " +
  "last-of-type:border-b-0 last-of-type:pb-0 " +
  "[&_h2]:m-0 [&_h2]:mb-[1rem] [&_h2]:text-[1.1rem] [&_h2]:font-bold " +
  "[&_h2]:text-brand-primary [&_h2]:pb-[0.5rem] [&_h2]:border-b-2 [&_h2]:border-b-accent";

const formFields = (c: string) =>
  `[&_input]:${c} [&_textarea]:${c} [&_select]:${c}`;

export const teamRegFormGroup =
  "mb-[1.15rem] " +
  "[&_label]:block [&_label]:mb-[0.45rem] [&_label]:font-medium [&_label]:text-text [&_label]:text-[0.95rem] " +
  formFields("w-full") +
  " " +
  formFields("box-border") +
  " " +
  formFields("mt-[0.4rem]") +
  " " +
  formFields("py-[0.7rem]") +
  " " +
  formFields("px-[0.85rem]") +
  " " +
  formFields("border") +
  " " +
  formFields("border-[#ddd]") +
  " " +
  formFields("rounded-sm") +
  " " +
  formFields("text-[1rem]") +
  " " +
  formFields("bg-bg") +
  " " +
  formFields("text-text") +
  " " +
  formFields("transition-[border-color,box-shadow]") +
  " " +
  formFields("duration-200") +
  " " +
  formFields("ease-[ease]") +
  " " +
  formFields("outline-none") +
  " " +
  formFields("focus:border-brand-primary") +
  " " +
  formFields("focus:shadow-[0_0_0_2px_var(--color-focus-ring)]") +
  " " +
  "[&_textarea]:resize-y [&_textarea]:min-h-[5rem]";

/* .form-check later than the shared label rule: display/flex, gap, and
   margin-bottom 0.9rem win; colour and 0.95rem size from the first rule stay. */
export const teamRegFormCheck =
  "flex items-start gap-[0.65rem] mb-[0.9rem] font-medium text-text text-[0.95rem] " +
  "leading-[1.4] cursor-pointer " +
  "[&_input]:mt-[0.2rem] [&_input]:w-[1.05rem] [&_input]:h-[1.05rem] [&_input]:shrink-0 " +
  "[&_input]:accent-brand-primary";

export const teamRegColorRow =
  "grid grid-cols-[auto_1fr] gap-[0.65rem] items-center mt-[0.4rem] " +
  "[&_input[type=color]]:w-[2.75rem] [&_input[type=color]]:h-[2.5rem] " +
  "[&_input[type=color]]:p-[0.15rem] [&_input[type=color]]:border [&_input[type=color]]:border-[#ddd] " +
  "[&_input[type=color]]:rounded-sm [&_input[type=color]]:cursor-pointer [&_input[type=color]]:bg-bg";

export const rosterRow =
  "grid grid-cols-[1fr_1fr_auto] gap-[0.65rem] mb-[0.65rem] items-center upto-md:grid-cols-[1fr] " +
  "[&_input]:w-full [&_input]:box-border [&_input]:py-[0.65rem] [&_input]:px-[0.75rem] " +
  "[&_input]:border [&_input]:border-[#ddd] [&_input]:rounded-sm [&_input]:text-[0.95rem] " +
  "[&_input]:outline-none [&_input:focus]:border-brand-primary " +
  "[&_input:focus]:shadow-[0_0_0_2px_var(--color-focus-ring)]";

export const rosterRowRemove =
  "py-[0.55rem] px-[0.75rem] border border-border bg-bg-muted rounded-sm cursor-pointer " +
  "text-[0.85rem] font-semibold text-text-muted " +
  "hover:bg-error-bg hover:text-error hover:border-error-border";

export const formActions =
  "flex gap-[0.75rem] flex-wrap justify-end mt-[1.5rem]";

export const formActionsStart =
  "flex gap-[0.75rem] flex-wrap justify-start mt-[1.5rem]";

export const teamRegBack =
  "inline-flex items-center gap-[0.35rem] mb-[1rem] text-brand-primary font-semibold " +
  "no-underline hover:underline";

export const teamRegDetailTitleRow =
  "flex flex-wrap items-center gap-[0.75rem] mb-[0.35rem] " +
  "[&_h1]:m-0 [&_h1]:text-[1.75rem] [&_h1]:font-bold [&_h1]:text-brand-primary";

export const teamRegsConflictModal =
  "[&_label]:block [&_label]:my-[0.75rem] [&_label]:font-medium " +
  "[&_input]:block [&_input]:w-full [&_input]:mt-[0.35rem] [&_input]:py-[0.6rem] " +
  "[&_input]:px-[0.75rem] [&_input]:border [&_input]:border-[#ddd] [&_input]:rounded-sm [&_input]:box-border " +
  "[&_select]:block [&_select]:w-full [&_select]:mt-[0.35rem] [&_select]:py-[0.6rem] " +
  "[&_select]:px-[0.75rem] [&_select]:border [&_select]:border-[#ddd] [&_select]:rounded-sm [&_select]:box-border";

export const teamRegsConflictList =
  "list-none my-[1rem] mx-0 p-0 grid gap-[0.65rem] " +
  "[&_li]:p-[0.75rem] [&_li]:bg-bg-muted [&_li]:rounded-sm [&_li]:border [&_li]:border-border";
