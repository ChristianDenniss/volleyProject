# Design System

`CLAUDE.md` Rule 2 ("always use the color guide") lists *which* classes are allowed. This document explains the mechanism behind them: where the values live, how the brand scale is generated from two numbers, how the light/dark switch works, and why some palettes are deliberately theme-invariant.

Everything is in **`FE/src/styles/globals.css` — the app's only stylesheet.** There are no per-page CSS files. (There were 140 of them before this conversion; the whole set is gone.)

---

## Token layers

Colour resolves through three stages, and component code only ever touches the last one:

```
raw hex          →  semantic CSS var   →  Tailwind utility  →  class in a component
#ffffff             --surface-base        --color-surface       bg-surface
```

The middle stage is what makes theming possible: `.dark` swaps the raw layer wholesale and nothing downstream changes.

- **Surfaces** (`bg-page`, `bg-surface`, `bg-surface-raised`, `bg-surface-elevated`, `bg-surface-inset`) — background layers ordered by elevation, from the outermost page shell down to recessed inputs and zebra rows.
- **Inverse surfaces** (`bg-surface-inverse`, `-raised`, `-inset` + `text-content-inverse`) — the panels that are *deliberately dark in a light app*: the player-profile hero, the site nav and footer, the 3D vector graph. These are a design choice, not a theme state, so they do **not** invert in dark mode.
- **Text** (`text-content`, `-secondary`, `-tertiary`, `-muted`) — foreground ordered by prominence, headings down to placeholders.
- **Borders** (`border-border`, `border-border-strong`) — card edges and dividers vs. focused inputs and prominent rules.
- **Brand / accent** (`bg-brand`, `bg-brand-hover`, `bg-brand-muted`, `bg-brand-subtle`, `bg-brand-faint`, `text-accent`, `text-on-brand`) — the single dynamic hue, described below.
- **Status** (`status-success/warning/danger/info/pending/running/gold/silver/bronze/purple/orange/pink`) — semantic states and entity types. Intentionally allowed to shift value between themes so text and badge contrast holds on either ground.
- **Chart / archetype / team-accent** — data-vis palettes. Fixed in both themes; see below.
- **Shadows** (`var(--shadow-xs|sm|md|lg|modal|chart)`) — fixed black in both themes, applied via a Tailwind arbitrary value (`shadow-[var(--shadow-md)]`) or an inline `style`.
- **Radius** (`rounded-control`, `rounded-card`, `rounded-panel`) — named by intent, so "make the app rounder" is one edit.
- **Fluid layout** (`p-page`, `gap-section`, `text-page-title`, `max-w-shell`, `h-header`, `h-nav`) — the `clamp()` values that keep the shell proportional from phone to ultrawide.

---

## The dynamic brand scale

Two custom properties drive all eleven brand stops:

```css
:root {
  --brand-hue:   212;
  --brand-l-mid: 62%;

  --brand-200: hsl(var(--brand-hue), 100%, clamp(0%, calc(var(--brand-l-mid) + 20%), 100%));
  --brand-400: hsl(var(--brand-hue),  80%, var(--brand-l-mid));
  --brand-800: hsl(var(--brand-hue),  27%, clamp(0%, calc(var(--brand-l-mid) - 37%), 100%));
  /* …eight more, same shape */
}
```

`--brand-l-mid` is the lightness anchor — it *is* `--brand-400` verbatim. Every other stop is a `calc()` offset from it with its own fixed saturation, `clamp()`ed into a valid range so an extreme pick can't produce invalid HSL.

Because each stop is a **formula over the same two variables** rather than a hardcoded hex, writing `--brand-hue` at runtime recolours all eleven stops at once — no palette regeneration, no re-render. That is what would make a runtime hue picker possible.

The ramp is calibrated to pass through the league's two historical brand colours:

| Stop | Value | Historically |
|---|---|---|
| `--brand-800` | `#2e3f51` | the navy `#2D3C50` used for nav, headers and primary actions |
| `--brand-200` | `#a3d1ff` | the pale sky blue `#a1d2ff` used for highlights, badges and table stripes |

Only a few stops are wired into the semantic layer: `--brand-800` backs `bg-brand`, `--brand-700` backs `bg-brand-hover`, and `--accent` resolves to `--brand-600` in light mode / `--brand-300` in dark — a deliberately different stop per theme so the accent keeps contrast against `--surface-page` in both directions.

---

## Light / dark

The dark palette is **fully defined** in a `.dark` block that swaps only the raw layer. Nothing sets `.dark` yet — the app ships light-only — but the tokens are in place, so adding a theme toggle is a class on `<html>`, not a redesign.

`@custom-variant dark (&:where(.dark, .dark *))` makes every `dark:` utility respond to that class rather than the OS media query, so the toggle can override the system preference.

---

## Why chart-* is separate from status-*

`status-*` and `chart-*` cover overlapping ground (success/warning/danger/info/purple/orange/pink) and it's tempting to reach for `status-*` when adding a chart fill. They are deliberately separate:

- **`status-*` is semantic and theme-reactive.** `--status-warning` is `#f39c12` in light mode and `#fbbf24` in dark — the value shifts per theme because it's driving text and badge contrast against a background that also changed.
- **`chart-*` is a fixed data-vis palette, identical in both themes.** There is no dark-mode override block for the `chart-*` variables at all. A bar or point series must render as the same colour whichever theme the reader is in; a series that silently changes colour when someone flips the switch makes the chart look like the underlying data changed.

The same reasoning covers the two other fixed palettes:

- **`--archetype-*`** — the sixteen player-archetype identity colours. An archetype's colour *is* its identity; it must not shift.
- **`--team-accent-1..8`** — the header colour rotation on a season's team grid. Positional, not semantic: index N means "the Nth card", nothing about the team.

**Rule of thumb:** a colour on a status pill, tag or badge that should read as "success" independent of what shade that means today → `status-*`. A colour identifying a series, an archetype or a grid position → the fixed palette.

---

## Consuming a fixed palette from canvas/WebGL

chart.js and three.js can't read a CSS class, so they need literal colour strings. That is not a licence to write hex values in chart options — `FE/src/constants/chartPalette.ts` reads the tokens back out of the DOM:

```ts
import { chartSeriesColor, archetypeColor, teamAccentVar, chartChrome } from '@/constants/chartPalette'
```

| Export | Returns |
|---|---|
| `chartSeriesColors()` / `chartSeriesColor(i)` | The eight categorical series colours; `chartSeriesColor` wraps, so more series than colours still works |
| `chartChrome()` | Grid, axis, label and tooltip colours — everything that isn't a series |
| `chartStatusColors()` | Semantic colours for a chart that encodes an outcome rather than a category |
| `archetypeColor(name)` | A named archetype's identity colour |
| `teamAccentVar(i)` | A `var(--team-accent-N)` reference for the team-card rotation |
| `withAlpha(color, a)` | The same colour at a given opacity, via `color-mix` |

Each has a pre-paint hex fallback mirroring its token, for the moment before styles resolve. `chartPalette.ts` is the one file exempt from the no-raw-hex rule, for exactly that reason.

---

## Viewport tiers

Two independent responsive systems, deliberately:

**Breakpoints** override Tailwind's defaults with the values the app's original media queries were written against, so `md:` still means the same 768px it always did:

```
xs 480 · sm 600 · md 768 · lg 900 · xl 1200 · 2xl 1600
```

**Viewport tiers** are a JS-driven layer for the cases a media query gets wrong. `utils/visualViewport.ts` measures the *visual* viewport — which, unlike a media query, accounts for a pinch-zoomed or keyboard-shrunk window on mobile — and writes the tier to `data-viewport` on `<html>`. Custom variants pick it up:

```
vp-mobile:   <= 768px
vp-compact:  769–1024px
vp-normal:   1025–1799px
vp-wide:     >= 1800px
```

`vp-wide:` also matches when the attribute is absent and a plain media query says the window is wide, so the wide layout applies on first paint before the effect runs.

**The thresholds live in one place.** They are `--viewport-*` tokens in the `@theme` block, and `visualViewport.ts` reads those same custom properties at runtime rather than hardcoding numbers. Change a value in `globals.css` and both the CSS variants and the JS tier recalibrate together — they cannot drift apart.

---

## Enforcement

Two checks, both run by `npm run lint:conventions` in `FE/`:

- **`eslint-rules/no-raw-color-classes.js`** walks every string literal and template-literal chunk — not just literal `className=` attributes — so it also catches conditional class construction and module-scope class maps. It flags raw Tailwind palette classes (including behind a `hover:`/`md:` variant or an opacity modifier), `text-white`/`bg-black`, raw hex inside style objects, and the legacy token names from the pre-conversion shim.
- **`scripts/check-css-tokens.mjs`** scans every `.css` file under `src/` and fails on any hex, literal `rgb()`/`hsl()`, or named colour outside `styles/globals.css`. ESLint can't see stylesheets; this closes that gap.

A third rule, `no-inline-style-colors.js`, enforces Rule 4 — an inline `style` prop may only carry a value that genuinely can't be a class.

**The baseline is zero violations.** Files that need an exception are listed in `FE/eslint.conventions.config.mjs` with a stated reason each.
