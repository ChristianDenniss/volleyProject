import { describe, expect, it, vi } from "vitest";
import { insertStatsIgnoreBatch, type StatInsertRow } from "@db/insert";

const sampleRow: StatInsertRow = {
  playerId: 1,
  gameId: 2,
  spikeKills: 0,
  spikeAttempts: 0,
  spikingErrors: 0,
  apeKills: 0,
  apeAttempts: 0,
  assists: 0,
  settingErrors: 0,
  blocks: 0,
  blockFollows: 0,
  digs: 0,
  aces: 0,
  servingErrors: 0,
  miscErrors: 0,
};

describe("insertStatsIgnoreBatch", () => {
  it("binds created_at and updated_at for D1 batch inserts", async () => {
    const prepared = { bind: vi.fn().mockReturnThis() };
    const d1 = {
      prepare: vi.fn().mockReturnValue(prepared),
      batch: vi.fn().mockResolvedValue([]),
    } as unknown as D1Database;

    await insertStatsIgnoreBatch(d1, [sampleRow]);

    expect(d1.prepare).toHaveBeenCalledWith(expect.stringContaining("created_at"));
    expect(d1.prepare).toHaveBeenCalledWith(expect.stringContaining("updated_at"));
    const bindArgs = prepared.bind.mock.calls[0] as unknown[];
    expect(bindArgs).toHaveLength(17);
    expect(typeof bindArgs[15]).toBe("number");
    expect(bindArgs[15]).toBe(bindArgs[16]);
  });
});
