import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PortalErrorDetailProvider } from "@components/portal/portal-error-detail";
import { applySeasonRegionFilter } from "@components/portal/portal-filters";
import { SeasonsManager } from "@components/portal/seasons-manager";

const create = vi.fn();
const update = vi.fn();
const remove = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    seasons: {
      create: { useMutation: () => ({ mutateAsync: create }) },
      update: { useMutation: () => ({ mutateAsync: update }) },
      delete: { useMutation: () => ({ mutateAsync: remove }) },
      commitSheetImport: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
    },
    sheetImport: {
      startSession: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      loadMaster: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      loadRegionalBatch: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      assemblePreview: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
    },
  },
}));

function mount(
  rows: Array<{
    id: number;
    seasonNumber: number;
    startDate: string;
    endDate: string | null;
    theme: string | null;
    teamCount: number;
    gameCount: number;
  }> = [],
) {
  return render(
    <PortalErrorDetailProvider>
      <SeasonsManager rows={rows} />
    </PortalErrorDetailProvider>,
  );
}

describe("SeasonsManager", () => {
  it("lets create and import pick TBH as the end date", async () => {
    const user = userEvent.setup();
    create.mockResolvedValue({});
    mount();

    await user.click(screen.getByRole("button", { name: /new/i }));
    const createDialog = screen.getByRole("dialog");
    expect(within(createDialog).getByRole("button", { name: "TBH" }).getAttribute("aria-pressed")).toBe(
      "true",
    );

    fireEvent.change(within(createDialog).getByLabelText("Season number"), { target: { value: "12" } });
    fireEvent.change(within(createDialog).getByLabelText("Start date"), {
      target: { value: "2026-09-01" },
    });
    await user.click(within(createDialog).getByRole("button", { name: "Create" }));

    expect(create).toHaveBeenCalledWith({
      seasonNumber: 12,
      startDate: "2026-09-01",
      endDate: null,
      theme: null,
      image: null,
    });

    await user.click(screen.getByRole("button", { name: "Import from Sheets" }));
    const importDialog = screen.getByRole("dialog");
    expect(within(importDialog).getByRole("button", { name: "TBH" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("shows TBH for open seasons and restores a calendar date when one exists", async () => {
    const user = userEvent.setup();
    mount([
      {
        id: 1,
        seasonNumber: 8,
        startDate: "2026-01-05",
        endDate: null,
        theme: null,
        teamCount: 0,
        gameCount: 0,
      },
      {
        id: 2,
        seasonNumber: 7,
        startDate: "2025-08-01",
        endDate: "2025-10-15",
        theme: "Classic",
        teamCount: 8,
        gameCount: 12,
      },
    ]);

    expect(screen.getByText("TBH")).toBeDefined();
    expect(screen.getByText("2025-10-15")).toBeDefined();

    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]!);
    const openSeason = screen.getByRole("dialog");
    expect(within(openSeason).getByRole("button", { name: "TBH" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    await user.keyboard("{Escape}");

    await user.click(screen.getAllByRole("button", { name: "Edit" })[1]!);
    const closedSeason = screen.getByRole("dialog");
    expect(within(closedSeason).getByRole("button", { name: "TBH" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
    expect((within(closedSeason).getByLabelText("End date") as HTMLInputElement).value).toBe("2025-10-15");
  });

  it("filters seasons to those with games in the selected region", () => {
    mount([
      {
        id: 1,
        seasonNumber: 8,
        startDate: "2026-01-05",
        endDate: null,
        theme: "Open",
        teamCount: 10,
        gameCount: 20,
        regionStats: {
          na: { teamCount: 6, gameCount: 12 },
          eu: { teamCount: 4, gameCount: 8 },
        },
      },
      {
        id: 2,
        seasonNumber: 7,
        startDate: "2025-08-01",
        endDate: "2025-10-15",
        theme: "Classic",
        teamCount: 8,
        gameCount: 4,
        regionStats: {
          sa: { teamCount: 8, gameCount: 4 },
        },
      },
    ]);

    expect(screen.getByRole("combobox", { name: /region/i })).toBeDefined();
    expect(screen.getByText("All regions")).toBeDefined();

    const filtered = applySeasonRegionFilter(
      [
        {
          id: 1,
          teamCount: 10,
          gameCount: 20,
          regionStats: { na: { teamCount: 6, gameCount: 12 } },
        },
        {
          id: 2,
          teamCount: 8,
          gameCount: 4,
          regionStats: { sa: { teamCount: 8, gameCount: 4 } },
        },
      ],
      "na",
    );
    expect(filtered.map((row) => row.id)).toEqual([1]);
    expect(filtered[0]).toMatchObject({ teamCount: 6, gameCount: 12 });
  });
});
