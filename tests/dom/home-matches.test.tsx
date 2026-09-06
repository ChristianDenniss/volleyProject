import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomeMatches, type HomeMatch } from "@components/site/home-matches";

function utcDay(offset: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function matchOn(id: number, day: string, extras: Partial<HomeMatch> = {}): HomeMatch {
  return {
    id,
    date: `${day}T00:00:00.000Z`,
    round: "Week 1",
    status: "scheduled",
    matchNumber: `M${id}`,
    team1Name: `Team ${id}`,
    team2Name: "Opp",
    team1LogoUrl: null,
    team2LogoUrl: null,
    team1Score: null,
    team2Score: null,
    setLine: "",
    ...extras,
  };
}

function dayLabel(day: string, empty = false) {
  const parsed = new Date(`${day}T00:00:00.000Z`);
  const weekday = parsed.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  const date = parsed.toLocaleDateString("en-US", { day: "2-digit", timeZone: "UTC" });
  const month = parsed.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  return new RegExp(`${weekday} ${date} ${month}${empty ? ", no matches" : ""}`, "i");
}

const pastDay = utcDay(-5);
const emptyDay = utcDay(-4);
const upcomingDay = utcDay(3);

const matches = [
  matchOn(1, pastDay, {
    status: "completed",
    team1Name: "Ocean Spikers",
    team2Name: "Mountain Blockers",
    team1Score: 3,
    team2Score: 1,
    setLine: "25-20 · 25-18",
  }),
  matchOn(2, upcomingDay, {
    team1Name: "Desert Servers",
    team2Name: "Forest Diggers",
  }),
];

function mockDateStrip(strip: HTMLElement) {
  const scrollTo = vi.fn();
  let scrollLeft = 0;

  Object.defineProperty(strip, "scrollTo", {
    configurable: true,
    value: (opts: ScrollToOptions) => {
      scrollLeft = opts.left ?? 0;
      scrollTo(opts);
    },
  });
  Object.defineProperty(strip, "scrollLeft", {
    configurable: true,
    get: () => scrollLeft,
  });

  strip.getBoundingClientRect = () =>
    ({
      left: 0,
      width: 400,
      right: 400,
      top: 0,
      bottom: 80,
      height: 80,
      x: 0,
      y: 0,
      toJSON() {},
    }) as DOMRect;

  for (const [index, chip] of strip.querySelectorAll<HTMLElement>("[data-date]").entries()) {
    chip.getBoundingClientRect = () => {
      const left = index * 114 - scrollLeft;
      return {
        left,
        width: 104,
        right: left + 104,
        top: 0,
        bottom: 92,
        height: 92,
        x: left,
        y: 0,
        toJSON() {},
      } as DOMRect;
    };
  }

  return scrollTo;
}

describe("HomeMatches", () => {
  it("shows the selected day's matches and can switch dates", async () => {
    const user = userEvent.setup();
    render(<HomeMatches matches={matches} seasonLabel="Season 1" phase="Qualifiers" />);

    expect(screen.getByText("No matches on this day")).toBeDefined();

    await user.click(screen.getByRole("button", { name: dayLabel(pastDay) }));
    expect(screen.getByText("Ocean Spikers")).toBeDefined();
    expect(screen.getByText("25-20 · 25-18")).toBeDefined();

    await user.click(screen.getByRole("button", { name: dayLabel(upcomingDay) }));
    expect(screen.getByText("Desert Servers")).toBeDefined();
  });

  it("keeps empty days in the range so the strip stays continuous", async () => {
    const user = userEvent.setup();
    render(<HomeMatches matches={matches} seasonLabel="Season 1" phase="Qualifiers" />);

    expect(screen.getByRole("button", { name: dayLabel(emptyDay, true) })).toBeDefined();

    await user.click(screen.getByRole("button", { name: dayLabel(emptyDay, true) }));
    const empty = screen.getByText("No matches on this day");
    expect(empty).toBeDefined();
    expect(empty.parentElement?.textContent).toContain(":(");
    expect(empty.parentElement?.className).not.toContain("border");
  });

  it("keeps an equal number of days on either side of today", () => {
    render(
      <HomeMatches
        matches={[
          matchOn(1, utcDay(-5), { status: "completed", team1Name: "Past Side" }),
          matchOn(2, utcDay(2), { team1Name: "Soon Side" }),
        ]}
        seasonLabel="Season 1"
        phase="Qualifiers"
      />,
    );

    const today = utcDay(0);
    const chips = [...screen.getByLabelText("Match dates").querySelectorAll("[data-date]")];
    const days = chips.map((chip) => chip.getAttribute("data-date"));
    const todayIndex = days.indexOf(today);

    expect(todayIndex).toBeGreaterThan(-1);
    expect(todayIndex).toBe(days.length - 1 - todayIndex);
    expect(days[0]).toBe(utcDay(-15));
    expect(days.at(-1)).toBe(utcDay(15));
    expect(screen.getByRole("button", { pressed: true }).getAttribute("data-date")).toBe(today);
  });

  it("defaults to today when that day is in the season range", () => {
    const today = utcDay(0);
    render(
      <HomeMatches
        matches={[
          matchOn(1, utcDay(-8), { status: "completed", team1Name: "Past Side" }),
          matchOn(2, today, { team1Name: "Today Side" }),
          matchOn(3, utcDay(8), { team1Name: "Future Side" }),
        ]}
        seasonLabel="Season 1"
        phase="Qualifiers"
      />,
    );

    expect(screen.getByText("Today Side")).toBeDefined();
    expect(screen.getByRole("button", { pressed: true }).getAttribute("data-date")).toBe(today);
    expect(screen.queryByText("Past Side")).toBeNull();
    expect(screen.queryByText("Future Side")).toBeNull();
  });

  it("keeps a two-match floor and only grows when the selected day is busier", async () => {
    const user = userEvent.setup();
    const today = utcDay(0);
    const packed = utcDay(-2);
    render(
      <HomeMatches
        matches={[
          matchOn(1, packed, { team1Name: "First Side" }),
          matchOn(2, packed, { id: 12, team1Name: "Second Side" }),
          matchOn(3, packed, { id: 13, team1Name: "Third Side" }),
          matchOn(4, packed, { id: 14, team1Name: "Fourth Side" }),
          matchOn(5, today, { team1Name: "Today Side" }),
        ]}
        seasonLabel="Season 1"
        phase="Qualifiers"
      />,
    );

    const panel = screen.getByLabelText("Matches for selected day");
    expect(panel.style.getPropertyValue("--match-slots")).toBe("2");

    const emptyDay = screen.getAllByRole("button", { name: /no matches/i })[0];
    if (!emptyDay) throw new Error("expected an empty-day chip");
    await user.click(emptyDay);
    expect(screen.getByText("No matches on this day")).toBeDefined();
    expect(screen.getByLabelText("Matches for selected day").style.getPropertyValue("--match-slots")).toBe("2");

    await user.click(screen.getByRole("button", { name: dayLabel(packed) }));
    expect(screen.getByText("Fourth Side")).toBeDefined();
    expect(screen.getByLabelText("Matches for selected day").style.getPropertyValue("--match-slots")).toBe("4");
  });

  it("scrolls the date strip so the next day slides into the centre", async () => {
    const user = userEvent.setup();
    const today = utcDay(0);
    const tomorrow = utcDay(1);
    render(
      <HomeMatches
        matches={[
          matchOn(1, utcDay(-10), { status: "completed", team1Name: "Past Side" }),
          matchOn(2, today, { team1Name: "Today Side" }),
          matchOn(3, tomorrow, { team1Name: "Tomorrow Side" }),
        ]}
        seasonLabel="Season 1"
        phase="Qualifiers"
      />,
    );

    const strip = screen.getByLabelText("Match dates");
    const scrollTo = mockDateStrip(strip);

    await user.click(screen.getByRole("button", { name: "Next day" }));

    expect(screen.getByText("Tomorrow Side")).toBeDefined();
    expect(screen.queryByText("Today Side")).toBeNull();
    expect(scrollTo).toHaveBeenCalledWith({ left: expect.any(Number), behavior: "smooth" });
    expect(scrollTo.mock.calls.at(-1)?.[0]?.left).toBeGreaterThan(0);
  });
});
