import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import {
  RECORD_BOARD_SIZE,
  RecordsBoard,
  recordBoardSlots,
  type RecordRow,
} from "@components/site/records-board";

function record(overrides: Partial<RecordRow> & Pick<RecordRow, "id" | "rank" | "value" | "playerName">): RecordRow {
  return {
    type: "game",
    metric: "aces",
    minAttempts: null,
    playerId: overrides.id,
    seasonId: 1,
    seasonNumber: 4,
    gameId: null,
    gameName: null,
    ...overrides,
  };
}

describe("recordBoardSlots", () => {
  it("pads a short list to ten rows", () => {
    const slots = recordBoardSlots([
      record({ id: 1, rank: 1, value: 12, playerName: "alpha" }),
      record({ id: 2, rank: 2, value: 8, playerName: "bravo" }),
    ]);

    expect(slots).toHaveLength(RECORD_BOARD_SIZE);
    expect(slots[0]?.playerName).toBe("alpha");
    expect(slots[1]?.playerName).toBe("bravo");
    expect(slots.slice(2).every((slot) => slot === null)).toBe(true);
  });

  it("keeps the ten highest marks when a metric has more than ten rows", () => {
    const slots = recordBoardSlots(
      Array.from({ length: 12 }, (_, index) =>
        record({
          id: index + 1,
          rank: (index % 10) + 1,
          value: 12 - index,
          playerName: `p${index + 1}`,
        }),
      ),
    );

    expect(slots.map((slot) => slot?.playerName)).toEqual([
      "p1",
      "p2",
      "p3",
      "p4",
      "p5",
      "p6",
      "p7",
      "p8",
      "p9",
      "p10",
    ]);
  });
});

describe("RecordsBoard", () => {
  it("renders N/A rows so a short board stays ten entries high", () => {
    render(
      <RecordsBoard
        records={[
          record({ id: 1, rank: 1, value: 9, playerName: "alpha" }),
          record({ id: 2, rank: 2, value: 4, playerName: "bravo" }),
        ]}
      />,
    );

    const list = screen.getByRole("list");
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(10);
    expect(within(rows[0]!).getByRole("link", { name: "alpha" })).toBeTruthy();
    expect(within(rows[1]!).getByRole("link", { name: "bravo" })).toBeTruthy();
    expect(rows.slice(2).map((row) => row.textContent)).toEqual([
      "3N/A",
      "4N/A",
      "5N/A",
      "6N/A",
      "7N/A",
      "8N/A",
      "9N/A",
      "10N/A",
    ]);
  });
});
