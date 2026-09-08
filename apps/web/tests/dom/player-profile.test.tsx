import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { PlayerProfile } from "@components/site/player-profile";

const empty = {
  position: "Setter",
  currentSeasonNumber: null,
  teams: [],
  stats: [],
  awards: [],
};

describe("PlayerProfile avatar", () => {
  it("keeps a server-provided full-body URL", () => {
    render(
      <PlayerProfile
        name="luvlate"
        avatarUrl="https://tr.rbxcdn.com/full-body.png"
        {...empty}
      />,
    );

    expect(screen.getByAltText("luvlate's avatar")).toHaveProperty(
      "src",
      "https://tr.rbxcdn.com/full-body.png",
    );
  });

  it("fetches the full-body avatar when the server only had the fallback", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ avatarUrl: "https://tr.rbxcdn.com/fetched.png" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<PlayerProfile name="luvlate" avatarUrl={null} robloxUserId="327211334" {...empty} />);

    expect(screen.getByAltText("luvlate's avatar")).toHaveProperty(
      "src",
      expect.stringContaining("/images/pfpLogo.png"),
    );

    await waitFor(() => {
      expect(screen.getByAltText("luvlate's avatar")).toHaveProperty(
        "src",
        "https://tr.rbxcdn.com/fetched.png",
      );
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/roblox/avatar/luvlate?userId=327211334",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    vi.unstubAllGlobals();
  });
});
