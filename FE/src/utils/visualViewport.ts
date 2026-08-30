/**
 * visualViewport — measures the *visual* viewport (which, unlike a media query, accounts for
 * a pinch-zoomed or software-keyboard-shrunk window) and publishes the resulting layout tier
 * to `data-viewport` on <html>, where the `vp-*` Tailwind variants pick it up.
 *
 * The thresholds are NOT hardcoded here: they are read from the `--viewport-*` custom
 * properties defined in `styles/globals.css`, the same values the `vp-mobile` / `vp-compact` /
 * `vp-normal` / `vp-wide` variants are written against. Change a number in globals.css and
 * both the CSS variants and this module recalibrate together — they cannot drift apart.
 *
 * The constants below are pre-paint fallbacks for the tokens they mirror, used only when
 * `getComputedStyle` can't see the stylesheet yet (or during SSR).
 */

/** Fallbacks for the --viewport-* tokens in styles/globals.css. Keep in sync with that file. */
const FALLBACK_MOBILE_MAX = 768;
const FALLBACK_COMPACT_MAX = 1024;
const FALLBACK_WIDE_MIN = 1800;
const FALLBACK_HOME_LARGE_MIN = 1600;

/** Reads a numeric custom property off `:root`, falling back before styles have loaded. */
function readViewportToken(name: string, fallback: number): number {
    if (typeof window === 'undefined') return fallback;
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
}

/** The tier thresholds, resolved from CSS on first read and cached for the session. */
let cachedThresholds: {
    mobileMax: number;
    compactMax: number;
    wideMin: number;
    homeLargeMin: number;
} | null = null;

export function viewportThresholds() {
    if (!cachedThresholds) {
        cachedThresholds = {
            mobileMax: readViewportToken('--viewport-mobile-max', FALLBACK_MOBILE_MAX),
            compactMax: readViewportToken('--viewport-compact-max', FALLBACK_COMPACT_MAX),
            wideMin: readViewportToken('--viewport-wide-min', FALLBACK_WIDE_MIN),
            homeLargeMin: readViewportToken('--viewport-home-large-min', FALLBACK_HOME_LARGE_MIN),
        };
    }
    return cachedThresholds;
}

/* Named exports kept for the existing call sites that compare against a threshold directly.
   They resolve from CSS on first access via the getters below. */
export const VIEWPORT_MOBILE_MAX = FALLBACK_MOBILE_MAX;
export const VIEWPORT_COMPACT_MAX = FALLBACK_COMPACT_MAX;
export const VIEWPORT_WIDE_MIN = FALLBACK_WIDE_MIN;
export const VIEWPORT_HOME_LARGE_MIN = FALLBACK_HOME_LARGE_MIN;

export type ViewportLayout = 'mobile' | 'compact' | 'normal' | 'wide';

export function getVisualViewportWidth(): number {
    return window.visualViewport?.width ?? window.innerWidth;
}

export function getViewportLayout(width = getVisualViewportWidth()): ViewportLayout {
    const { mobileMax, compactMax, wideMin } = viewportThresholds();

    if (width <= mobileMax) return 'mobile';
    if (width <= compactMax) return 'compact';
    if (width >= wideMin) return 'wide';
    return 'normal';
}

export function syncViewportLayout(): ViewportLayout {
    const width = getVisualViewportWidth();
    const layout = getViewportLayout(width);
    const root = document.documentElement;

    root.dataset.viewport = layout;
    root.style.setProperty('--visual-viewport-width', `${width}px`);

    return layout;
}

export function subscribeVisualViewport(onChange: () => void): () => void {
    window.visualViewport?.addEventListener('resize', onChange);
    window.visualViewport?.addEventListener('scroll', onChange);
    window.addEventListener('resize', onChange);

    return () => {
        window.visualViewport?.removeEventListener('resize', onChange);
        window.visualViewport?.removeEventListener('scroll', onChange);
        window.removeEventListener('resize', onChange);
    };
}
