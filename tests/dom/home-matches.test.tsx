import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomeMatches } from "@components/site/home-matches";

const matches = [
  {
    id: 1,
    date: "2026-06-03T00:00:00.000Z",
    round: "Week 1",
    status: "completed",
    matchNumber: "M1",
    team1Name: "Ocean Spikers",
    team2Name: "Mountain Blockers",
    team1LogoUrl: null,
    team2LogoUrl: null,
    team1Score: 3,
    team2Score: 1,
    setLine: "25-20 · 25-18",
  },
  {
    id: 2,
    date: "2026-06-10T00:00:00.000Z",
    round: "Week 2",
    status: "scheduled",
    matchNumber: "M2",
    team1Name: "Desert Servers",
    team2Name: "Forest Diggers",
    team1LogoUrl: null,
    team2LogoUrl: null,
    team1Score: null,
    team2Score: null,
    setLine: "",
  },
];

describe("HomeMatches", () => {
  it("defaults to the next scheduled day and can switch dates", async () => {
    const user = userEvent.setup();
    render(<HomeMatches matches={matches} seasonLabel="Season 1" phase="Qualifiers" />);

    expect(screen.getByText("Desert Servers")).toBeDefined();
    expect(screen.queryByText("Ocean Spikers")).toBeNull();

    await user.click(screen.getByRole("button", { name: /Wed 03 Jun/i }));
    expect(screen.getByText("Ocean Spikers")).toBeDefined();
    expect(screen.getByText("25-20 · 25-18")).toBeDefined();
  });

  it("keeps empty days in the range so the strip stays continuous", async () => {
    const user = userEvent.setup();
    render(<HomeMatches matches={matches} seasonLabel="Season 1" phase="Qualifiers" />);

    expect(screen.getByRole("button", { name: /Thu 04 Jun, no matches/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Tue 09 Jun, no matches/i })).toBeDefined();

    await user.click(screen.getByRole("button", { name: /Thu 04 Jun, no matches/i }));
    expect(screen.getByText("No matches on this day")).toBeDefined();
  });
});
