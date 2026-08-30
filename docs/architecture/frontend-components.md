# Component Inventory

> Full reference for `CLAUDE.md` Rule 1 (always reuse existing components). **Search this list before writing any UI element.** Import with the `@/` alias:
>
> ```ts
> import Button from '@/components/ui/buttons/Button'
> import DataTable from '@/components/ui/layout/DataTable'
> ```
>
> Folders are purpose-based. A component that fits a category goes there; a one-off that fits nothing goes in `misc/` until 3+ of a kind justify their own folder.

**47 components across 11 categories.** Every file opens with a 2–3 sentence header comment — read it before deciding a component doesn't fit.

---

## `ui/buttons/` — clickable actions

| Component | Use for |
|---|---|
| `Button` | **Every** clickable action. Variants: `primary` (default), `secondary`, `ghost`, `outline` (a quieter Cancel to pair with a primary Save), `danger`, `danger-filled`, `success`, `warning`, `accent`, `link`. Sizes `xs`/`sm`/`md`/`lg`/`icon`. Props: `fullWidth`, `loading` + `loadingLabel` (swaps the label for a spinner and disables). |
| `IconButton` | Icon-only action where a label won't fit. `label` is **required** — it becomes the tooltip *and* the accessible name. Variants `default`/`danger`/`accent`, plus `active` for a toggled-on state. |
| `LinkButton` | A router `<Link>` (or `<a>` with `external`) wearing Button's exact styling — it reuses Button's variant/size maps, so a navigation action and a click action can't drift apart. Takes `state` for router location state. |

## `ui/badges/` — status chips and counts

| Component | Use for |
|---|---|
| `StatusBadge` | Any status string (pending, accepted, denied, conflict, approved, rejected, scheduled, in_progress, completed, cancelled, active, inactive, open, closed, won, lost). Looks the value up in a config map for colour + icon + label; unknown values fall back to a neutral chip. `iconOnly` for tight cells. Exports `KNOWN_STATUSES` for filter dropdowns. |
| `RegStatusBadge` | The four team-registration statuses, domain-typed. Thin wrapper over `StatusBadge`. Exports `REGISTRATION_STATUSES` in lifecycle order for the legend. |
| `CountBadge` | A count pill beside a heading. `color` carries meaning — keep a zero count neutral. |
| `PlacementBadge` | A finishing position. Only the podium gets colour (gold/silver/bronze); 4th and below stay neutral so a long standings table doesn't read as all-achievement. Exports `ordinal()`. |

## `ui/pills/` — tag chips

| Component | Use for |
|---|---|
| `Pill` | The basic rounded tag. `tone`: neutral/accent/success/warning/danger/info/purple/gold. `bare` for dense lists; passing `onClick` renders a `<button>`. |
| `ResourcePill` | A chip identifying a domain entity that links to its page. One `RESOURCE_CONFIG` map owns both the colour and the route per type (player/team/season/game/article/award/user) — **always use this** instead of an inline coloured `<Link>`. |

## `ui/layout/` — page structure

| Component | Use for |
|---|---|
| `PageContainer` | **The root element of every page.** Fluid gutter, shared max width, vertical rhythm between sections. `width`: `shell` (ultrawide tables), `wide` (detail pages), `narrow` (prose/forms). |
| `PageHeader` | The page's single `<h1>`, with optional icon, count badge, subtitle and right-aligned actions. `align="center"` for landing sections. |
| `SectionHeader` | Sub-headings within a page, with optional count, description and actions. `level` picks the tag so the document outline stays valid. |
| `Toolbar` | The controls strip above a listing — `filters` slot grows, `trailing` slot (search + pagination) pins right, both wrap on narrow screens. |
| `DataTable` | **Every table.** Owns the full state machine: `loading` → SkeletonTable, `error` → ErrorNotice, empty rows → EmptyState. Columns declare `align`, `width`, `hideOnMobile`, and `onSort`/`sortDirection`. `expandedRow` turns any row into an accordion; `rowTone` tints a row semantically; `density="compact"` for wide stat tables; `stickyHeader` pins the header. |
| `CardGrid` | **Every card listing.** Auto-filling grid sized by `minColumnWidth` (`sm`/`md`/`lg`), with the same loading/error/empty handling as DataTable. |
| `Card` | The standard bordered panel. `tone`: surface/raised/inset/**inverse** (deliberately-dark panels)/accent. Optional `header`/`footer` slots, `interactive` for a hoverable tile. |
| `DetailStats` | A responsive definition list of label/value pairs — expanded table rows, detail panels, profile summaries. `wide` spans an entry across the grid. |
| `StatCard` | A single labelled figure with optional icon, footnote and `tone`. |
| `ResultsCounter` | "Showing 11–20 of 243 players" — derives the range from `page`/`pageSize`/`total`, so the off-by-one is solved once. |
| `AuthCard` | The centered panel the sign-in and sign-up screens share: title, error/success notices, form, SSO divider, footer link. |

## `ui/feedback/` — loading, empty, error

| Component | Use for |
|---|---|
| `Skeleton` | The shimmer primitive — size it with utilities. Composed shapes: `SkeletonText`, `SkeletonTable`, `SkeletonCardGrid`. Never write your own pulse div. |
| `EmptyState` | The "nothing here" placeholder. `label` for a one-liner, or `title`/`description`/`icon`/`action`; `compact` drops the border for use inside a bordered panel. |
| `ErrorNotice` | Inline error/warning/info panel with optional title and retry action. `inline` renders a single tight line for field-level validation. Exports `toErrorMessage()` for narrowing an unknown thrown value. |
| `LoadingSpinner` | The app's only spinner. `PageLoader` (same file) is the full-page variant used as the route Suspense fallback. Prefer a `Skeleton` shape when the layout will fill in — a spinner collapses the page height. |
| `ProgressBar` | A 0–100 track with the ARIA progressbar role. Use a spinner instead when progress can't actually be reported. |

## `ui/modals/` — dialogs

| Component | Use for |
|---|---|
| `Modal` | The base dialog shell every concrete modal builds on. Handles Escape, click-outside (`dismissOnBackdrop={false}` to opt out) and body scroll-lock. `size`: sm/md/lg/xl. Optional pinned `footer`. |
| `ConfirmModal` | **The yes/no dialog — never `window.confirm`.** `tone` picks the confirm button's variant; `loading` disables both while the action runs. Name the thing being acted on in `message`. |

## `ui/inputs/` — form controls

| Component | Use for |
|---|---|
| `FormField` | The label/control/hint/error wrapper **every** input sits inside. Generates and wires the control id; pass children as a `(id) => …` function to receive it. |
| `TextInput` | Single-line input (any `type`), with optional leading `icon` and `invalid`. `TextArea` (same file) is the multi-line case. Exports `CONTROL_BASE` / `CONTROL_SIZE_CLASSES` — the shared control chrome, so an input, a select and a search box can't drift apart. |
| `Select` | Native `<select>` taking an `options` array, not `<option>` children. `placeholder` becomes the empty-value row. Exports `toOptions()` for value-equals-label lists. |
| `Checkbox` | Native checkbox with its label as one clickable row; optional `description`. `Radio` (same file) for single-choice. |
| `InlineEditCell` | The click-to-edit table cell every portal table uses. `type` picks the control (`text`/`number`/`url`/`date`); passing `options` renders a select instead. Commits on blur/Enter, reverts on Escape; the caller decides what a commit means. |
| `RegionSeasonFields` | The paired Region + Season selects every portal create form opens with. The Season placeholder reports *why* it's empty (no region yet / loading / none in this region). Drive it with `useFormRegionSeason`. |

## `ui/filters/` — filter controls

| Component | Use for |
|---|---|
| `FilterBar` | The filter group above a list, with a Reset that only appears when `activeCount > 0`. |
| `FilterSelect` | A compact labelled select for a filter bar — marks itself active (accent border) when a value is set. Use `inputs/Select` instead inside a form. |
| `SearchBar` | The list search control, with magnifier and a clear button. Controlled-optional. Debounce in the page with `useDebouncedValue`. |
| `ColumnToggleMenu` | The "which columns?" dropdown for a wide table. Portalled so it escapes the table's overflow clipping; closes on outside-click and Escape. |
| `RegionSwitcher` | The region selector, reading/writing `regionContext`. Renders nothing while loading, so a page can place it unconditionally. |

## `ui/navigation/` — navigation and paging

| Component | Use for |
|---|---|
| `Pagination` | First/prev/next/last around "page / totalPages". Always rendered (disabled at one page) so the footer height never jumps. `compact` drops the jump arrows. |
| `Tabs` | An underline strip or a `segmented` pill group, driven by an `items` array. `TabButton` (same file) for the rare non-declarative case. |
| `Breadcrumb` | The parent trail above a detail title. A crumb without `to` renders as text, so a non-navigable level isn't a dead link. |
| `SubNav` | The inline "·"-separated sibling-page row (League teams · Team registrations · Register a team). The active entry is emphasised text, not a link to itself. |

## `ui/cards/` — domain entity cards

| Component | Use for |
|---|---|
| `GameScoreCard` | The scoreboard row for a match: both teams, the score with the winner emphasised, and a season/stage footer. Exports `TeamCrest` (logo with initials fallback, dims the losing side) and `getGameTeams()`. |

## `ui/misc/` — the catch-all

| Component | Use for |
|---|---|
| `Avatar` | Player/team/user image with a deterministic initials fallback, so a missing avatar never collapses a row. `shape`: circle (people) / square (teams). |
| `OverflowListCell` | A many-valued table cell: first N inline, the rest behind a "+N" popover. Portalled so it escapes the table's `overflow-x` clipping. |
| `Accordion` | Expand/collapse rows from an `items` array. `allowMultiple` (default) or one-at-a-time; controlled via `openIds`/`onToggle` or self-managed. |
| `Prose` | Typography wrapper for long-form content pages. Tailwind's preflight strips element styling, so editorial markup needs its rhythm restored somewhere — this is that place, and it means a content page writes plain semantic HTML. |

---

## Where a new component goes

1. **Fits an existing category?** Put it there.
2. **Nothing fits?** `misc/` — the deliberate catch-all.
3. **`misc/` has 3+ of a kind?** Graduate them into a new category folder.

Then add it to this file, in the same PR (Rule 10).
