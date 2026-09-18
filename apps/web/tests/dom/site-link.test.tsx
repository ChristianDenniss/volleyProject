import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteLink } from "@components/site/site-link";

describe("SiteLink", () => {
  it("defaults prefetch off so in-viewport links do not RSC-fetch", () => {
    render(<SiteLink href="/players">Players</SiteLink>);
    expect(screen.getByRole("link").getAttribute("data-prefetch")).toBe("false");
  });

  it("can opt a destination back into prefetch", () => {
    render(
      <SiteLink href="/" prefetch>
        Home
      </SiteLink>,
    );
    expect(screen.getByRole("link").getAttribute("data-prefetch")).toBe("true");
  });
});
