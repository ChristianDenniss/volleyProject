import { describe, expect, it } from "vitest";
import { formatSetDiff, formatWinPct, placementRank, rankStandings } from "@/lib/standings";

const team = (id: number, name: string, placement = "Didnt make playoffs") => ({
  id,
  name,
  logoUrl: null,
  placement,
});

describe("rankStandings", () => {
  it("orders teams by wins, then set differential", () => {
    const rows = rankStandings(
      [team(1, "Night Owls"), team(2, "Volt Diggers"), team(3, "Sand Kings"), team(4, "Echo Block")],
      [
        {
          status: "completed",
          team1Name: "Volt Diggers",
          team2Name: "Night Owls",
          team1Score: 3,
          team2Score: 1,
        },
        {
          status: "completed",
          team1Name: "Volt Diggers",
          team2Name: "Sand Kings",
          team1Score: 3,
          team2Score: 0,
        },
        {
          status: "completed",
          team1Name: "Night Owls",
          team2Name: "Sand Kings",
          team1Score: 3,
          team2Score: 2,
        },
        {
          status: "scheduled",
          team1Name: "Echo Block",
          team2Name: "Volt Diggers",
          team1Score: null,
          team2Score: null,
        },
      ],
    );

    expect(rows.map((row) => row.name)).toEqual([
      "Volt Diggers",
      "Night Owls",
      "Sand Kings",
      "Echo Block",
    ]);
    expect(rows[0]).toMatchObject({ rank: 1, wins: 2, losses: 0, setsFor: 6, setsAgainst: 1 });
    expect(rows[3]).toMatchObject({ rank: 4, played: 0, wins: 0, losses: 0 });
  });

  it("uses placement when the records are tied", () => {
    const rows = rankStandings(
      [team(1, "Alpha", "Quarter-finals"), team(2, "Bravo", "Champion")],
      [],
    );
    expect(rows.map((row) => row.name)).toEqual(["Bravo", "Alpha"]);
  });
});

describe("standings helpers", () => {
  it("formats empty and winning records", () => {
    expect(formatWinPct(0, 0)).toBe("—");
    expect(formatWinPct(3, 4)).toBe("75%");
    expect(formatSetDiff(4)).toBe("+4");
    expect(formatSetDiff(-2)).toBe("-2");
    expect(placementRank("Champion")).toBeLessThan(placementRank("Finalist"));
  });
});
