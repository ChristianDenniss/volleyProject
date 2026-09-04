import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const session = vi.hoisted(() => ({
  data: null as { user: { name: string; image: string | null; role?: string } } | null,
  isPending: false,
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => session,
}));

import { SiteAccount } from "@components/site/site-account";

describe("SiteAccount", () => {
  it("drops the signed-in chrome as soon as the client session is gone", () => {
    session.data = null;
    session.isPending = false;

    const { unmount } = render(
      <SiteAccount initialUser={{ name: "fixtureplayer", image: "/images/pfpLogo.png" }} />,
    );

    expect(screen.getByLabelText("Signed out")).toBeDefined();
    expect(screen.queryByText("fixtureplayer")).toBeNull();
    expect(screen.queryByAltText("Profile")).toBeNull();

    unmount();
    session.isPending = true;
    render(
      <SiteAccount initialUser={{ name: "fixtureplayer", image: "/images/pfpLogo.png" }} />,
    );

    expect(screen.getByLabelText("Signed out")).toBeDefined();
    expect(screen.queryByText("fixtureplayer")).toBeNull();
  });
});
