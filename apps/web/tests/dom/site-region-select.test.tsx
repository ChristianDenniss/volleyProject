import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as navigation from "next/navigation";
import { SiteRegionSelect } from "@components/site/site-region-select";
import { SITE_REGION_COOKIE } from "@/lib/region";

const push = vi.fn();

function mockNavigation(search = "") {
  vi.spyOn(navigation, "useRouter").mockReturnValue({
    push,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    bfcacheId: "",
  });
  vi.spyOn(navigation, "usePathname").mockReturnValue("/players");
  vi.spyOn(navigation, "useSearchParams").mockReturnValue(
    new URLSearchParams(search) as ReturnType<typeof navigation.useSearchParams>,
  );
}

describe("SiteRegionSelect", () => {
  beforeEach(() => {
    push.mockReset();
    document.cookie = `${SITE_REGION_COOKIE}=;max-age=0;path=/`;
    mockNavigation();
  });

  it("stores the chosen region and puts it in the url so the page can be cached per region", async () => {
    const user = userEvent.setup();
    render(<SiteRegionSelect value="na" />);

    await user.click(screen.getByRole("button", { name: "EU" }));

    expect(document.cookie).toContain(`${SITE_REGION_COOKIE}=eu`);
    expect(push).toHaveBeenCalledWith("/players?r=eu");
  });

  it("can clear the region filter with ALL", async () => {
    const user = userEvent.setup();
    render(<SiteRegionSelect value="na" />);

    await user.click(screen.getByRole("button", { name: "ALL" }));

    expect(document.cookie).toContain(`${SITE_REGION_COOKIE}=all`);
    expect(push).toHaveBeenCalledWith("/players?r=all");
  });

  it("drops the parameter for the default region and resets paging", async () => {
    const user = userEvent.setup();
    mockNavigation("r=eu&page=4&q=ava");
    render(<SiteRegionSelect value="eu" />);

    await user.click(screen.getByRole("button", { name: "NA" }));

    expect(push).toHaveBeenCalledWith("/players?q=ava");
  });

  it("marks the active region from the value the server resolved", () => {
    render(<SiteRegionSelect value="eu" />);

    expect(screen.getByRole("button", { name: "EU" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "NA" }).getAttribute("aria-pressed")).toBe("false");
  });
});
