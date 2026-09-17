import { beforeEach, describe, expect, it } from "vitest";
import { cachedSiteRead, invalidateSiteReads } from "@server/services/site-read-cache";

beforeEach(async () => {
  await invalidateSiteReads();
});

describe("site read cache", () => {
  it("reuses a cached payload until invalidation", async () => {
    let loads = 0;
    const load = async () => {
      loads += 1;
      return { n: loads };
    };

    const first = await cachedSiteRead("site-read-test", ["a"], load);
    const second = await cachedSiteRead("site-read-test", ["a"], load);
    expect(second).toEqual(first);
    expect(loads).toBe(1);

    await invalidateSiteReads();
    const third = await cachedSiteRead("site-read-test", ["a"], load);
    expect(third).toEqual({ n: 2 });
    expect(loads).toBe(2);
  });

  it("keeps separate keys for different parts", async () => {
    let loads = 0;
    const load = async () => {
      loads += 1;
      return loads;
    };

    await cachedSiteRead("site-read-test", ["na"], load);
    await cachedSiteRead("site-read-test", ["eu"], load);
    await cachedSiteRead("site-read-test", ["na"], load);

    expect(loads).toBe(2);
  });
});
