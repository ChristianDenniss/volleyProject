import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DateOrTbhField,
  SEASON_END_TBH,
  seasonEndDateFromForm,
  seasonEndDateToForm,
} from "@components/portal/date-or-tbh-field";
import { useState } from "react";

function Harness({ initial = SEASON_END_TBH }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <label htmlFor="end">End date</label>
      <DateOrTbhField id="end" value={value} onChange={setValue} />
    </>
  );
}

describe("season end date helpers", () => {
  it("treats TBH and blank as an open-ended season", () => {
    expect(seasonEndDateFromForm("TBH")).toBeNull();
    expect(seasonEndDateFromForm("")).toBeNull();
    expect(seasonEndDateFromForm("2026-09-01")).toBe("2026-09-01");
    expect(seasonEndDateToForm(null)).toBe(SEASON_END_TBH);
    expect(seasonEndDateToForm("2026-09-01")).toBe("2026-09-01");
  });
});

describe("DateOrTbhField", () => {
  it("selects TBH by default and swapping to a date clears it", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const tbh = screen.getByRole("button", { name: "TBH" });
    expect(tbh.getAttribute("aria-pressed")).toBe("true");

    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-10-01" } });
    expect(tbh.getAttribute("aria-pressed")).toBe("false");
    expect((screen.getByLabelText("End date") as HTMLInputElement).value).toBe("2026-10-01");

    await user.click(tbh);
    expect(tbh.getAttribute("aria-pressed")).toBe("true");
    expect((screen.getByLabelText("End date") as HTMLInputElement).value).toBe("");
  });
});
