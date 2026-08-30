export const VIEWPORT_COMPACT_MAX = 1024;
export const VIEWPORT_MOBILE_MAX = 768;
export const VIEWPORT_WIDE_MIN = 1800;
export const VIEWPORT_HOME_LARGE_MIN = 1600;

export type ViewportLayout = "mobile" | "compact" | "normal" | "wide";

export function getVisualViewportWidth(): number {
    return window.visualViewport?.width ?? window.innerWidth;
}

export function getViewportLayout(width = getVisualViewportWidth()): ViewportLayout {
    if (width <= VIEWPORT_MOBILE_MAX) {
        return "mobile";
    }
    if (width <= VIEWPORT_COMPACT_MAX) {
        return "compact";
    }
    if (width >= VIEWPORT_WIDE_MIN) {
        return "wide";
    }
    return "normal";
}

export function syncViewportLayout(): ViewportLayout {
    const width = getVisualViewportWidth();
    const layout = getViewportLayout(width);
    const root = document.documentElement;

    root.dataset.viewport = layout;
    root.style.setProperty("--visual-viewport-width", `${width}px`);

    return layout;
}

export function subscribeVisualViewport(onChange: () => void): () => void {
    window.visualViewport?.addEventListener("resize", onChange);
    window.visualViewport?.addEventListener("scroll", onChange);
    window.addEventListener("resize", onChange);

    return () => {
        window.visualViewport?.removeEventListener("resize", onChange);
        window.visualViewport?.removeEventListener("scroll", onChange);
        window.removeEventListener("resize", onChange);
    };
}
