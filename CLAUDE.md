# Volleyball 4.2 — Claude Code Standards

> **These are hard rules, not guidelines.** Every rule below is mandatory for all contributors using Claude Code. There are no exceptions. Do not work around them, do not defer them. If a rule conflicts with what you were about to write, change what you were about to write.

---

## Architecture overview

| Layer | Location | Rule |
|---|---|---|
| Pages | `FE/src/components/` (top level), `components/Single/`, `components/portal/` | Render only. No data fetching inline, no HTTP. Every page's root element is a `PageContainer`. |
| Hooks | `FE/src/hooks/` | **All API calls live here, nowhere else.** `allFetch`/`allCreate`/`allPatch`/`allDelete` hold the generic CRUD hooks; a feature with its own request shape gets its own file (`useTeamRegistrations`, `usePortalDashboard`, `useChallongeImport`, …). |
| Shared components | `FE/src/components/ui/<category>/` | Organized by purpose-based category — see `docs/architecture/frontend-components.md`. **Always reuse before creating.** Every component file opens with a 2–3 sentence header comment (what it is / how it behaves / where it lives). |
| Support layers | `FE/src/{constants,context,types,utils,analytics,mocks}/` | Non-UI. `constants/` static config and palettes, `context/` React Context providers, `types/` shared TS types, `utils/` pure helpers, `analytics/` the vectorization + archetype model. |
| Styles / tokens | `FE/src/styles/globals.css` | **The single source of truth for every color, radius, shadow and fluid-layout value. It is the app's only stylesheet.** |

### Component category folders

`components/ui/` is split into purpose-based categories, not one flat folder:

`buttons/` · `badges/` · `pills/` · `cards/` (domain entity cards) · `layout/` · `feedback/` · `modals/` · `inputs/` · `filters/` · `navigation/` · `misc/`

When a component clearly fits a category, put it there; otherwise `misc/` until 3+ of a kind justify a new folder. Don't create a folder for one component — let it live in `misc/` until the pattern is real.

Import with the `@/` alias, never a relative path that climbs out of a folder:

```ts
import Button from '@/components/ui/buttons/Button'
import DataTable from '@/components/ui/layout/DataTable'
```

---

## Automated enforcement (ESLint)

Rules 2, 3 and 5 are backed by custom ESLint rules, not just this document. `npm run lint:conventions` (in `FE/`) runs them against the **entire** repo plus a stylesheet scan, and is available for any contributor to run locally before pushing. Treat it as a mandatory local check.

| Rule | Enforcement |
|---|---|
| Rule 2 (color guide) | `FE/eslint-rules/no-raw-color-classes.js` — flags raw Tailwind palette classes, raw hex in style objects, and legacy token names |
| Rule 2 (stylesheets) | `FE/scripts/check-css-tokens.mjs` — fails on any raw color in a `.css` file outside `styles/globals.css` |
| Rule 3 (API calls in hooks) | `FE/eslint-rules/api-calls-in-hooks.js` — scope-aware, so a locally-declared `const fetch = …` isn't flagged |
| Rule 5 (no inline styling) | `FE/eslint-rules/no-inline-style-colors.js` — flags any inline style property that has a token utility |

Standard TypeScript/React linting runs via `npm run lint`; `npm run typecheck` is a standalone type-check.

**The current baseline is zero violations.** Do not reintroduce one.

---

## Rule 1 — HARD RULE: Always reuse existing components

**You must search `FE/src/components/ui/` before writing any UI element.** If a component exists — use it. If it almost covers the need — add a prop to extend it. Only create a new file if nothing remotely close exists, and add it to `docs/architecture/frontend-components.md` when you do.

**Full component inventory: `docs/architecture/frontend-components.md`.**

**Signals that you are about to violate this rule:**

- You are writing a raw `<button className="…">` outside of `Button.tsx`
- You are writing a `<table>` instead of using `DataTable`
- You are writing `<p>No players found.</p>` for an empty state instead of `EmptyState`
- You are writing a shimmer/pulse div instead of using `Skeleton`
- You are writing `<span className="…rounded-full…">` for a badge instead of `StatusBadge` or a `Pill`
- You are writing a `<label>` + `<input>` pair instead of `FormField` + `TextInput`
- You are writing a new component file without first grepping `components/ui/` for an existing one

### Loading, empty and error states are not yours to build

`DataTable` and `CardGrid` each take `loading`, `error` and an empty-label prop and render the right thing themselves. A page passes those through — it does not branch on them:

```tsx
// Correct
<DataTable columns={columns} rows={players} rowKey={p => p.id}
           loading={loading} error={error} emptyLabel="No players match your filters." />

// Wrong — three states the shared component already owns
if (loading) return <p>Loading…</p>
if (error) return <p>Error: {error}</p>
if (!players.length) return <p>No players found.</p>
```

---

## Rule 2 — HARD RULE: Always use the color guide

**Every color must come from the token system in `FE/src/styles/globals.css`.** Raw Tailwind palette classes and hex values are forbidden without exception.

**Why:** tokens are the whole point of the design system — they are what makes a palette change one edit instead of 140, and what makes the (already-defined) dark theme possible. A raw palette class bypasses all of it.

**If you are about to type a color class that is not in the list below — stop. Look up the right token. If no token fits, add one to `globals.css` and say so in the PR.**

### Allowed token classes

**Surfaces**
```
bg-page   bg-surface   bg-surface-raised   bg-surface-elevated   bg-surface-inset
bg-surface-inverse   bg-surface-inverse-raised   bg-surface-inverse-inset
```
`surface-inverse-*` are the deliberately-dark panels in a light app (player hero, season card, the 3D graph). They are a design choice, not a theme state, and do **not** invert in dark mode.

**Text**
```
text-content   text-content-secondary   text-content-tertiary   text-content-muted
text-content-inverse
```

**Borders**
```
border-border   border-border-strong
```

**Brand / accent**
```
bg-brand   bg-brand-hover   bg-brand-muted   bg-brand-subtle   bg-brand-faint
text-accent   bg-accent   border-accent   text-on-brand   text-on-accent
```
Opacity modifiers work: `bg-brand/10`, `border-accent/30`.

**Status** (semantic — for states and entity types)
```
{text,bg,border}-status-{success|warning|danger|info|pending|running|gold|silver|bronze|purple|orange|pink}
```

| Token | Use for |
|---|---|
| `status-success` | Won, accepted, approved, active, published |
| `status-warning` | Pending, caution, needs review |
| `status-danger` | Lost, denied, rejected, errors, destructive actions |
| `status-info` | In progress, informational, **teams** |
| `status-gold` / `silver` / `bronze` | 1st / 2nd / 3rd place, MVP, championship |
| `status-purple` | Playoff stage, articles, special events |
| `status-orange` | Scheduled / upcoming, **seasons** |
| `status-pink` | User / staff entity type, **games** |

**Standard badge pattern:** `bg-status-*/15  text-status-*  border border-status-*/30`.

**Chart / archetype / team-accent** — fixed data-vis palettes, **identical in both themes**:
```
--chart-1 … --chart-8          categorical chart series
--archetype-<trait>            player-archetype identity colours
--team-accent-1 … -8           positional team-card header rotation
```
Canvas and WebGL can't read a CSS class, so these are consumed through `constants/chartPalette.ts` (`chartSeriesColor`, `archetypeColor`, `teamAccentVar`), never as literals in component code.

**Shadows** — fixed black, identical in both themes. Applied via a Tailwind arbitrary value or an inline `style`, since there is no first-class utility:
```tsx
className="shadow-[var(--shadow-md)]"
style={{ boxShadow: 'var(--shadow-modal)' }}
```
Do not write a raw `rgba(0,0,0,…)` shadow.

**Overlay scrims** — modal/drawer backdrops only:
```tsx
style={{ background: 'var(--color-overlay)' }}
```

### Forbidden — never allowed

```
text-red-500      bg-blue-600      text-emerald-400   bg-gray-700
text-white        bg-white         text-black         bg-black
style={{ color: '#hex' }}          style={{ background: '#hex' }}
Any hex value in a .css file outside styles/globals.css
```

### Documented exceptions

A small set of files are exempt, each for a stated reason — see the `COLOR_RULE_EXEMPT` and `INLINE_STYLE_EXEMPT` lists in `FE/eslint.conventions.config.mjs`. Every entry names *why*. Do not add one without the same justification, and do not "fix" the existing ones to tokens.

---

## Rule 3 — HARD RULE: API calls belong in hooks only

**Components never call `fetch`, `authFetch` or `axios` directly.** All data fetching lives in `FE/src/hooks/`. If you need data in a component, write or reuse a hook — never inline the call.

This includes **Context providers**: `authContext` and `regionContext` go through `hooks/useSessionApi.ts`, not raw `fetch`.

**Full hook inventory: `docs/architecture/frontend-hooks.md`.**

**Signals that you are about to violate this rule:**

- You typed `await fetch(` in a `.tsx` file
- You imported `authFetch` outside `src/hooks/`
- Your page has a `useEffect` that builds a URL

---

## Rule 4 — HARD RULE: No inline styling

A `style={{ … }}` prop is only allowed for a value that genuinely **cannot** be a class:

- a runtime-computed dimension or position (a portalled popover's coordinates)
- a runtime-computed color that resolves from a token (`archetype.color`, `teamAccentVar(i)`)
- a runtime-computed opacity or transform
- a documented token escape (`var(--color-overlay)`, `var(--shadow-*)`)

Everything else — colors, spacing, font sizes, display, flex, radius — has a token utility. Use it.

---

## Rule 5 — No duplicated UI patterns

If you find yourself writing the same JSX structure a second time, it belongs in a shared component. Patterns that already have one:

| Need | Component |
|---|---|
| Page shell | `layout/PageContainer` |
| Page title + actions | `layout/PageHeader` |
| Section heading | `layout/SectionHeader` |
| Any table | `layout/DataTable` |
| Any card listing | `layout/CardGrid` |
| Filters + search + pagination row | `layout/Toolbar` + `filters/FilterBar` |
| "Showing 11–20 of 243" | `layout/ResultsCounter` |
| Label/value pairs | `layout/DetailStats` |
| Click-to-edit table cell | `inputs/InlineEditCell` |
| Label + control + error | `inputs/FormField` |
| Confirmation dialog | `modals/ConfirmModal` (never `window.confirm`) |
| Loading placeholder | `feedback/Skeleton` and its shapes |
| Empty result | `feedback/EmptyState` |
| Failure message | `feedback/ErrorNotice` |

Repeated *logic* is the same rule: stat summing lives in `utils/statTotals`, Hall of Fame scoring in `utils/hallOfFame`. Don't re-derive either at a call site.

---

## Rule 6 — HARD RULE: Confirm destructive actions with ConfirmModal

`window.confirm` and `alert` are not part of the design system and must not appear in component code. A destructive or irreversible action opens a `ConfirmModal` whose message **names the thing being acted on**:

```tsx
<ConfirmModal
  isOpen={pendingDelete !== null}
  onClose={() => setPendingDelete(null)}
  onConfirm={confirmDelete}
  title="Delete player"
  confirmLabel="Delete"
  message={<>Delete <strong>{pendingDelete?.name}</strong>? This cannot be undone.</>}
/>
```

---

## Rule 7 — HARD RULE: Keep MSW in sync

**Every backend change that affects an API contract must be mirrored in the MSW mocks** (`FE/src/mocks/`). The frontend dev server (`npm run dev-mock`) runs entirely on MSW; if mocks drift, filters silently do nothing and new UI states are never exercised.

- New endpoint → add a handler in `mocks/handlers.ts`
- New filter/query param → apply it in the relevant `GET` handler
- New field on an entity → add it to `mocks/data.ts`
- Changed response shape → update handler and fixtures

---

## Rule 8 — Declare data, don't repeat markup

Any list a page renders more than twice — nav items, stat columns, filter options, form fields, category headings — is declared as a module-scope array or map and mapped over. This is what makes "add a statistic" or "add a nav link" a one-line change.

Established examples: `SiteNav.NAV_ITEMS`, `PortalLayout.PORTAL_SECTIONS`, `StatsPage.STAT_FIELDS`, `StatsLeaderboard.STAT_COLUMNS`, `RecordsPage.RECORD_TYPE_ORDER`, `utils/statTotals.STAT_TOTAL_FIELDS`, `Button.VARIANT_CLASSES`.

A variant map beats a conditional class string:

```tsx
// Correct
const VARIANT_CLASSES = { primary: '…', danger: '…' }
className={`… ${VARIANT_CLASSES[variant]}`}

// Wrong
className={`… ${variant === 'primary' ? '…' : variant === 'danger' ? '…' : '…'}`}
```

---

## Rule 9 — Every shared component opens with a header comment

Two to three sentences: **what it is**, **the one non-obvious thing about how it behaves**, and **where it lives / when to reach for something else**. This is what makes Rule 1 possible — you can only reuse what you can recognise.

```tsx
/**
 * EmptyState — the standard "nothing here" placeholder: a centered dashed-border panel …
 * Pass `label` for a one-liner, or `title`/`description`/`icon`/`action` for a richer state; …
 * Lives in `components/ui/feedback/`; use it instead of writing `<p>No players found.</p>`.
 */
```

---

## Rule 10 — HARD RULE: Keep `docs/` current with the change you're making

If a change touches something a doc under `docs/` describes, update that doc in the **same PR**:

- New shared component → add it to `docs/architecture/frontend-components.md`
- New hook → add it to `docs/architecture/frontend-hooks.md`
- New or changed token → update `docs/architecture/design-system.md`
- A non-obvious design choice → write it down where the next reader will look

**Why:** a rule that isn't followed at commit time regresses. Doc updates are part of the change, not cleanup.

---

## Rule 11 — No unused imports, no dead code

If a change orphans an import, variable, export or file — remove it as part of that change. Don't leave a "will clean up later" import, and don't leave a file with zero remaining references because deleting it feels out of scope.

**Before deleting, verify it's actually dead** — a few things look unused but aren't:

| Looks unused because… | Actually because… |
|---|---|
| A CSS-only dependency (`tailwindcss`) flagged by a JS scanner | Consumed via `@import` in `globals.css`, which a JS-import scanner can't see |
| An exported `const` with no cross-file imports | May be used within its own file — drop the `export`, don't delete the declaration |
| A comment *mentioning* a symbol | Not a usage — confirm the hit is code, not prose |
| A fixture in `mocks/data.ts` commented as staged for a planned feature | Deliberately unwired — leave it and its comment alone |
