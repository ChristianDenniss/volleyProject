import { describe, expect, it } from "vitest";
import {
  errorChain,
  errorDetail,
  presentError,
  presentNotFound,
  presentUnknownError,
} from "@/lib/error-presentation";
import { formatErrorTitle, formatUnknownError } from "@/lib/format-error";
import { explainError } from "@server/report";

describe("presentNotFound", () => {
  it("uses the shared 404 screen", () => {
    const presentation = presentNotFound();
    expect(presentation.kind).toBe("not-found");
    expect(presentation.title).toContain("could not be found");
    expect(presentation.link?.href).toBe("/");
  });

  it("keeps a specific not-found message in the body", () => {
    const presentation = presentNotFound("Article 5 not found");
    expect(presentation.body).toContain("Article 5 not found");
  });
});

describe("presentError", () => {
  it("shows a friendly D1 read-limit screen", () => {
    const error = new Error(`Failed query: select "id" from "seasons"\nparams: `);
    error.cause = new Error(
      "D1_ERROR: Your account has exceeded D1's free tier daily row read limit. Upgrade to a paid plan or wait until tomorrow (midnight UTC) to continue.",
    );

    const presentation = presentError(error);
    expect(presentation.kind).toBe("d1-read-limit");
    expect(presentation.title).toContain("couldn't load league data");
    expect(presentation.body).toContain("Sorry about that");
    expect(presentation.summary).toContain("midnight UTC");
    expect(presentation.body).not.toContain("—");
  });

  it("shows a friendly D1 write-limit screen", () => {
    const presentation = presentError(
      new Error("Your account has exceeded D1's free tier daily row write limit."),
    );
    expect(presentation.kind).toBe("d1-write-limit");
    expect(presentation.title).toContain("couldn't save");
  });

  it("surfaces the D1 cause in the hint instead of the drizzle SQL dump", () => {
    const error = new Error('Failed query: select "id" from "awards"\nparams: ');
    error.cause = new Error("D1_ERROR: SQLITE_ERROR: no such column: missing");

    expect(presentError(error).summary).toBe("SQLITE_ERROR: no such column: missing");
    expect(presentError(error).title).toBe("We couldn't load league data right now.");
    expect(presentError(error).kind).toBe("database");
  });

  it("detects network failures", () => {
    const presentation = presentError(new TypeError("Failed to fetch"));
    expect(presentation.kind).toBe("network");
    expect(presentation.title).toBe("We couldn't reach the server.");
  });

  it("detects render and hydration failures", () => {
    const presentation = presentError(new Error("Hydration failed because the server HTML did not match."));
    expect(presentation.kind).toBe("render");
    expect(presentation.title).toBe("Something went wrong.");
  });

  it("detects unexpected API responses", () => {
    const presentation = presentError(
      new Error("Expected JSON from the API, got 502 text/html: <!DOCTYPE html>"),
    );
    expect(presentation.kind).toBe("service-unavailable");
  });

  it("keeps an ordinary message for unknown errors", () => {
    expect(presentError(new Error("Season 2 already exists")).summary).toBe("Season 2 already exists");
  });
});

describe("presentUnknownError", () => {
  it("maps tRPC NOT_FOUND to the 404 screen", () => {
    const error = Object.assign(new Error("Article 5 not found"), { data: { code: "NOT_FOUND" } });
    expect(presentUnknownError(error).kind).toBe("not-found");
    expect(formatErrorTitle(error)).toContain("could not be found");
  });

  it("maps tRPC UNAUTHORIZED to a sign-in screen", () => {
    const error = Object.assign(new Error("UNAUTHORIZED"), { data: { code: "UNAUTHORIZED" } });
    const presentation = presentUnknownError(error);
    expect(presentation.kind).toBe("unauthorized");
    expect(presentation.link?.href).toBe("/login");
  });

  it("maps tRPC FORBIDDEN to an access screen", () => {
    const error = Object.assign(new Error("FORBIDDEN"), { data: { code: "FORBIDDEN" } });
    expect(presentUnknownError(error).kind).toBe("forbidden");
  });

  it("classifies from tRPC data.cause when the message is generic", () => {
    const error = Object.assign(new Error("Internal server error"), {
      data: { cause: "Failed query :: D1_ERROR: free tier daily row read limit" },
    });
    expect(presentUnknownError(error).kind).toBe("d1-read-limit");
  });
});

describe("explainError", () => {
  it("uses the short summary for tRPC messages", () => {
    const error = new Error(`Failed query: select "id" from "seasons"\nparams: `);
    error.cause = new Error("D1_ERROR: free tier daily row read limit");

    const explained = explainError(error);
    expect(explained.message).toContain("free-tier read limit");
    expect(explained.detail).toContain("D1_ERROR");
  });
});

describe("errorChain", () => {
  it("walks Error.cause", () => {
    const inner = new Error("inner");
    const outer = new Error("outer", { cause: inner });
    expect(errorChain(outer)).toEqual(["outer", "inner"]);
    expect(errorDetail(outer)).toBe("outer :: inner");
  });
});

describe("formatUnknownError", () => {
  it("includes tRPC data.cause under the short message", () => {
    const error = Object.assign(new Error("The database hit today's free-tier read limit."), {
      data: { cause: "Failed query: select id :: D1_ERROR: free tier daily row read limit" },
    });
    expect(formatUnknownError(error)).toContain("free-tier read limit");
    expect(formatUnknownError(error)).toContain("D1_ERROR");
    expect(formatErrorTitle(error)).toContain("couldn't load league data");
  });
});
