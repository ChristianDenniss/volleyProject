import { describe, expect, it } from "vitest";
import { applyPreviewHeaders, canonicalRedirect, isBareProductionHost } from "@server/preview-host";

const request = (url: string) => new Request(url);

describe("canonicalRedirect", () => {
  it("sends the bare workers.dev host to the canonical origin", () => {
    const response = canonicalRedirect(
      request("https://volley-project.vb42.workers.dev/players?page=2"),
      "https://volley.example.com",
    );

    expect(response?.status).toBe(301);
    expect(response?.headers.get("location")).toBe("https://volley.example.com/players?page=2");
  });

  it("does not redirect to itself when the canonical origin is the workers.dev host", () => {
    const response = canonicalRedirect(
      request("https://volley-project.vb42.workers.dev/players"),
      "https://volley-project.vb42.workers.dev",
    );

    expect(response).toBeNull();
  });

  it("leaves preview aliases alone", () => {
    const response = canonicalRedirect(
      request("https://my-branch-volley-project.vb42.workers.dev/players"),
      "https://volley.example.com",
    );

    expect(response).toBeNull();
  });

  it("leaves the custom domain alone", () => {
    const response = canonicalRedirect(
      request("https://volley.example.com/players"),
      "https://volley.example.com",
    );

    expect(response).toBeNull();
  });

  it("does nothing when no canonical origin is configured", () => {
    expect(canonicalRedirect(request("https://volley-project.vb42.workers.dev/"), undefined)).toBeNull();
  });
});

describe("isBareProductionHost", () => {
  it("matches only the unprefixed worker host", () => {
    expect(isBareProductionHost("volley-project.vb42.workers.dev")).toBe(true);
    expect(isBareProductionHost("preview-volley-project.vb42.workers.dev")).toBe(false);
    expect(isBareProductionHost("volley.example.com")).toBe(false);
  });
});

describe("applyPreviewHeaders", () => {
  it("keeps workers.dev hosts out of search indexes", () => {
    const tagged = applyPreviewHeaders(
      request("https://my-branch-volley-project.vb42.workers.dev/"),
      new Response("ok"),
    );

    expect(tagged.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("leaves the custom domain untouched", () => {
    const untouched = applyPreviewHeaders(request("https://volley.example.com/"), new Response("ok"));

    expect(untouched.headers.get("x-robots-tag")).toBeNull();
  });
});
