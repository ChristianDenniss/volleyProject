import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArticlesManager, type ArticleRow } from "@components/portal/articles-manager";
import { PortalErrorDetailProvider } from "@components/portal/portal-error-detail";

const update = vi.fn();
const remove = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    articles: {
      update: { useMutation: () => ({ mutateAsync: update }) },
      delete: { useMutation: () => ({ mutateAsync: remove }) },
    },
  },
}));

const BODY = JSON.stringify({
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "How the set unfolded" }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "The home side took the set in extra points." }],
    },
  ],
});

function row(overrides: Partial<ArticleRow> = {}): ArticleRow {
  return {
    id: 11,
    title: "Court report",
    summary: "A recap of the final.",
    content: BODY,
    imageUrl: "https://example.com/final.jpg",
    approved: null,
    likes: 3,
    authorName: "fixturewriter",
    createdAt: "2026-04-12T00:00:00.000Z",
    ...overrides,
  };
}

function mount(rows: ArticleRow[] = [row()]) {
  return render(
    <PortalErrorDetailProvider>
      <ArticlesManager rows={rows} />
    </PortalErrorDetailProvider>,
  );
}

async function chooseStatus(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole("button", { name }));
}

describe("ArticlesManager", () => {
  it("defaults to pending articles and can switch status", async () => {
    const user = userEvent.setup();
    mount([
      row({ id: 11, title: "Pending piece", approved: null }),
      row({ id: 12, title: "Live story", approved: true }),
      row({ id: 13, title: "Killed draft", approved: false }),
    ]);

    expect(screen.getByText("Pending piece")).toBeDefined();
    expect(screen.queryByText("Live story")).toBeNull();
    expect(screen.queryByText("Killed draft")).toBeNull();

    await chooseStatus(user, "Published (1)");
    expect(screen.getByText("Live story")).toBeDefined();
    expect(screen.queryByText("Pending piece")).toBeNull();

    await chooseStatus(user, "Rejected (1)");
    expect(screen.getByText("Killed draft")).toBeDefined();
    expect(screen.queryByText("Live story")).toBeNull();

    await chooseStatus(user, "All (3)");
    expect(screen.getByText("Pending piece")).toBeDefined();
    expect(screen.getByText("Live story")).toBeDefined();
    expect(screen.getByText("Killed draft")).toBeDefined();
  });

  it("approves and rejects from labeled buttons on the row", async () => {
    const user = userEvent.setup();
    update.mockResolvedValue({});
    mount([
      row({ id: 11, title: "Pending piece", approved: null }),
      row({ id: 12, title: "Live story", approved: true }),
    ]);

    expect(screen.getByRole("button", { name: "Approve" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Reject" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Approved" })).toBeNull();
    expect(screen.queryByLabelText("Published")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Approve" }));
    expect(update).toHaveBeenCalledWith({ id: 11, patch: { approved: true } });

    await chooseStatus(user, "Published (1)");
    await user.click(screen.getByRole("button", { name: "Reject" }));
    expect(update).toHaveBeenCalledWith({ id: 12, patch: { approved: false } });
  });

  it("opens a public-style preview when the row is clicked", async () => {
    const user = userEvent.setup();
    mount();

    await user.click(screen.getByRole("row", { name: "Preview Court report" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Article preview")).toBeDefined();
    expect(within(dialog).getByRole("heading", { name: "Court report" })).toBeDefined();
    expect(within(dialog).getByText("A recap of the final.")).toBeDefined();
    expect(within(dialog).getByText("How the set unfolded")).toBeDefined();
    expect(within(dialog).getByText("The home side took the set in extra points.")).toBeDefined();
    expect(within(dialog).getByText("This article is awaiting review and is not visible to the public yet.")).toBeDefined();
    expect(within(dialog).getByRole("img", { name: "Court report" })).toHaveProperty(
      "src",
      "https://example.com/final.jpg",
    );
    expect(within(dialog).getByRole("button", { name: "Approve" })).toBeDefined();
    expect(within(dialog).getByRole("button", { name: "Reject" })).toBeDefined();
  });
});
