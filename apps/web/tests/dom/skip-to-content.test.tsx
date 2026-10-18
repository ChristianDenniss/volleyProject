import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@components/site/site-footer", () => ({
  SiteFooter: () => <footer>Footer</footer>,
}));

vi.mock("@components/site/site-topbar", () => ({
  SiteTopbar: () => <header>Topbar</header>,
}));

describe("site skip-to-content", () => {
  it("links to the main landmark", async () => {
    const { default: SiteLayout } = await import("../../app/(site)/layout");
    render(
      <SiteLayout>
        <p>Page body</p>
      </SiteLayout>,
    );

    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip.getAttribute("href")).toBe("#main-content");
    expect(screen.getByRole("main").id).toBe("main-content");
  });
});
