/**
 * chartPalette — the only place chart.js / three.js code is allowed to get a color from.
 *
 * Canvas and WebGL can't consume a CSS class, so chart code needs literal color strings.
 * Rather than let that become an excuse for hex values scattered through chart options,
 * every value here is read back from the `--chart-*` / `--color-*` custom properties
 * defined in `styles/globals.css` — so the token file stays the single source of truth
 * and a palette change still propagates everywhere.
 *
 * `chart-*` tokens are deliberately identical in light and dark mode (see
 * docs/architecture/design-system.md): a series that changed color when the theme
 * toggled would read as the underlying data having changed.
 */

/** Reads a custom property off `:root`. Returns `fallback` during SSR or before styles load. */
function token(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

/** The categorical series palette, in the order series should be assigned. */
export function chartSeriesColors(): string[] {
  return [
    token('--chart-1', '#3b82f6'),
    token('--chart-2', '#27ae60'),
    token('--chart-3', '#f59e0b'),
    token('--chart-4', '#ef4444'),
    token('--chart-5', '#8b5cf6'),
    token('--chart-6', '#f97316'),
    token('--chart-7', '#ec4899'),
    token('--chart-8', '#14b8a6'),
  ]
}

/** Series color for index `i`, wrapping around the palette. Use this instead of
 *  indexing the array directly so a chart with more series than colors still works. */
export function chartSeriesColor(index: number): string {
  const colors = chartSeriesColors()
  return colors[index % colors.length]
}

/** Chrome colors for axes, gridlines, labels and tooltips — everything that is not a series. */
export function chartChrome() {
  return {
    grid: token('--chart-grid', 'rgba(0,0,0,0.08)'),
    axis: token('--border-strong', '#cbd5e1'),
    label: token('--text-tertiary', '#6b7280'),
    tooltipBackground: token('--surface-elevated', '#ffffff'),
    tooltipBorder: token('--border-base', '#e2e8f0'),
    tooltipText: token('--text-primary', '#333333'),
  }
}

/** Semantic colors for charts that encode an outcome rather than a category
 *  (a win/loss split, an over/under bar). */
export function chartStatusColors() {
  return {
    success: token('--status-success', '#27ae60'),
    warning: token('--status-warning', '#f39c12'),
    danger: token('--status-danger', '#dc2626'),
    info: token('--status-info', '#3b82f6'),
    brand: token('--brand-800', '#2d3c50'),
    accent: token('--accent', '#245e9d'),
  }
}

/** `color` at `alpha` opacity, for fills under a line or a hover state.
 *  Works with the hsl()/hex values the tokens resolve to via color-mix. */
export function withAlpha(color: string, alpha: number): string {
  return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`
}

/**
 * Player-archetype identity colors, resolved from the `--archetype-*` tokens.
 *
 * `analytics/playerArchetypes.ts` needs literal color strings (three.js and chart.js can't
 * read a CSS class), but the values themselves belong in the token file — so it names a trait
 * here instead of writing a hex.
 */
export type ArchetypeName =
  | 'striker'
  | 'piercer'
  | 'guardian'
  | 'playmaker'
  | 'finisher'
  | 'intimidator'
  | 'bomber'
  | 'versatile'
  | 'jack'
  | 'balanced'
  | 'unicorn'
  | 'sniper'
  | 'gunslinger'
  | 'anchor'
  | 'technician'
  | 'unclassified'

/** Pre-paint fallbacks, mirroring the --archetype-* values in styles/globals.css. */
const ARCHETYPE_FALLBACKS: Record<ArchetypeName, string> = {
  striker: '#ff6b6b',
  piercer: '#ff8787',
  guardian: '#4ecdc4',
  playmaker: '#c7ceea',
  finisher: '#a8e6cf',
  intimidator: '#fcbad3',
  bomber: '#ffd3a5',
  versatile: '#ffffd2',
  jack: '#d4a5ff',
  balanced: '#95e1d3',
  unicorn: '#9b59b6',
  sniper: '#ffb74d',
  gunslinger: '#ff8c94',
  anchor: '#c8e6c9',
  technician: '#64b5f6',
  unclassified: '#95a5a6',
}

export function archetypeColor(name: ArchetypeName): string {
  return token(`--archetype-${name}`, ARCHETYPE_FALLBACKS[name])
}

/**
 * Team-card accent rotation — the eight header colors a season's team grid cycles through.
 *
 * Positional, not semantic: index N means "the Nth card in the grid", nothing about the team.
 * Returns a `var(--team-accent-N)` reference rather than a resolved value, because the only
 * consumer is an inline `backgroundColor` in the DOM, which can read a custom property
 * directly — no getComputedStyle round-trip needed.
 */
const TEAM_ACCENT_COUNT = 8

export function teamAccentVar(index: number): string {
  return `var(--team-accent-${(index % TEAM_ACCENT_COUNT) + 1})`
}
