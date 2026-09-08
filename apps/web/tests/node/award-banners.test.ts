import { describe, expect, it } from "vitest";
import { awardBanner } from "@/lib/award-banners";

describe("awardBanner", () => {
  it("maps each downloaded type to its banner", () => {
    expect(awardBanner("MVP")).toBe("/images/awards/mvp.png");
    expect(awardBanner("Best Spiker")).toBe("/images/awards/best-spiker.png");
    expect(awardBanner("Best Setter")).toBe("/images/awards/best-setter.png");
    expect(awardBanner("Best Server")).toBe("/images/awards/best-server.png");
    expect(awardBanner("Best Blocker")).toBe("/images/awards/best-blocker.png");
    expect(awardBanner("FMVP")).toBe("/images/awards/fmvp.png");
    expect(awardBanner("MIP")).toBe("/images/awards/mip.png");
    expect(awardBanner("Best Aper")).toBe("/images/awards/best-aper.png");
    expect(awardBanner("DPOS")).toBe("/images/awards/dpos.png");
    expect(awardBanner("Best Receiver")).toBe("/images/awards/best-receiver.png");
    expect(awardBanner("LuvLate Award")).toBe("/images/awards/community-recognition.png");
  });

  it("falls back to a stored image when the type has no banner", () => {
    expect(awardBanner("Best Libero", "/images/s6.png")).toBe("/images/s6.png");
    expect(awardBanner("Best Libero")).toBeNull();
  });
});
