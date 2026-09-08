import { makeDb } from "@db";
import { UPLOAD_STAGING_PREFIX } from "@/lib/uploads";
import { logError } from "./report";
import { process as processUpload } from "./services/uploads";

export const UPLOADS_QUEUE = "volley-uploads";

interface R2EventMessage {
  account: string;
  bucket: string;
  object: { key: string; size?: number; eTag?: string };
  action: string;
  eventTime?: string;
}

export function stagingKeyOf(body: unknown): string | null {
  const message = body as Partial<R2EventMessage> | undefined;
  const key = message?.object?.key;
  if (typeof key !== "string") return null;
  if (!key.startsWith(UPLOAD_STAGING_PREFIX)) return null;
  if (message?.action !== undefined && !message.action.startsWith("PutObject")) return null;
  return key;
}

export async function handleUploadsBatch(
  batch: MessageBatch<unknown>,
  environment: { DB: D1Database },
): Promise<void> {
  const db = makeDb(environment.DB);

  for (const message of batch.messages) {
    const key = stagingKeyOf(message.body);

    if (key === null) {
      message.ack();
      continue;
    }

    try {
      await processUpload(db, key);
      message.ack();
    } catch (error) {
      logError("queue.uploads", error, { key });
      message.retry();
    }
  }
}
