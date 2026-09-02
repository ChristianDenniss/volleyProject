import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { makeDb, type Db } from "@db";
import { jobRuns, records } from "@db/schema";
import { insertMany } from "@db/insert";
import { ATTEMPT_THRESHOLDS, recalculateRecords } from "@server/records-recalculation";
import {
  enqueueRecalculation,
  handleRecordsBatch,
  RECORDS_RECALCULATION,
  runRecordsJob,
  type RecordsJobMessage,
} from "@server/queue";
import { records as recordsService } from "@server/services";
import { FIXTURES, seed } from "../fixtures/seed";

let db: Db;

beforeEach(async () => {
  db = makeDb(env.DB);
  await seed(db);
});

describe("recalculation in SQL", () => {
  it("replaces the whole table with ranked families", async () => {
    const before = await db.$count(records);
    expect(before).toBe(3);

    const { rowsWritten } = await recalculateRecords(db);
    expect(rowsWritten).toBeGreaterThan(before);

    const spikeKills = await recordsService.listByMetric(db, "spike kills");
    expect(spikeKills.length).toBeGreaterThan(0);
    expect(spikeKills[0]?.rank).toBe(1);
    expect(spikeKills.every((row) => row.rank >= 1 && row.rank <= 10)).toBe(true);
  });

  it("ranks a game family by value, highest first", async () => {
    await recalculateRecords(db);
    const rows = (await recordsService.listByMetric(db, "total kills")).filter(
      (row) => row.type === "game",
    );
    const values = rows.filter((row) => row.seasonId === FIXTURES.seasonId).map((row) => row.value);
    expect(values).toEqual([...values].sort((a, b) => b - a));
  });

  it("writes a season family aggregated per player", async () => {
    await recalculateRecords(db);
    const rows = await db.query.records.findMany({ where: eq(records.type, "season") });
    const perSeason = rows.filter(
      (row) => row.metric === "assists" && row.seasonId === FIXTURES.seasonId,
    );
    expect(perSeason.length).toBe(4);
    expect(new Set(perSeason.map((row) => row.playerId)).size).toBe(4);
  });

  it("splits the percentage family across attempt thresholds", async () => {
    await recalculateRecords(db);
    const rows = await db.query.records.findMany({
      where: eq(records.metric, "spiking percentage"),
    });
    const thresholds = new Set(rows.map((row) => row.minAttempts));
    expect(thresholds.size).toBeGreaterThan(1);
    expect([...thresholds].every((value) => ATTEMPT_THRESHOLDS.includes(value as number))).toBe(true);
    expect(rows.every((row) => row.value <= 100)).toBe(true);
  });

  it("touches only the season it was given", async () => {
    await recalculateRecords(db, { seasonId: FIXTURES.otherSeasonId });

    const survivors = await db.query.records.findMany({
      where: eq(records.seasonId, FIXTURES.seasonId),
    });
    expect(survivors).toHaveLength(3);

    const rebuilt = await db.query.records.findMany({
      where: eq(records.seasonId, FIXTURES.otherSeasonId),
    });
    expect(rebuilt.length).toBeGreaterThan(0);
  });

  it("stays inside D1 limits on a larger table", async () => {
    const rows = [];
    for (let gameId = 1; gameId <= 4; gameId += 1) {
      for (let playerId = 5; playerId <= 8; playerId += 1) {
        rows.push({
          playerId,
          gameId,
          spikeKills: 20 + playerId,
          spikeAttempts: 60 + playerId * 3,
          apeKills: 5,
          apeAttempts: 20,
          assists: playerId,
          digs: playerId,
          blocks: playerId,
        });
      }
    }
    await insertMany(db, (await import("@db/schema")).stats, rows);

    const { rowsWritten } = await recalculateRecords(db);
    expect(rowsWritten).toBeGreaterThan(0);
  });
});

describe("the queue job", () => {
  function fakeQueue() {
    const sent: unknown[] = [];
    return {
      sent,
      queue: {
        send: async (message: unknown) => {
          sent.push(message);
        },
        sendBatch: async () => {},
      } as unknown as Queue<never>,
    };
  }

  it("records a queued job and sends one message", async () => {
    const { queue, sent } = fakeQueue();
    const { jobId } = await enqueueRecalculation(db, queue, {
      seasonId: FIXTURES.seasonId,
      requestedBy: FIXTURES.adminId,
    });

    expect(sent).toEqual([
      { kind: RECORDS_RECALCULATION, jobId, seasonId: FIXTURES.seasonId },
    ]);

    const job = await db.query.jobRuns.findFirst({ where: eq(jobRuns.id, jobId) });
    expect(job?.status).toBe("queued");
    expect(job?.requestedBy).toBe(FIXTURES.adminId);
  });

  it("marks the job succeeded and counts the rows it wrote", async () => {
    const { queue } = fakeQueue();
    const { jobId } = await enqueueRecalculation(db, queue, {
      seasonId: null,
      requestedBy: FIXTURES.adminId,
    });

    await runRecordsJob(db, { kind: RECORDS_RECALCULATION, jobId, seasonId: null });

    const job = await db.query.jobRuns.findFirst({ where: eq(jobRuns.id, jobId) });
    expect(job?.status).toBe("succeeded");
    expect(job?.rowsWritten).toBeGreaterThan(0);
    expect(job?.finishedAt).toBeInstanceOf(Date);
  });

  it("acks a message whose job row has already gone", async () => {
    const acked: string[] = [];
    const retried: string[] = [];
    const batch = {
      messages: [
        {
          body: { kind: RECORDS_RECALCULATION, jobId: "missing-job", seasonId: null },
          ack: () => acked.push("missing-job"),
          retry: () => retried.push("missing-job"),
        },
      ],
    } as unknown as MessageBatch<RecordsJobMessage>;

    await handleRecordsBatch(batch, { DB: env.DB, RECORDS_QUEUE: fakeQueue().queue });

    expect(acked).toEqual(["missing-job"]);
    expect(retried).toEqual([]);
  });

  it("marks the job failed and asks the queue to retry when the work throws", async () => {
    const { queue } = fakeQueue();
    const { jobId } = await enqueueRecalculation(db, queue, {
      seasonId: null,
      requestedBy: FIXTURES.adminId,
    });

    const failing = new Proxy(env.DB, {
      get(target, property, receiver) {
        if (property === "prepare") {
          return (query: string) => {
            if (query.includes("insert into records")) throw new Error("insert refused");
            return target.prepare(query);
          };
        }
        const value = Reflect.get(target, property, receiver);
        return typeof value === "function" ? value.bind(target) : value;
      },
    }) as D1Database;

    const acked: string[] = [];
    const retried: string[] = [];
    const batch = {
      messages: [
        {
          body: { kind: RECORDS_RECALCULATION, jobId, seasonId: null },
          ack: () => acked.push(jobId),
          retry: () => retried.push(jobId),
        },
      ],
    } as unknown as MessageBatch<RecordsJobMessage>;

    await handleRecordsBatch(batch, { DB: failing, RECORDS_QUEUE: queue });

    expect(retried).toEqual([jobId]);
    expect(acked).toEqual([]);

    const job = await db.query.jobRuns.findFirst({ where: eq(jobRuns.id, jobId) });
    expect(job?.status).toBe("failed");
    expect(job?.error).toContain("Failed to run the query");
  });
});
