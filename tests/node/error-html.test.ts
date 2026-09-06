import { describe, expect, it } from "vitest";
import { presentError } from "@/lib/error-presentation";
import { renderErrorHtml } from "@server/error-html";

describe("renderErrorHtml", () => {
  it("renders a troj-style D1 read-limit page", () => {
    const error = new Error("Failed query: select id from seasons");
    error.cause = new Error("D1_ERROR: free tier daily row read limit");

    const html = renderErrorHtml(presentError(error), error.message);
    expect(html).toContain("couldn't load league data");
    expect(html).toContain("rvlLogo.png");
    expect(html).toContain("Refresh");
    expect(html).not.toContain("—");
  });

  it("escapes user-controlled error text", () => {
    const html = renderErrorHtml(presentError(new Error('<img src=x onerror=alert(1)>')));
    expect(html).not.toContain('onerror=alert(1)>');
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });
});
