import { act } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beginSiteNav, endSiteNav, SiteNavProgress } from "@components/site/site-nav-progress";

describe("SiteNavProgress", () => {
  afterEach(() => {
    endSiteNav();
  });

  it("shows a progress bar when an in-site link is clicked", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <SiteNavProgress />
        <a href="/teams">Teams</a>
      </div>,
    );

    expect(screen.getByRole("progressbar", { hidden: true }).getAttribute("aria-hidden")).toBe("true");

    await user.click(screen.getByRole("link", { name: "Teams" }));

    expect(screen.getByRole("progressbar").getAttribute("aria-valuetext")).toBe("Loading page");
    expect(document.documentElement.classList.contains("nav-pending")).toBe(true);
  });

  it("still shows progress when the link prevents default for client routing", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <SiteNavProgress />
        <a href="/stats">Stats</a>
      </div>,
    );

    const link = screen.getByRole("link", { name: "Stats" });
    link.addEventListener("click", (event) => event.preventDefault());
    await user.click(link);

    expect(screen.getByRole("progressbar").getAttribute("aria-valuetext")).toBe("Loading page");
  });

  it("can be started without a click for region refreshes", () => {
    render(<SiteNavProgress />);
    act(() => {
      beginSiteNav();
    });
    expect(screen.getByRole("progressbar").getAttribute("aria-valuetext")).toBe("Loading page");
  });
});
