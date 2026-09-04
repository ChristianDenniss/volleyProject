import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomeSpotlightRail } from "@components/site/home-spotlight-rail";

describe("HomeSpotlightRail", () => {
  it("renders article and stat cards that extend horizontally", () => {
    render(
      <HomeSpotlightRail
        cards={[
          {
            kind: "article",
            href: "/articles/1",
            title: "Ocean Spikers take the opener",
            imageUrl: "/images/recGfx.png",
            date: "Jan 1",
            fresh: true,
          },
          {
            kind: "stat",
            href: "/players/1",
            title: "Kills · season",
            value: 42,
            name: "ava nine",
          },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: /Ocean Spikers take the opener/i })).toBeDefined();
    expect(screen.getByText("New")).toBeDefined();
    expect(screen.getByText("42")).toBeDefined();
    expect(screen.getByText("ava nine")).toBeDefined();
  });

  it("scrolls the rail when the next control is used", async () => {
    const user = userEvent.setup();
    render(
      <HomeSpotlightRail
        cards={[
          {
            kind: "stat",
            href: "/records",
            title: "Kills",
            value: 12,
            name: "ava nine",
          },
        ]}
      />,
    );

    const scroller = screen.getByLabelText("Latest from the league").querySelector("div.no-scrollbar");
    expect(scroller).not.toBeNull();
    const scrollBy = vi.fn();
    Object.defineProperty(scroller, "scrollBy", { configurable: true, value: scrollBy });
    Object.defineProperty(scroller, "clientWidth", { configurable: true, value: 800 });

    await user.click(screen.getByRole("button", { name: "Scroll spotlight right" }));
    expect(scrollBy).toHaveBeenCalledWith({ left: 560, behavior: "smooth" });
  });
});
