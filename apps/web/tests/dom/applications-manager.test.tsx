import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PortalErrorDetailProvider } from "@components/portal/portal-error-detail";
import { ApplicationsManager } from "@components/portal/applications-manager";

const update = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    applications: {
      update: { useMutation: () => ({ mutateAsync: update }) },
    },
  },
}));

const rows = [
  {
    id: 1,
    slug: "staff",
    name: "Staff application",
    type: "General staff position",
    description: "Help run the league.",
    url: "https://forms.gle/staff",
    status: "closed" as const,
    category: "staff" as const,
  },
];

describe("ApplicationsManager", () => {
  it("saves a form URL for the selected application", async () => {
    const user = userEvent.setup();
    update.mockResolvedValue({});

    render(
      <PortalErrorDetailProvider>
        <ApplicationsManager rows={rows} />
      </PortalErrorDetailProvider>,
    );

    expect(screen.getByText("Staff application")).toBeTruthy();
    expect(screen.getByText("closed")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Application URL"), {
      target: { value: "https://forms.gle/open" },
    });
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(update).toHaveBeenCalledWith({
      slug: "staff",
      url: "https://forms.gle/open",
      status: "closed",
    });
  });
});
