import { act } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SiteHeaderChrome } from "@components/site/site-header-chrome";

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", { configurable: true, value });
}

function scrollTo(value: number) {
  setScrollY(value);
  fireEvent.scroll(window);
}

describe("SiteHeaderChrome", () => {
  it("hides the utility bar after scrolling down and brings it back on scroll up", () => {
    setScrollY(0);
    render(
      <SiteHeaderChrome
        utility={<div>Utility chrome</div>}
        nav={<div>League nav</div>}
      />,
    );

    const header = screen.getByRole("banner");
    expect(header.getAttribute("data-compact")).toBeNull();
    expect(header.style.top).toBe("0px");

    act(() => scrollTo(120));
    expect(header.hasAttribute("data-compact")).toBe(true);
    expect(header.style.top).toBe("calc(var(--site-utility-h) * -1)");

    act(() => scrollTo(80));
    expect(header.getAttribute("data-compact")).toBeNull();
    expect(header.style.top).toBe("0px");
  });

  it("keeps the utility bar visible when the page is near the top", () => {
    setScrollY(0);
    render(
      <SiteHeaderChrome
        utility={<div>Utility chrome</div>}
        nav={<div>League nav</div>}
      />,
    );

    const header = screen.getByRole("banner");
    act(() => scrollTo(4));
    expect(header.getAttribute("data-compact")).toBeNull();
  });
});
