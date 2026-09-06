import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeBracket } from "@components/site/home-bracket";
import type { StandingRow } from "@/lib/standings";

function standing(row: Partial<StandingRow> & Pick<StandingRow, "id" | "name" | "rank">): StandingRow {
  return {
    logoUrl: null,
    placement: "Quarter-finals",
    played: row.wins ?? 0 + (row.losses ?? 0),
    wins: 0,
    losses: 0,
    setsFor: 0,
    setsAgainst: 0,
    setDiff: 0,
    winPct: 0,
    ...row,
  };
}

describe("HomeBracket", () => {
  it("puts the top three on a podium and the rest in the ranking table", () => {
    render(
      <HomeBracket
        phase="Playoffs"
        standings={[
          standing({ id: 1, name: "Volt Diggers", rank: 1, wins: 4, losses: 0, setsFor: 12, setsAgainst: 3, setDiff: 9, winPct: 1, placement: "Finalist" }),
          standing({ id: 2, name: "Crimson Floor", rank: 2, wins: 3, losses: 1, setsFor: 10, setsAgainst: 5, setDiff: 5, winPct: 0.75, placement: "Finalist" }),
          standing({ id: 3, name: "Night Owls", rank: 3, wins: 3, losses: 2, setsFor: 9, setsAgainst: 7, setDiff: 2, winPct: 0.6, placement: "Semi-finals" }),
          standing({ id: 4, name: "Sand Kings", rank: 4, wins: 1, losses: 3, setsFor: 5, setsAgainst: 10, setDiff: -5, winPct: 0.25 }),
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Bracket" })).toBeDefined();
    expect(screen.getByText("Playoffs standings — who sits where in the table.")).toBeDefined();
    expect(screen.getByLabelText("Top three teams")).toBeDefined();
    expect(screen.getByRole("link", { name: /Volt Diggers/ }).getAttribute("href")).toBe(
      "/teams/Volt%20Diggers",
    );
    expect(screen.getByRole("columnheader", { name: "Team" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "GP" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Sand Kings" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Teams" }).getAttribute("href")).toBe("/teams");
    expect(screen.queryByRole("cell", { name: "Volt Diggers" })).toBeNull();
  });

  it("renders nothing when there are no teams", () => {
    const { container } = render(<HomeBracket phase="Qualifiers" standings={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("shows only the top 10 teams", () => {
    const standings = Array.from({ length: 12 }, (_, index) =>
      standing({
        id: index + 1,
        name: `Team ${index + 1}`,
        rank: index + 1,
        wins: 12 - index,
        losses: index,
      }),
    );

    render(<HomeBracket phase="Qualifiers" standings={standings} />);

    expect(screen.getByRole("link", { name: "Team 10" })).toBeDefined();
    expect(screen.queryByRole("link", { name: "Team 11" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Team 12" })).toBeNull();
  });
});
