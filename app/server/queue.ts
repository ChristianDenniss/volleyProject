import { eq } from "drizzle-orm";
import { makeDb, type Db } from "@db";
import { jobRuns } from "@db/schema";
import { recalculateRecords } from "./records-recalculation";

export const RECORDS_RECALCULATION = "records.recalculate";

export interface RecordsJobMessage {
  kind: typeof RECORDS_RECALCULATION;
  jobId: string;
  seasonId: number | null;
}

export interface QueueEnvironment {
  DB: D1Database;
  RECORDS_QUEUE: Queue<RecordsJobMessage>;
}

export async function enqueueRecalculation(
  db: Db,
  queue: Queue<RecordsJobMessage>,
  input: { seasonId?: number | null; requestedBy: string | null },
): Promise<{ jobId: string }> {
  const jobId = crypto.randomUUID();

  await db.insert(jobRuns).values({
    id: jobId,
    kind: RECORDS_RECALCULATION,
    status: "queued",
    requestedBy: input.requestedBy,
  });

  await queue.send({
    kind: RECORDS_RECALCULATION,
    jobId,
    seasonId: input.seasonId ?? null,
  });

  return { jobId };
}

export async function runRecordsJob(db: Db, message: RecordsJobMessage): Promise<void> {
  await db
    .update(jobRuns)
    .set({ status: "running", startedAt: new Date(), error: null })
    .where(eq(jobRuns.id, message.jobId));

  try {
    const { rowsWritten } = await recalculateRecords(db, { seasonId: message.seasonId });
    await db
      .update(jobRuns)
      .set({ status: "succeeded", finishedAt: new Date(), rowsWritten })
      .where(eq(jobRuns.id, message.jobId));
  } catch (error) {
    await db
      .update(jobRuns)
      .set({
        status: "failed",
        finishedAt: new Date(),
        error: error instanceof Error ? error.message : String(error),
      })
      .where(eq(jobRuns.id, message.jobId));
    throw error;
  }
}

export async function handleRecordsBatch(
  batch: MessageBatch<RecordsJobMessage>,
  environment: QueueEnvironment,
): Promise<void> {
  const db = makeDb(environment.DB);

  for (const message of batch.messages) {
    try {
      await runRecordsJob(db, message.body);
      message.ack();
    } catch {
      message.retry();
    }
  }
}

export async function latestJob(db: Db, kind: string = RECORDS_RECALCULATION) {
  const rows = await db.query.jobRuns.findMany({
    where: eq(jobRuns.kind, kind),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    limit: 1,
  });
  return rows[0] ?? null;
}
